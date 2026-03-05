#!/bin/bash

# Travel Booking App - Deployment Script
# Ubuntu 24.04 dengan Nginx dan PostgreSQL

set -e  # Exit on error

echo "=========================================="
echo "Travel Booking App - Deployment Script"
echo "=========================================="

# Configuration
APP_DIR="/var/www/travel"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
REPO_URL="https://github.com/yourusername/travel.git"  # Ganti dengan URL repo Anda
BRANCH="master"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script with sudo"
    exit 1
fi

# Step 1: Install Node.js if not installed
print_info "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_info "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    print_info "Node.js already installed: $(node --version)"
fi

# Step 2: Install PM2 globally for process management
print_info "Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    print_info "Installing PM2..."
    npm install -g pm2
else
    print_info "PM2 already installed: $(pm2 --version)"
fi

# Step 3: Create application directory
print_info "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Step 4: Clone or pull repository
if [ -d "$APP_DIR/.git" ]; then
    print_info "Updating existing repository..."
    git pull origin $BRANCH
else
    print_info "Cloning repository..."
    # If APP_DIR is not empty, we need to clone differently
    if [ "$(ls -A $APP_DIR)" ]; then
        print_warning "Directory not empty, creating backup..."
        mv $APP_DIR ${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)
        mkdir -p $APP_DIR
    fi
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
    git checkout $BRANCH
fi

# Step 5: Setup Backend
print_info "Setting up backend..."
cd $BACKEND_DIR

# Install dependencies
print_info "Installing backend dependencies..."
npm install --production

# Check if .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_warning ".env file not found. Please create one based on .env.example"
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp .env.example .env
        print_info "Created .env from .env.example - Please update with your values"
    fi
fi

# Run database migrations
print_info "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client
print_info "Generating Prisma Client..."
npx prisma generate

# Optional: Seed database (comment out if not needed)
# print_info "Seeding database..."
# node prisma/seed.js

# Step 6: Setup Frontend
print_info "Setting up frontend..."
cd $FRONTEND_DIR

# Install dependencies
print_info "Installing frontend dependencies..."
npm install

# Build frontend
print_info "Building frontend..."
npm run build

# Step 7: Setup Nginx
print_info "Setting up Nginx configuration..."
if [ -f "$APP_DIR/deployment/nginx.conf" ]; then
    cp $APP_DIR/deployment/nginx.conf /etc/nginx/sites-available/travel
    ln -sf /etc/nginx/sites-available/travel /etc/nginx/sites-enabled/travel
    
    # Test nginx configuration
    nginx -t
    
    # Reload nginx
    systemctl reload nginx
    print_info "Nginx configured successfully"
else
    print_warning "Nginx config file not found at deployment/nginx.conf"
fi

# Step 8: Setup systemd service (alternative to PM2)
# Uncomment if you prefer systemd over PM2
# print_info "Setting up systemd service..."
# if [ -f "$APP_DIR/deployment/travel-backend.service" ]; then
#     cp $APP_DIR/deployment/travel-backend.service /etc/systemd/system/
#     systemctl daemon-reload
#     systemctl enable travel-backend
#     systemctl restart travel-backend
#     print_info "Systemd service configured successfully"
# fi

# Step 9: Start/Restart backend with PM2
print_info "Starting backend with PM2..."
cd $BACKEND_DIR

# Stop existing process if any
pm2 delete travel-backend 2>/dev/null || true

# Start the application
pm2 start src/server.js --name travel-backend --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u www-data --hp /var/www

print_info "Backend started with PM2"

# Step 10: Set proper permissions
print_info "Setting proper permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

echo ""
print_info "=========================================="
print_info "Deployment completed successfully!"
print_info "=========================================="
echo ""
print_info "Next steps:"
echo "  1. Update .env file with production values: nano $BACKEND_DIR/.env"
echo "  2. Update nginx config with your domain: nano /etc/nginx/sites-available/travel"
echo "  3. Test your application"
echo ""
print_info "Useful commands:"
echo "  - View backend logs: pm2 logs travel-backend"
echo "  - Restart backend: pm2 restart travel-backend"
echo "  - Stop backend: pm2 stop travel-backend"
echo "  - Nginx reload: sudo systemctl reload nginx"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
