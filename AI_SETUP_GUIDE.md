# 🚀 Quick Start Guide - AI Prediction Feature

Complete setup guide untuk fitur AI Prediction di Travel Management System.

## 📋 Prerequisites

- ✅ Backend running (Node.js + PostgreSQL)
- ✅ Frontend running (React + Vite)
- ✅ Python 3.12+ installed
- ✅ pip installed

---

## 🎯 Step-by-Step Setup

### Step 1: Generate Dummy Data

```bash
cd backend
node prisma/generateDummyData.js
```

**Output:**
- 12 cities (Jakarta, Bandung, Surabaya, etc.)
- 14 routes (bidirectional)
- 5 vehicles
- 5 drivers
- 15 customers
- 80+ bookings (6 months historical data)

### Step 2: Setup ML Service

```bash
cd ../ml-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# atau
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Start ML Service

**Development:**
```bash
python app.py
```

**Production (Linux - Systemd):**
```bash
# Copy service file
sudo cp travel-ml-service.service /etc/systemd/system/

# Edit service file (update User and WorkingDirectory)
sudo nano /etc/systemd/system/travel-ml-service.service

# Start service
sudo systemctl daemon-reload
sudo systemctl start travel-ml-service
sudo systemctl enable travel-ml-service

# Check status
sudo systemctl status travel-ml-service
```

Service akan running di: `http://localhost:5001`

### Step 4: Update Backend Configuration

Edit `backend/.env` atau `backend/src/server.js`:
```env
ML_SERVICE_URL=http://localhost:5001
```

Install axios di backend (jika belum):
```bash
cd backend
npm install axios
```

Restart backend:
```bash
# Development
npm run dev

# Production (systemd)
sudo systemctl restart travel-backend
```

### Step 5: Update Frontend

Install recharts untuk visualisasi:
```bash
cd frontend
npm install recharts
```

Restart frontend:
```bash
npm run dev
```

### Step 6: Test AI Prediction Feature

1. **Login** ke aplikasi (admin/operator)
2. **Navigate** ke sidebar → **AI Prediction** 🤖
3. **Click "Fetch & Train"** button
   - Wait ~2-5 seconds
   - Should show: "✅ Model berhasil dilatih!"
4. **Click "Predict"** button
   - Wait ~1-2 seconds
   - Should display:
     - 📈 Demand Forecast (7 days chart)
     - 🏆 Top 3 Rute Terlaris
     - ⚠️ Top 3 Rute Tersepi

---

## 🎨 Frontend Features

### Mobile Responsive
- ✅ Card view untuk mobile (<768px)
- ✅ Table/Chart view untuk desktop
- ✅ Touch-friendly buttons
- ✅ Responsive grid layout

### Multi-Language Support
- ✅ Indonesian (Bahasa Indonesia)
- ✅ English
- Translations di: `frontend/src/i18n/locales/`

### Visualizations
- **Line Chart**: Prediksi penumpang 7 hari
- **Route Cards**: Top/Bottom 3 routes with metrics
- **Trend Indicators**: ↑ Naik, ↓ Turun, → Stabil
- **Occupancy Bars**: Visual tingkat kepenuhanarmada

---

## 📊 API Endpoints

### Backend (Node.js)
- `GET /api/ml/health` - Check ML service status
- `GET /api/ml/data` - Fetch training data from DB
- `POST /api/ml/train` - Train models
- `POST /api/ml/predict` - Generate predictions
- `GET /api/ml/model-status` - Get model info

### ML Service (Python)
- `GET /health` - Health check
- `POST /train` - Train ML models
- `POST /predict` - Generate predictions
- `GET /model-info` - Model metadata

---

## 🧪 Testing

### 1. Test ML Service

```bash
# Health check
curl http://localhost:5001/health

# Expected: {"status":"healthy","service":"ML Service"}
```

### 2. Test Backend Integration

```bash
# Get model status (need valid JWT token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/ml/model-status
```

### 3. Test Frontend

1. Open browser: `http://localhost:5173`
2. Login with admin/operator account
3. Navigate to AI Prediction page
4. Verify buttons work and data displays correctly

---

## 🐛 Troubleshooting

### ML Service tidak start
```bash
# Check Python version
python3 --version  # Harus 3.12+

# Check dependencies
pip list | grep flask

# Reinstall
pip install -r requirements.txt --force-reinstall

# Check logs
sudo journalctl -u travel-ml-service -f
```

### Backend tidak bisa connect ke ML service
```bash
# Check ML service running
curl http://localhost:5001/health

# Check firewall
sudo ufw status

# Check backend logs
sudo journalctl -u travel-backend -f
```

### Frontend error: Axios is not defined
```bash
cd frontend
npm install axios
npm run dev
```

### Prediction error: Not enough data
```bash
# Generate more dummy data
cd backend
node prisma/generateDummyData.js

# Or check database
npx prisma studio
# Verify bookings count > 30
```

### Chart tidak muncul
```bash
# Install recharts
cd frontend
npm install recharts
npm run dev
```

---

## 📁 File Structure

```
travel/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── ml.controller.js       ✨ NEW
│   │   └── routes/
│   │       └── ml.routes.js           ✨ NEW
│   └── prisma/
│       └── generateDummyData.js       ✨ NEW
│
├── ml-service/                         ✨ NEW
│   ├── app.py
│   ├── requirements.txt
│   ├── README.md
│   ├── models/
│   │   ├── demand_forecast.py
│   │   └── route_analysis.py
│   ├── utils/
│   │   └── data_processor.py
│   └── saved_models/
│       ├── demand_model.pkl
│       └── metadata.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── AIPrediction.jsx       ✨ NEW
    │   ├── pages/
    │   │   └── Dashboard.jsx          ✨ UPDATED
    │   ├── i18n/
    │   │   └── locales/
    │   │       ├── id.json            ✨ UPDATED
    │   │       └── en.json            ✨ UPDATED
    │   └── App.jsx                    ✨ UPDATED
```

---

## 🎯 Features Implemented

### ✅ Demand Forecasting
- Prediksi penumpang harian (7 hari ke depan)
- Trend analysis (naik/turun/stabil)
- Peak days identification
- Confidence scores
- Historical average comparison

### ✅ Route Performance Analysis
- **Top 3 Rute Terlaris**:
  - Total bookings
  - Total passengers
  - Total revenue
  - Occupancy rate
  - Trend percentage
  
- **Top 3 Rute Tersepi**:
  - Performance metrics
  - Recommendations (tutup rute, kurangi frekuensi, tingkatkan marketing)

### ✅ UI/UX Features
- Mobile responsive design
- Multi-language (ID/EN)
- Real-time loading states
- Error handling
- Success notifications
- Interactive charts (Recharts)
- Empty states
- Model status indicator

---

## 📊 Data Requirements

### Minimum Data:
- **30 days** booking history untuk training
- **10+ routes** untuk route analysis
- **50+ bookings** untuk accurate predictions

### Optimal Data:
- **90+ days** booking history
- **Varied passenger counts** (1-40 per booking)
- **Multiple routes** dengan traffic berbeda
- **Status PAID** bookings (PENDING/CANCELLED diabaikan)

---

## 🚀 Production Checklist

### Backend
- [ ] Install axios: `npm install axios`
- [ ] Set ML_SERVICE_URL di .env
- [ ] Verify /api/ml routes working
- [ ] Check authentication middleware

### ML Service
- [ ] Install Python dependencies system-wide
- [ ] Setup systemd service
- [ ] Enable auto-start at boot
- [ ] Configure firewall (block external access to :5001)
- [ ] Setup log rotation

### Frontend
- [ ] Install recharts: `npm install recharts`
- [ ] Verify translations (ID/EN)
- [ ] Test mobile responsive
- [ ] Build production: `npm run build`

### Database
- [ ] Generate dummy data atau ensure historical data exists
- [ ] Verify booking status (PAID bookings count)
- [ ] Check date range (min 30 days)

---

## 💡 Usage Tips

### Best Practices:
1. **Re-train model** setiap minggu untuk update dengan data terbaru
2. **Monitor accuracy** via model metrics (RMSE, MAE, R2 score)
3. **Compare predictions vs actual** untuk validasi
4. **Use insights** untuk:
   - Optimasi alokasi armada
   - Dynamic pricing strategy
   - Marketing focus pada rute potensial
   - Closure rute underperforming

### Interpretation:
- **Trend Naik**: Tingkatkan armada/frekuensi
- **Trend Turun**: Kurangi frekuensi, review pricing
- **Occupancy <30%**: Consider closing route
- **Occupancy 30-50%**: Tingkatkan marketing
- **Occupancy >80%**: Tambah armada/frekuensi

---

## 🎓 ML Model Info

### Algorithm: Linear Regression
- **Features**: 6 engineered features (day_of_week, rolling averages, etc.)
- **Training time**: ~1-5 seconds
- **Prediction time**: <1 second
- **Accuracy**: RMSE ~3-8 passengers (depending on data quality)

### Model Storage:
- Models saved in: `ml-service/saved_models/`
- Format: `joblib` pickle files
- Lightweight: <1 MB per model

---

## 📞 Support

**Issues?**
1. Check logs:
   - Backend: `sudo journalctl -u travel-backend -f`
   - ML Service: `sudo journalctl -u travel-ml-service -f`
   - Frontend: Browser console (F12)

2. Verify connectivity:
   ```bash
   # ML service health
   curl http://localhost:5001/health
   
   # Backend ML endpoint
   curl http://localhost:5000/api/ml/health
   ```

3. Check database:
   ```bash
   cd backend
   npx prisma studio
   # Verify bookings table has data
   ```

---

**🎉 Setup Complete! Enjoy your AI-powered Travel Management System!**

**Next Steps:**
- Explore predictions
- Compare with actual data
- Adjust business strategies based on insights
- Monitor model performance over time

---

Built with ❤️ using:
- 🐍 Python + Flask + scikit-learn (ML)
- 🟢 Node.js + Express + Prisma (Backend)
- ⚛️ React + Vite + Tailwind CSS (Frontend)
- 📊 Recharts (Visualization)
