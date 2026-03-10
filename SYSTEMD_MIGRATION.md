# 🔄 Migrasi Backend dari PM2 ke Systemd

## 📖 Overview

Panduan lengkap migrasi backend Travel Management dari PM2 ke systemd.

---

## 🎯 Mengapa Systemd?

### Keuntungan Systemd:
✅ **Native Linux** - Tidak perlu dependency tambahan (PM2)
✅ **Lebih ringan** - Resource usage lebih kecil
✅ **Logging terpusat** - journalctl untuk semua logs
✅ **Security** - Better isolation & permissions management
✅ **Integration** - Terintegrasi dengan sistem Linux
✅ **Dependency management** - Bisa set service dependencies

### Kapan Tetap Pakai PM2:
- Butuh cluster mode dengan load balancing otomatis
- Development environment (hot reload, watch mode)
- Multiple Node.js apps dengan management terpusat
- Butuh PM2+ monitoring dashboard

---

## 🚀 Langkah Migrasi (Linux Server)

### 1️⃣ Persiapan

```bash
# Cek PM2 yang sedang running
pm2 list

# Backup current PM2 setup
pm2 save
pm2 dump

# Catat environment variables
pm2 env 0  # Atau app id Anda
```

### 2️⃣ Edit Service File

Edit `travel-backend.service`:

```bash
# Ganti nilai berikut:
User=your-ubuntu-username          # Ganti dengan username server
WorkingDirectory=/home/user/travel/backend  # Path absolut ke folder backend
Environment=DATABASE_URL=postgresql://...   # Copy dari .env
Environment=JWT_SECRET=...         # Copy dari .env
Environment=PORT=5000              # Port aplikasi
```

**Tips Environment Variables:**
```bash
# Jika banyak env vars, bisa gunakan EnvironmentFile:
EnvironmentFile=/path/to/travel/backend/.env.production

# Atau buat file terpisah:
# /etc/travel-backend/environment
# Lalu:
EnvironmentFile=/etc/travel-backend/environment
```

### 3️⃣ Install Service

```bash
# Copy service file ke systemd
sudo cp travel-backend.service /etc/systemd/system/

# Set permissions
sudo chmod 644 /etc/systemd/system/travel-backend.service

# Reload systemd
sudo systemctl daemon-reload
```

### 4️⃣ Stop PM2

```bash
# Stop aplikasi
pm2 stop all

# Hapus dari PM2
pm2 delete all

# Disable PM2 startup (optional)
pm2 unstartup

# Atau uninstall PM2 completely (optional)
# npm uninstall -g pm2
```

### 5️⃣ Start Systemd Service

```bash
# Start service
sudo systemctl start travel-backend

# Check status
sudo systemctl status travel-backend

# Enable auto-start saat boot
sudo systemctl enable travel-backend

# Check logs
sudo journalctl -u travel-backend -f
```

---

## 📝 Command Reference

### Service Management

```bash
# Start service
sudo systemctl start travel-backend

# Stop service
sudo systemctl stop travel-backend

# Restart service
sudo systemctl restart travel-backend

# Reload config (jika support reload)
sudo systemctl reload travel-backend

# Check status
sudo systemctl status travel-backend

# Enable auto-start
sudo systemctl enable travel-backend

# Disable auto-start
sudo systemctl disable travel-backend

# Check if enabled
sudo systemctl is-enabled travel-backend

# Check if active
sudo systemctl is-active travel-backend
```

### Logging & Monitoring

```bash
# Real-time logs (seperti pm2 logs)
sudo journalctl -u travel-backend -f

# Last 100 lines
sudo journalctl -u travel-backend -n 100

# Logs since boot
sudo journalctl -u travel-backend -b

# Logs today
sudo journalctl -u travel-backend --since today

# Logs kemarin
sudo journalctl -u travel-backend --since yesterday

# Logs dalam range waktu
sudo journalctl -u travel-backend --since "2026-03-10 00:00" --until "2026-03-10 23:59"

# Search dalam logs
sudo journalctl -u travel-backend | grep "ERROR"

# Export logs ke file
sudo journalctl -u travel-backend > backend-logs.txt
```

### Troubleshooting

```bash
# Check syntax service file
sudo systemd-analyze verify /etc/systemd/system/travel-backend.service

# List all failed services
sudo systemctl --failed

# Check boot time
sudo systemd-analyze blame

# Reset failed status
sudo systemctl reset-failed travel-backend
```

---

## 🔧 Konfigurasi Lanjutan

### 1. Environment Variables dari File

Edit `travel-backend.service`:

```ini
[Service]
# Gunakan file .env
EnvironmentFile=/path/to/backend/.env.production

# Atau multiple files
EnvironmentFile=/etc/travel-backend/common.env
EnvironmentFile=/etc/travel-backend/secrets.env
```

### 2. Auto-Restart Policy

```ini
[Service]
# Always restart kecuali manual stop
Restart=always

# Restart hanya saat exit code != 0
Restart=on-failure

# Restart hanya saat crash
Restart=on-abnormal

# Delay sebelum restart
RestartSec=10

# Max restart dalam waktu tertentu
StartLimitIntervalSec=300
StartLimitBurst=5
```

### 3. Resource Limits

```ini
[Service]
# Limit memory (512MB)
MemoryLimit=512M

# Limit CPU (50%)
CPUQuota=50%

# Max file descriptors
LimitNOFILE=65536

# Max processes
LimitNPROC=512
```

### 4. Security Hardening

```ini
[Service]
# Run as non-root user
User=travel-backend
Group=travel-backend

# Restrict access
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true

# Read-only directories
ReadOnlyPaths=/etc /usr

# Writable directories
ReadWritePaths=/path/to/travel/backend/uploads
ReadWritePaths=/path/to/travel/backend/logs
```

### 5. Dependencies

```ini
[Unit]
# Start after PostgreSQL
After=postgresql.service
Requires=postgresql.service

# Start after network
After=network-online.target
Wants=network-online.target
```

### 6. Multiple Instances (Clustering)

Jika butuh multiple instances seperti PM2 cluster mode:

**travel-backend@.service:**
```ini
[Unit]
Description=Travel Backend Instance %i

[Service]
Type=simple
User=travel-backend
WorkingDirectory=/path/to/backend
Environment=INSTANCE_ID=%i
Environment=PORT=500%i
ExecStart=/usr/bin/node src/server.js

[Install]
WantedBy=multi-user.target
```

**Start multiple instances:**
```bash
sudo systemctl start travel-backend@1
sudo systemctl start travel-backend@2
sudo systemctl start travel-backend@3

# Enable all
sudo systemctl enable travel-backend@{1,2,3}
```

**Dengan Nginx Load Balancer:**
```nginx
upstream backend {
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    server 127.0.0.1:5003;
}

server {
    listen 80;
    location /api {
        proxy_pass http://backend;
    }
}
```

---

## 🔍 Monitoring

### Systemd Status

```bash
# Lihat semua services
systemctl list-units --type=service

# Lihat running services
systemctl list-units --type=service --state=running

# Lihat failed services
systemctl list-units --type=service --state=failed
```

### Real-time Monitoring

Install tools monitoring:

```bash
# htop - process monitoring
sudo apt install htop
htop -p $(systemctl show -p MainPID --value travel-backend)

# netstat - check port
sudo netstat -tlnp | grep 5000

# Check disk usage
df -h

# Check memory
free -h
```

---

## 🔄 Rollback ke PM2

Jika ingin kembali ke PM2:

```bash
# Stop systemd
sudo systemctl stop travel-backend
sudo systemctl disable travel-backend

# Remove service file
sudo rm /etc/systemd/system/travel-backend.service
sudo systemctl daemon-reload

# Start PM2
cd /path/to/backend
pm2 start src/server.js --name travel-backend
pm2 save
pm2 startup
```

---

## 📊 Perbandingan Commands

| Task | PM2 | Systemd |
|------|-----|---------|
| Start | `pm2 start app.js` | `sudo systemctl start service` |
| Stop | `pm2 stop app` | `sudo systemctl stop service` |
| Restart | `pm2 restart app` | `sudo systemctl restart service` |
| Logs | `pm2 logs` | `sudo journalctl -u service -f` |
| Monit | `pm2 monit` | `sudo systemctl status service` |
| List | `pm2 list` | `systemctl list-units --type=service` |
| Auto-start | `pm2 startup && pm2 save` | `sudo systemctl enable service` |

---

## 💡 Best Practices

1. **Environment Variables**
   - Jangan hardcode secrets di service file
   - Gunakan `EnvironmentFile` untuk .env
   - Set proper permissions: `chmod 600 .env.production`

2. **Logging**
   - Gunakan journalctl untuk logs
   - Set log rotation: `/etc/systemd/journald.conf`
   - Monitor disk space untuk logs

3. **Security**
   - Jalankan sebagai non-root user
   - Set file permissions dengan benar
   - Gunakan `ProtectSystem` dan `PrivateTmp`

4. **Monitoring**
   - Setup alerting untuk service down
   - Monitor resource usage
   - Track restart frequency

5. **Backup**
   - Backup service file
   - Document environment variables
   - Version control service file

---

## ⚠️ Catatan Penting

- **Service file changes**: Setiap edit service file butuh `systemctl daemon-reload`
- **Permissions**: Service files harus owned by root (`root:root`) dengan permission `644`
- **User**: Pastikan user di service file punya akses ke working directory
- **Database**: Pastikan database service start sebelum backend (`After=postgresql.service`)
- **Firewall**: Pastikan port backend terbuka jika butuh external access

---

## 🆘 Troubleshooting

### Service gagal start

```bash
# Check detailed status
sudo systemctl status travel-backend -l

# Check logs
sudo journalctl -u travel-backend -n 50

# Check syntax
sudo systemd-analyze verify /etc/systemd/system/travel-backend.service

# Check file permissions
ls -la /etc/systemd/system/travel-backend.service
```

### Permission denied

```bash
# Check user ownership
ls -la /path/to/backend

# Give ownership to service user
sudo chown -R travel-user:travel-user /path/to/backend

# Check file permissions
chmod +x /path/to/backend/src/server.js
```

### Environment variables tidak loaded

```bash
# Check env file
cat /path/to/.env.production

# Test manual
sudo -u travel-user bash -c 'source /path/to/.env.production && node src/server.js'

# Debug dalam service
Environment=DEBUG=*
```

---

## 📞 Support

Jika ada masalah saat migrasi:
1. Check logs: `sudo journalctl -u travel-backend -f`
2. Verify service file syntax
3. Test manual start tanpa systemd dulu
4. Check user permissions

Good luck dengan migrasi! 🚀
