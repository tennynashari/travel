# Travel Transportation Management System

Aplikasi web untuk mengelola layanan transportasi travel antar kota dengan fitur lengkap untuk booking, manajemen armada, pembayaran, dan check-in penumpang.

## 🚀 Tech Stack

### Backend
- **Framework**: Express.js 4.18.2
- **Database**: PostgreSQL
- **ORM**: Prisma 5.7.0
- **Authentication**: JWT + bcryptjs
- **CORS**: Enabled for cross-origin requests

### Frontend
- **Framework**: React.js 18 + Vite 5.0.8
- **Styling**: Tailwind CSS 3.3.6
- **Routing**: React Router v6.20.1
- **HTTP Client**: Axios 1.6.2
- **UI**: Responsive design with role-based navigation

## 📋 Prerequisites

### Untuk Windows:
- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm >= 9.x

### Untuk Ubuntu 24:
Aplikasi ini **100% kompatibel** dengan Ubuntu 24! Semua teknologi bersifat cross-platform.

## 🐧 Installation di Ubuntu 24

### 1. Install Node.js dan npm

```bash
# Update package index
sudo apt update

# Install Node.js dan npm
sudo apt install -y nodejs npm

# Verifikasi instalasi
node --version  # Minimal 18.x
npm --version
```

Jika versi Node.js terlalu lama, install versi terbaru:

```bash
# Install Node.js 20.x dari NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verifikasi status
sudo systemctl status postgresql
```

### 3. Setup Database

```bash
# Masuk ke PostgreSQL sebagai user postgres
sudo -u postgres psql
```

Di dalam PostgreSQL prompt:

```sql
-- Buat database
CREATE DATABASE travel;

-- Buat user
CREATE USER travel WITH PASSWORD 'travel';

-- Berikan semua privileges
GRANT ALL PRIVILEGES ON DATABASE travel TO travel;

-- Connect ke database travel
\c travel

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO travel;

-- Exit
\q
```

### 4. Clone/Setup Project

```bash
# Navigate ke direktori project
cd /path/to/travel

# Atau copy dari Windows ke Ubuntu
# scp -r /path/on/windows user@ubuntu:/path/to/travel

# Berikan permission
sudo chown -R $USER:$USER .
```

### 5. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# File .env sudah tersedia dengan konfigurasi:
# DATABASE_URL="postgresql://travel:travel@localhost:5432/travel?schema=public"
# JWT_SECRET="travel-app-secret-key-2026"
# PORT=5000
# NODE_ENV=development

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database dengan dummy data
npm run prisma:seed

# Start backend server
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 6. Setup Frontend (Terminal Baru)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

Buka browser: **http://localhost:3000**

## 👥 Default User Credentials

Setelah menjalankan seed, login dengan kredensial berikut:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@travel.com | password123 | Full access ke semua fitur |
| **Operator** | operator@travel.com | password123 | Operasional (tanpa user management) |
| **Driver** | driver@travel.com | password123 | Jadwal & check-in penumpang |
| **Customer** | customer@travel.com | password123 | Booking & riwayat tiket |

## 📁 Project Structure

```
travel/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Seed dummy data
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth & validation
│   │   ├── routes/            # API routes
│   │   └── server.js          # Express app
│   ├── .env                   # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/             # Login & Dashboard
    │   ├── services/          # API service
    │   ├── App.jsx            # Main app
    │   └── main.jsx           # Entry point
    ├── index.html
    ├── tailwind.config.js
    └── package.json
```

## 🔌 API Endpoints

Backend menyediakan REST API di `http://localhost:5000/api`:

### Authentication (`/api/auth`)
- `POST /register` - Register user baru
- `POST /login` - Login dan dapatkan JWT token
- `GET /me` - Get current user info (requires auth)

### Master Data
- `/api/cities` - Master Kota (CRUD)
- `/api/routes` - Master Rute (CRUD dengan city relations)
- `/api/vehicles` - Master Armada (CRUD dengan status management)
- `/api/drivers` - Master Driver (CRUD dengan user relations)

### Operational
- `/api/schedules` - Jadwal Perjalanan (CRUD, conflict detection, seat management)
- `/api/bookings` - Booking & Tiket (seat selection, status workflow)
- `/api/payments` - Pembayaran (revenue tracking, statistics)
- `/api/checkin` - Check-in Penumpang (single/bulk check-in)

### User Management
- `/api/users` - Manajemen User (Admin only, CRUD dengan statistics)

### Health Check
- `GET /api/health` - Check API status

## ✨ Fitur Lengkap

### 🔐 **Authentication & Authorization**
- ✅ Login/Logout dengan JWT
- ✅ Role-based access control (4 roles)
- ✅ Protected routes & API endpoints
- ✅ Password hashing dengan bcrypt

### 📁 **Master Data** (Admin/Operator)
Submenu tergrouping dengan collapse/expand:
- ✅ **Master Kota**: CRUD kota dengan provinsi
- ✅ **Master Rute**: CRUD rute dengan origin/destination cities
- ✅ **Master Armada**: Vehicle management dengan status tracking
- ✅ **Master Driver**: Driver management dengan license tracking

### 📅 **Jadwal Perjalanan** (Admin/Operator/Driver)
- ✅ Schedule CRUD dengan vehicle & driver assignment
- ✅ Conflict detection (vehicle/driver double-booking prevention)
- ✅ Available seats tracking real-time
- ✅ Dropdown helpers untuk route, vehicle, driver

### 🎫 **Booking & Tiket** (All roles)
- ✅ Interactive visual seat selection (5-column grid layout)
- ✅ Real-time seat availability check
- ✅ Unique booking code generation
- ✅ Multi-status workflow (PENDING → PAID → CONFIRMED → CANCELLED)
- ✅ Transaction-based booking (atomic seat updates)
- ✅ Customer self-service dengan role filtering

### 💳 **Pembayaran** (Admin/Operator)
- ✅ Payment tracking & revenue monitoring
- ✅ Statistics dashboard (total revenue, today's revenue, payment count)
- ✅ Payment method breakdown
- ✅ Daily revenue reports untuk chart data
- ✅ Date range & payment method filtering
- ✅ Search by booking code

### ✅ **Check-in Penumpang** (Admin/Operator/Driver)
- ✅ Schedule-based check-in management
- ✅ Single passenger check-in
- ✅ Bulk check-in (all passengers at once)
- ✅ Check-in statistics (rate, seats, count)
- ✅ Undo check-in untuk koreksi
- ✅ Real-time check-in tracking dengan timestamp

### 👥 **Manajemen User** (Admin only)
- ✅ User CRUD dengan role management
- ✅ User statistics dashboard
- ✅ Search & filter by role
- ✅ Active user count tracking

### 🎨 **UI/UX**
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Sidebar navigation dengan role-based menu filtering
- ✅ Gradient backgrounds & smooth transitions
- ✅ Loading states & error handling
- ✅ Toast notifications untuk feedback
- ✅ Modal forms untuk data entry

## 🗃️ Database Schema

### Core Tables:
- **users** - User accounts dengan role (ADMIN, OPERATOR, DRIVER, CUSTOMER)
- **cities** - Master data kota/kabupaten dengan provinsi
- **routes** - Rute perjalanan (origin → destination) dengan pricing
- **vehicles** - Data armada dengan capacity & status
- **drivers** - Data driver dengan license & user relation
- **schedules** - Jadwal perjalanan dengan seat management
- **bookings** - Data booking dengan seat selection & payment tracking

### Key Features:
- ✅ Relational integrity dengan foreign keys
- ✅ Enums untuk status (BookingStatus, VehicleStatus, DriverStatus)
- ✅ Array fields (seatNumbers) untuk multi-seat booking
- ✅ Timestamps (createdAt, updatedAt) untuk audit trail
- ✅ Check-in tracking (checkedIn, checkInTime, checkInBy)
- ✅ Payment tracking (paymentMethod, paidAt)

## 🛠️ Troubleshooting

### Ubuntu 24 Specific

#### Port Sudah Digunakan

```bash
# Cek proses yang menggunakan port
sudo lsof -i :5000    # Backend
sudo lsof -i :3000    # Frontend

# Kill proses
kill -9 <PID>

# Atau kill semua proses di port
sudo fuser -k 5000/tcp
sudo fuser -k 3000/tcp
```

Atau ubah port:
- Backend: Edit `PORT=5001` di `backend/.env`
- Frontend: Buat `frontend/vite.config.js`:
```js
export default {
  server: {
    port: 3001
  }
}
```

#### PostgreSQL Connection Error

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Cek status
sudo systemctl status postgresql

# Verifikasi database & user
sudo -u postgres psql -c "\l" | grep travel
sudo -u postgres psql -c "\du" | grep travel

# Test connection
psql -U travel -d travel -h localhost
```

#### Permission Denied di Prisma

```bash
# Fix ownership
sudo chown -R $USER:$USER /path/to/travel

# Clear Prisma cache
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
npx prisma generate
```

#### Module Not Found Error

```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Frontend Cannot Connect to Backend

Pastikan:
1. Backend running di `http://localhost:5000`
2. Check `frontend/src/services/api.js` - baseURL correct
3. CORS enabled di backend (sudah di-handle)
4. Firewall tidak blocking port

```bash
# Check if port is listening
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000
```

### Windows Specific

#### Port Already in Use

```bash
# Check port 5000 (Backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Check port 3000 (Frontend)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Prisma Generate Error

```bash
cd backend
npx prisma generate --schema=./prisma/schema.prisma
```

## 🚀 Production Deployment (Ubuntu 24)

### 0. Environment Configuration

**Penting! Setup environment variables sebelum deployment:**

#### Backend (.env)
```bash
cd backend
cp .env.example .env
nano .env
```

Update dengan nilai production:
```env
DATABASE_URL="postgresql://travel:STRONG_PASSWORD@localhost:5432/travel?schema=public"
JWT_SECRET="ganti-dengan-random-string-yang-panjang-dan-aman"
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

#### Frontend (.env.production)
```bash
cd frontend
nano .env.production
```

Isi dengan API URL production:
```env
VITE_API_URL=https://your-domain.com/api
```

**CATATAN PENTING:** Dengan Nginx reverse proxy:
- ✅ Frontend bisa akses API lewat: `https://your-domain.com/api` 
- ✅ Nginx akan forward ke backend internal: `http://localhost:5000`
- ✅ **TIDAK PERLU** ubah code, cukup environment variable!

### 1. Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Backend - Start dengan environment variables
cd backend
pm2 start src/server.js --name travel-backend

# Frontend - Build dengan production env lalu serve
cd ../frontend
npm run build  # Vite akan baca .env.production
pm2 serve dist 3000 --name travel-frontend --spa

# Save PM2 configuration
pm2 save

# Auto-start on system boot
pm2 startup
# Follow displayed command
```

### 2. Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create configuration
sudo nano /etc/nginx/sites-available/travel
```

Isi konfigurasi:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/travel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Setup UFW Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (jika pakai SSL)
sudo ufw enable
sudo ufw status
```

### 4. Security Hardening

Update `backend/.env` untuk production:

```env
# Database - Use strong password!
DATABASE_URL="postgresql://travel:STRONG_PASSWORD@localhost:5432/travel?schema=public"

# JWT Secret - Generate random string (minimum 32 characters)
JWT_SECRET="your-super-secret-random-string-minimum-32-chars"

# Application
NODE_ENV=production
PORT=5000

# CORS - Specific domain untuk production security
CORS_ORIGIN=https://your-domain.com
# Untuk multiple origins: CORS_ORIGIN=https://domain1.com,https://domain2.com
```

Update `frontend/.env.production`:

```env
# API URL akan diakses melalui Nginx reverse proxy
VITE_API_URL=https://your-domain.com/api
```

**Cara Generate JWT Secret yang Aman:**
```bash
# Gunakan OpenSSL
openssl rand -base64 32

# Atau Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. SSL Certificate (Opsional dengan Let's Encrypt)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## 💾 Database Backup & Restore

### Backup Database

```bash
# Manual backup
pg_dump -U travel -d travel -h localhost > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -U travel -d travel -h localhost | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Automated Backup (Cron Job)

```bash
# Edit crontab
crontab -e

# Add this line (backup setiap hari jam 2 pagi)
0 2 * * * pg_dump -U travel -d travel > /path/to/backups/travel_$(date +\%Y\%m\%d).sql
```

### Restore Database

```bash
# Restore from backup
psql -U travel -d travel < backup_20260210.sql

# Restore from compressed backup
gunzip -c backup_20260210.sql.gz | psql -U travel -d travel
```

## 📝 Development Scripts

### Backend Commands

```bash
npm run dev              # Start development server dengan nodemon (auto-reload)
npm start                # Start production server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed dummy data ke database
```

### Frontend Commands

```bash
npm run dev              # Start Vite development server dengan HMR
npm run build            # Build untuk production (output: dist/)
npm run preview          # Preview production build locally
```

### Useful Commands

```bash
# Backend - View Prisma Studio (Database GUI)
cd backend
npx prisma studio        # http://localhost:5555

# Check database migrations
npx prisma migrate status

# Reset database (DANGER!)
npx prisma migrate reset

# Frontend - Check bundle size
cd frontend
npm run build
ls -lh dist/

# Check outdated packages
npm outdated
```

## 🎯 Future Enhancements

Fitur yang bisa dikembangkan selanjutnya:

### Phase 3 (Next Features)
- [ ] **Laporan & Analytics**
  - Daily/monthly revenue reports
  - Booking statistics & trends
  - Vehicle utilization reports
  - Driver performance metrics
  
- [ ] **Payment Gateway Integration**
  - Midtrans/Xendit integration
  - Multiple payment methods (VA, E-wallet, Credit Card)
  - Automatic payment verification
  
- [ ] **Notification System**
  - Email notifications (booking confirmation, reminder)
  - WhatsApp notifications via API
  - SMS notifications
  
- [ ] **QR Code Ticketing**
  - Generate QR code untuk setiap booking
  - QR code scanner untuk check-in
  - Mobile-friendly ticket display

### Phase 4 (Advanced Features)
- [ ] **Mobile App**
  - Driver mobile app (React Native)
  - Customer mobile app
  - Offline-first architecture
  
- [ ] **Real-time Features**
  - WebSocket untuk live seat updates
  - Real-time booking notifications
  - Live tracking GPS untuk armada
  
- [ ] **Advanced Features**
  - Multi-city routes (transit points)
  - Pickup & drop-off location management
  - Dynamic pricing based on demand
  - Loyalty program & rewards
  - Review & rating system

## 🔒 Security Best Practices

Untuk production deployment:

1. **Environment Variables**
   - Jangan commit file `.env` ke git
   - Gunakan secret manager (AWS Secrets Manager, Vault)
   - Rotate JWT secret secara berkala

2. **Database Security**
   - Gunakan strong password untuk PostgreSQL user
   - Limit database connection dari IP tertentu
   - Regular backup & disaster recovery plan
   - Enable SSL/TLS untuk database connection

3. **API Security**
   - Implement rate limiting (express-rate-limit)
   - Input validation & sanitization
   - SQL injection prevention (Prisma handles this)
   - XSS protection
   - CSRF tokens untuk forms

4. **Server Security**
   - Keep system & packages updated
   - Setup firewall (UFW)
   - Disable unnecessary services
   - Monitor logs & setup alerts
   - Use HTTPS dengan valid SSL certificate

## 📊 Performance Optimization

### Backend
```bash
# Enable production mode
NODE_ENV=production npm start

# Use clustering untuk multi-core
pm2 start src/server.js -i max
```

### Frontend
```bash
# Build dengan optimizations
npm run build

# Analyze bundle size
npm install -D rollup-plugin-visualizer
```

### Database
```sql
-- Add indexes untuk query performance
CREATE INDEX idx_bookings_schedule ON bookings(scheduleId);
CREATE INDEX idx_bookings_user ON bookings(userId);
CREATE INDEX idx_schedules_date ON schedules(departureDate);
```

## 🧪 Testing (Future)

Setup testing framework:

```bash
# Backend testing
npm install --save-dev jest supertest

# Frontend testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# E2E testing
npm install --save-dev playwright
```

## 📞 Support & Contributing

- **Issues**: Buka issue di repository untuk bug reports
- **Feature Requests**: Gunakan discussion untuk request fitur baru
- **Contributing**: Fork repository, buat branch, submit PR
- **Documentation**: Update README jika menambah fitur baru

## 📄 License

ISC License - Free to use for personal and commercial projects.

---

## 📖 Additional Resources

### Documentation Links
- [Prisma Docs](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Tutorials
- [JWT Authentication](https://jwt.io/introduction)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgresql)
- [React Router v6](https://reactrouter.com/en/main)

---

**Built with ❤️ for Travel Transportation Management**

**Happy Coding! 🚀**
