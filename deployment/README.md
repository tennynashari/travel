# Deployment Files

Folder ini berisi file-file konfigurasi dan script untuk deployment aplikasi ke server Ubuntu 24.04.

## 📁 Isi Folder

### Konfigurasi Files

- **`nginx.conf`** - Konfigurasi Nginx untuk reverse proxy dan static file serving
- **`travel-backend.service`** - Systemd service file untuk menjalankan backend sebagai service (alternatif PM2)

### Scripts

- **`deploy.sh`** - Script otomatis untuk deployment lengkap
- **`generate-secrets.sh`** - Script untuk generate JWT secret dan session secret

### Dokumentasi

- **`QUICKSTART.md`** - Panduan quick start untuk deployment cepat
- **`../DEPLOYMENT.md`** - Panduan deployment lengkap (di root project)

## 🚀 Cara Menggunakan

### Deployment Otomatis (Recommended)

```bash
# Di server Ubuntu
sudo bash deployment/deploy.sh
```

### Deployment Manual

Ikuti panduan di [QUICKSTART.md](QUICKSTART.md) atau [../DEPLOYMENT.md](../DEPLOYMENT.md)

### Generate Security Keys

```bash
bash deployment/generate-secrets.sh
```

## 📝 Notes

- Semua script dirancang untuk Ubuntu 24.04
- Pastikan Nginx dan PostgreSQL sudah terinstall
- Edit file konfigurasi sesuai kebutuhan server Anda sebelum deployment
- Jangan lupa update domain di nginx.conf
- Backup database secara regular

## 🔐 Security

File `.env` tidak disertakan di repository untuk keamanan. 
Template tersedia di `backend/.env.production`.

## 📖 Documentation

Untuk informasi lengkap, lihat [DEPLOYMENT.md](../DEPLOYMENT.md)
