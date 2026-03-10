#!/bin/bash

# Script Migrasi dari PM2 ke Systemd
# Travel Management Backend

echo "🔄 Migrasi Backend dari PM2 ke Systemd"
echo "========================================"
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Cek apakah PM2 sedang running
echo "📋 Step 1: Cek status PM2..."
if pm2 list | grep -q "online"; then
    echo -e "${YELLOW}PM2 sedang running. Akan dihentikan nanti.${NC}"
    PM2_RUNNING=true
else
    echo -e "${GREEN}PM2 tidak aktif.${NC}"
    PM2_RUNNING=false
fi
echo ""

# 2. Backup konfigurasi PM2
echo "💾 Step 2: Backup konfigurasi PM2..."
if [ -f ~/.pm2/dump.pm2 ]; then
    cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.backup
    echo -e "${GREEN}Backup PM2 config berhasil${NC}"
fi
if command -v pm2 &> /dev/null; then
    pm2 save
    echo -e "${GREEN}PM2 config disimpan${NC}"
fi
echo ""

# 3. Konfigurasi systemd service
echo "⚙️  Step 3: Konfigurasi systemd service..."
echo ""
echo "Edit file: travel-backend.service"
echo "Sesuaikan variabel berikut:"
echo "  - User: $(whoami)"
echo "  - WorkingDirectory: $(pwd)"
echo "  - DATABASE_URL: (dari .env file Anda)"
echo "  - JWT_SECRET: (dari .env file Anda)"
echo ""
read -p "Sudah edit file travel-backend.service? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo -e "${RED}Silakan edit file travel-backend.service terlebih dahulu${NC}"
    exit 1
fi
echo ""

# 4. Copy service file ke systemd
echo "📂 Step 4: Install service file..."
sudo cp travel-backend.service /etc/systemd/system/
echo -e "${GREEN}Service file copied${NC}"
echo ""

# 5. Reload systemd
echo "🔄 Step 5: Reload systemd daemon..."
sudo systemctl daemon-reload
echo -e "${GREEN}Systemd daemon reloaded${NC}"
echo ""

# 6. Stop PM2 jika running
if [ "$PM2_RUNNING" = true ]; then
    echo "⏹️  Step 6: Stop PM2..."
    pm2 stop all
    pm2 delete all
    echo -e "${GREEN}PM2 stopped dan dihapus${NC}"
    
    # Optional: disable PM2 startup
    read -p "Disable PM2 startup? (y/n): " disable_pm2
    if [ "$disable_pm2" = "y" ]; then
        pm2 unstartup
        echo -e "${GREEN}PM2 startup disabled${NC}"
    fi
    echo ""
fi

# 7. Start systemd service
echo "▶️  Step 7: Start systemd service..."
sudo systemctl start travel-backend
echo -e "${GREEN}Service started${NC}"
echo ""

# 8. Enable auto-start
echo "🚀 Step 8: Enable auto-start..."
sudo systemctl enable travel-backend
echo -e "${GREEN}Service enabled untuk auto-start${NC}"
echo ""

# 9. Check status
echo "📊 Step 9: Check service status..."
sudo systemctl status travel-backend --no-pager
echo ""

# 10. Show useful commands
echo "✅ Migrasi Selesai!"
echo ""
echo "📝 Command Reference:"
echo "  Status:   sudo systemctl status travel-backend"
echo "  Start:    sudo systemctl start travel-backend"
echo "  Stop:     sudo systemctl stop travel-backend"
echo "  Restart:  sudo systemctl restart travel-backend"
echo "  Logs:     sudo journalctl -u travel-backend -f"
echo "  Disable:  sudo systemctl disable travel-backend"
echo ""
echo "🔍 Monitoring:"
echo "  Real-time logs: sudo journalctl -u travel-backend -f"
echo "  Last 50 lines:  sudo journalctl -u travel-backend -n 50"
echo "  Today's logs:   sudo journalctl -u travel-backend --since today"
echo ""
