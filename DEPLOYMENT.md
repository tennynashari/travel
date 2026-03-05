# 🚀 Panduan Deployment ke Ubuntu 24.04

Panduan lengkap untuk deploy aplikasi Travel Booking ke server Ubuntu 24.04 dengan Nginx dan PostgreSQL.

## 📋 Prerequisites

Server Ubuntu 24.04 dengan:
- ✅ Nginx installed
- ✅ PostgreSQL installed
- ✅ SSH access dengan sudo privileges
- ✅ Domain name (opsional, bisa pakai IP)
- ✅ Minimal 2GB RAM, 20GB storage

## 🔧 Persiapan Server

### 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Dependencies

```bash
# Install curl, git, dan build tools
sudo apt install -y curl git build-essential

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 4. Verifikasi PostgreSQL

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Login ke PostgreSQL
sudo -u postgres psql

# Di dalam psql console:
CREATE DATABASE travel_db;
CREATE USER travel_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE travel_db TO travel_user;

-- Connect ke database dan grant schema permissions (PostgreSQL 15+)
\c travel_db
GRANT ALL ON SCHEMA public TO travel_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO travel_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO travel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO travel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO travel_user;
\q
```

### 5. Konfigurasi Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 📦 Deployment

### Opsi 1: Menggunakan Script Otomatis (Recommended)

```bash
# Clone repository
cd /tmp
git clone https://github.com/yourusername/travel.git
cd travel

# Jalankan deployment script
sudo bash deployment/deploy.sh
```

Script ini akan otomatis:
- Install Node.js dan PM2
- Clone/update repository
- Install dependencies (backend & frontend)
- Build frontend
- Setup database dengan Prisma
- Konfigurasi Nginx
- Start backend dengan PM2

### Opsi 2: Manual Deployment

#### Step 1: Clone Repository

```bash
# Buat directory untuk aplikasi
sudo mkdir -p /var/www/travel
sudo chown -R $USER:$USER /var/www/travel

# Clone repository
cd /var/www/travel
git clone https://github.com/yourusername/travel.git .
```

#### Step 2: Setup Backend

```bash
cd /var/www/travel/backend

# Install dependencies
npm install --production

# Copy dan edit file .env
nano .env
```

Isi file `.env`:

```env
# Database
DATABASE_URL="postgresql://travel_user:your_strong_password@localhost:5432/travel_db"

# Server
PORT=7000
NODE_ENV=production

# JWT Secret (generate random string)
JWT_SECRET=your_very_long_random_secret_key_here

# CORS (domain frontend Anda)
CORS_ORIGIN=http://your-domain.com
```

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed database dengan data awal
node prisma/seed.js
```

#### Step 3: Setup Frontend

```bash
cd /var/www/travel/frontend

# Install dependencies
npm install

# Update API URL di vite.config.js atau .env jika perlu
# Pastikan API_URL mengarah ke domain/IP server

# Build untuk production
npm run build

# Hasil build ada di folder dist/
```

#### Step 4: Konfigurasi Nginx

```bash
# Copy konfigurasi nginx
sudo cp /var/www/travel/deployment/nginx.conf /etc/nginx/sites-available/travel

# Edit konfigurasi, ganti 'your-domain.com' dengan domain Anda
sudo nano /etc/nginx/sites-available/travel

# Enable site
sudo ln -s /etc/nginx/sites-available/travel /etc/nginx/sites-enabled/

# Hapus default site (opsional)
sudo rm /etc/nginx/sites-enabled/default

# Test konfigurasi
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### Step 5: Start Backend dengan PM2

```bash
cd /var/www/travel/backend

# Start aplikasi
pm2 start src/server.js --name travel-backend

# Set PM2 auto-start on reboot
pm2 startup systemd
# Copy dan jalankan command yang muncul

# Save PM2 process list
pm2 save

# Check status
pm2 status
pm2 logs travel-backend
```

#### Step 6: Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/travel
sudo chmod -R 755 /var/www/travel
```

## 🔐 Setup SSL dengan Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Dapatkan SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal sudah default aktif, test dengan:
sudo certbot renew --dry-run
```

Nginx config akan otomatis diupdate untuk menggunakan HTTPS.

## 🔄 Update Aplikasi

Setiap kali ada update kode:

```bash
cd /var/www/travel

# Pull latest code
git pull origin master

# Update backend
cd backend
npm install --production
npx prisma migrate deploy
npx prisma generate

# Update frontend
cd ../frontend
npm install
npm run build

# Restart backend
pm2 restart travel-backend

# Reload nginx (jika ada perubahan config)
sudo systemctl reload nginx
```

Atau gunakan script update:

```bash
sudo bash /var/www/travel/deployment/deploy.sh
```

## 📊 Monitoring & Maintenance

### PM2 Commands

```bash
# View logs
pm2 logs travel-backend

# View real-time monitoring
pm2 monit

# Restart aplikasi
pm2 restart travel-backend

# Stop aplikasi
pm2 stop travel-backend

# Delete dari PM2
pm2 delete travel-backend
```

### Nginx Commands

```bash
# Check status
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Commands

```bash
# Login ke database
sudo -u postgres psql -d travel_db

# Backup database
sudo -u postgres pg_dump travel_db > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql travel_db < backup_20260222.sql
```

### Disk Usage

```bash
# Check disk usage
df -h

# Check folder size
du -sh /var/www/travel/*

# Clean npm cache
npm cache clean --force

# Clean PM2 logs
pm2 flush
```

## 🐛 Troubleshooting

### Backend tidak bisa diakses

```bash
# Check apakah backend running
pm2 status

# Check logs untuk error
pm2 logs travel-backend --lines 100

# Check port 7000 terbuka
sudo netstat -tlnp | grep 7000

# Test backend langsung
curl http://localhost:7000/api/health
```

### Frontend menampilkan 404

```bash
# Check apakah build folder ada
ls -la /var/www/travel/frontend/dist

# Rebuild frontend
cd /var/www/travel/frontend
npm run build

# Check nginx config
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database connection error

```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Check connection
sudo -u postgres psql -d travel_db

# Verify DATABASE_URL di .env
cat /var/www/travel/backend/.env | grep DATABASE_URL

# Check prisma client generated
ls -la /var/www/travel/backend/node_modules/.prisma
```

### Permission issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/travel

# Fix permissions
sudo chmod -R 755 /var/www/travel
```

## 📁 Struktur File di Server

```
/var/www/travel/
├── backend/
│   ├── node_modules/
│   ├── prisma/
│   ├── src/
│   ├── .env                    # ⚠️ File penting, jangan commit ke git
│   └── package.json
├── frontend/
│   ├── dist/                   # Build output untuk production
│   ├── src/
│   └── package.json
├── deployment/
│   ├── nginx.conf
│   ├── travel-backend.service
│   └── deploy.sh
└── README.md
```

## 🔒 Security Best Practices

1. **Environment Variables**: Jangan commit file `.env` ke repository
2. **Database**: Gunakan password yang kuat untuk PostgreSQL
3. **JWT Secret**: Generate secret key yang panjang dan random
4. **Firewall**: Hanya buka port yang diperlukan (22, 80, 443)
5. **SSL**: Selalu gunakan HTTPS di production
6. **Updates**: Regularly update sistem dan dependencies
7. **Backup**: Setup automatic database backup
8. **User Permissions**: Jangan run aplikasi sebagai root

## 📞 Support

Jika mengalami masalah:
1. Check logs: `pm2 logs travel-backend`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all services running: `pm2 status`, `sudo systemctl status nginx postgresql`

## 📝 Checklist Deployment

- [ ] Server Ubuntu 24.04 ready
- [ ] PostgreSQL installed dan running
- [ ] Nginx installed dan running
- [ ] Node.js 20.x installed
- [ ] PM2 installed
- [ ] Repository cloned
- [ ] Database created
- [ ] .env file configured
- [ ] Backend dependencies installed
- [ ] Database migrations run
- [ ] Frontend built
- [ ] Nginx configured
- [ ] Backend running dengan PM2
- [ ] SSL certificate installed (optional but recommended)
- [ ] Firewall configured
- [ ] Application accessible via browser

---

**Happy Deploying! 🎉**
