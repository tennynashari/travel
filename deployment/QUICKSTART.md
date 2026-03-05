# 🚀 Quick Start Deployment

Panduan singkat untuk deploy cepat ke Ubuntu 24.04.

## Prerequisites
- Ubuntu 24.04 server dengan SSH access
- Nginx installed
- PostgreSQL installed
- Domain/IP address

## 5 Langkah Deployment

### 1️⃣ Persiapan Database

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE travel_db;
CREATE USER travel_user WITH PASSWORD 'password_kuat_anda';
GRANT ALL PRIVILEGES ON DATABASE travel_db TO travel_user;

-- Connect dan grant schema permissions (penting untuk PostgreSQL 15+)
\c travel_db
GRANT ALL ON SCHEMA public TO travel_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO travel_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO travel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO travel_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO travel_user;
\q
```

### 2️⃣ Clone & Setup

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Install PM2
sudo npm install -g pm2

# Clone project
sudo mkdir -p /var/www/travel
cd /var/www/travel
git clone YOUR_REPO_URL .
```

### 3️⃣ Konfigurasi Environment

```bash
cd /var/www/travel/backend
cp .env.production .env
nano .env  # Edit dengan konfigurasi Anda
```

Update minimal:
- `DATABASE_URL` dengan password PostgreSQL
- `JWT_SECRET` (generate dengan: `bash ../deployment/generate-secrets.sh`)
- `CORS_ORIGIN` dengan domain Anda

### 4️⃣ Install & Build

```bash
# Backend
cd /var/www/travel/backend
npm install --production
npx prisma migrate deploy
npx prisma generate

# Frontend
cd /var/www/travel/frontend
npm install
npm run build
```

### 5️⃣ Deploy

```bash
# Setup Nginx
sudo cp /var/www/travel/deployment/nginx.conf /etc/nginx/sites-available/travel
sudo nano /etc/nginx/sites-available/travel  # Update domain
sudo ln -s /etc/nginx/sites-available/travel /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Start Backend
cd /var/www/travel/backend
pm2 start src/server.js --name travel-backend
pm2 save
pm2 startup

# Set Permissions
sudo chown -R www-data:www-data /var/www/travel
```

## ✅ Verifikasi

```bash
# Check backend
pm2 status
curl http://localhost:7000/api/health

# Check frontend
curl http://localhost
```

Buka browser: `http://YOUR_IP_OR_DOMAIN`

## 🔄 Update Aplikasi

```bash
cd /var/www/travel
git pull
cd backend && npm install --production && npx prisma migrate deploy
cd ../frontend && npm install && npm run build
pm2 restart travel-backend
```

## 📖 Dokumentasi Lengkap

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk panduan lengkap, troubleshooting, dan security best practices.

## 🆘 Troubleshooting Cepat

**Backend error?**
```bash
pm2 logs travel-backend
```

**Nginx error?**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Database error?**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -d travel_db
```

---

**Need help?** Check [DEPLOYMENT.md](DEPLOYMENT.md) atau logs di atas.
