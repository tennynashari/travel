# 🤖 Travel ML Service - AI Prediction

Machine Learning service untuk prediksi penumpang dan analisis rute menggunakan Flask + scikit-learn.

## 📋 Features

### 1. **Demand Forecasting** 
Prediksi jumlah penumpang 7 hari ke depan:
- Time series prediction
- Trend analysis (increasing/decreasing/stable)
- Peak days identification
- Confidence scores per prediction

### 2. **Route Performance Analysis**
Analisis performa rute:
- Top 3 rute terlaris (paling laku)
- Top 3 rute tersepi
- Tingkat okupansi (occupancy rate)
- Trend per rute
- Rekomendasi bisnis untuk rute berkinerja rendah

## 🚀 Setup & Installation

### Prerequisites
- Python 3.12+
- pip
- Access ke PostgreSQL database (untuk fetch data)

### 1. Install Dependencies

```bash
cd ml-service

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# atau
venv\Scripts\activate  # Windows

# Install requirements
pip install -r requirements.txt
```

### 2. Configuration

Edit `.env` file jika diperlukan:
```env
FLASK_ENV=development
PORT=5001
HOST=0.0.0.0
MODEL_DIR=./saved_models
```

### 3. Run Development Server

```bash
# Make sure virtual environment is activated
python app.py
```

Service akan berjalan di: `http://localhost:5001`

### 4. Test API

```bash
# Health check
curl http://localhost:5001/health

# Expected response:
# {"status":"healthy","service":"ML Service","timestamp":"2026-03-10T..."}
```

## 🔧 Production Deployment (Linux - Systemd)

### 1. Install Python Packages System-Wide

```bash
cd /path/to/travel/ml-service
pip3 install -r requirements.txt
```

### 2. Setup Systemd Service

```bash
# Copy service file
sudo cp travel-ml-service.service /etc/systemd/system/

# Edit service file with correct paths
sudo nano /etc/systemd/system/travel-ml-service.service

# Update:
#   User=your-username
#   WorkingDirectory=/path/to/travel/ml-service

# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start travel-ml-service

# Enable auto-start
sudo systemctl enable travel-ml-service

# Check status
sudo systemctl status travel-ml-service

# View logs
sudo journalctl -u travel-ml-service -f
```

### 3. Verify Service

```bash
curl http://localhost:5001/health
```

## 📡 API Endpoints

### `GET /health`
Health check endpoint
```json
{
  "status": "healthy",
  "service": "ML Service",
  "timestamp": "2026-03-10T12:00:00"
}
```

### `POST /train`
Train ML models with historical data
```json
// Request
{
  "bookings": [
    {
      "created_at": "2025-09-01T10:00:00",
      "total_passengers": 35,
      "total_price": 1750000,
      "status": "PAID",
      "route_key": "Jakarta → Bandung"
    }
    // ... more bookings
  ],
  "routes": [...]  // optional
}

// Response
{
  "success": true,
  "message": "Models trained successfully",
  "metadata": {
    "trained_at": "2026-03-10T12:00:00",
    "total_records": 120,
    "demand_metrics": {
      "rmse": 5.2,
      "mae": 3.8,
      "r2_score": 0.85
    }
  }
}
```

### `POST /predict`
Generate predictions
```json
// Request
{
  "bookings": [...],  // historical data for context
  "routes": [...]     // optional
}

// Response
{
  "success": true,
  "demand_forecast": {
    "predictions": [
      {
        "date": "2026-03-11",
        "day_name": "Monday",
        "predicted_passengers": 42,
        "confidence": 0.85,
        "is_weekend": false
      }
      // ... 7 days
    ],
    "summary": {
      "total_predicted": 298,
      "daily_average": 42,
      "trend": "increasing",
      "peak_days": ["2026-03-15", "2026-03-16"]
    }
  },
  "route_analysis": {
    "top_routes": [
      {
        "route": "Jakarta → Bandung",
        "total_bookings": 234,
        "total_passengers": 850,
        "total_revenue": 25500000,
        "occupancy_rate": 0.82,
        "trend": "increasing",
        "trend_percentage": 15
      }
      // ... top 3
    ],
    "bottom_routes": [
      {
        "route": "Cirebon → Tasikmalaya",
        "total_bookings": 12,
        "total_passengers": 35,
        "total_revenue": 1050000,
        "occupancy_rate": 0.28,
        "trend": "decreasing",
        "trend_percentage": -8,
        "recommendation": "Consider reducing frequency or closing route"
      }
      // ... bottom 3
    ]
  }
}
```

### `GET /model-info`
Get model status and metadata
```json
{
  "model_trained": true,
  "metadata": {
    "trained_at": "2026-03-10T12:00:00",
    "total_records": 120,
    "demand_metrics": {...}
  }
}
```

## 🏗️ Architecture

```
ml-service/
├── app.py                      # Flask application
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables
├── models/
│   ├── demand_forecast.py     # Demand prediction model
│   ├── route_analysis.py      # Route performance analysis
│   └── __init__.py
├── utils/
│   ├── data_processor.py      # Data preprocessing
│   └── __init__.py
└── saved_models/              # Trained models storage
    ├── demand_model.pkl       # Serialized demand model
    └── metadata.json          # Training metadata
```

## 🔬 Machine Learning Models

### Demand Forecast
- **Algorithm**: Linear Regression with feature engineering
- **Features**: 
  - Day of week (0-6)
  - Day of month (1-31)
  - Month (1-12)
  - Days from start
  - 7-day rolling average
  - 14-day rolling average
- **Input**: Historical booking data (90+ days recommended)
- **Output**: Daily passenger predictions for next 7 days

### Route Analysis
- **Method**: Statistical aggregation
- **Metrics**:
  - Total bookings per route
  - Total passengers
  - Total revenue
  - Occupancy rate (estimated)
  - Trend analysis (increasing/decreasing/stable)
- **Output**: Top 3 and bottom 3 routes with recommendations

## 📊 Model Storage

Models are saved in `saved_models/` directory:
- `demand_model.pkl`: Trained linear regression model
- `metadata.json`: Training information and metrics

## 🔧 Integration with Backend

Backend (Node.js) calls ML service via HTTP:

```javascript
// backend/src/controllers/ml.controller.js
const ML_SERVICE_URL = 'http://localhost:5001';

// Train
await axios.post(`${ML_SERVICE_URL}/train`, { bookings });

// Predict
await axios.post(`${ML_SERVICE_URL}/predict`, { bookings });
```

## 📝 Usage Flow

1. **Initial Training**:
   - Frontend: Click "Fetch & Train" button
   - Backend: Fetch 6 months booking data from PostgreSQL
   - Backend → ML Service: Send data to `/train`
   - ML Service: Train models, save to disk
   - Response: Training metrics

2. **Generate Predictions**:
   - Frontend: Click "Predict" button
   - Backend: Fetch recent booking data
   - Backend → ML Service: Send data to `/predict`
   - ML Service: Load models, generate predictions
   - Frontend: Display predictions with charts

## 🐛 Troubleshooting

### Service won't start
```bash
# Check Python version
python3 --version  # Should be 3.12+

# Check dependencies
pip list | grep flask
pip list | grep scikit-learn

# Check logs
sudo journalctl -u travel-ml-service -n 50
```

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Verify PYTHONPATH
echo $PYTHONPATH
```

### Model not found errors
```bash
# Check saved_models directory
ls -la saved_models/

# Re-train model from frontend
# Dashboard → AI Prediction → Fetch & Train
```

### Port already in use
```bash
# Check what's using port 5001
sudo netstat -tlnp | grep 5001

# Kill process or change port in .env
```

## 📈 Performance Considerations

- **Training time**: ~1-5 seconds for 100-500 booking records
- **Prediction time**: <1 second
- **Memory usage**: ~50-100 MB
- **Disk space**: <10 MB for models

## 🔐 Security Notes

- ML service should only be accessible from backend (localhost)
- Use firewall to block external access to port 5001
- No authentication required (internal service)
- Validate data before training/prediction

## 📚 Dependencies

See `requirements.txt`:
- Flask 3.0.0 - Web framework
- pandas 2.2.0 - Data manipulation
- scikit-learn 1.4.0 - Machine learning
- prophet 1.1.5 - Time series (optional, for advanced forecasting)
- joblib 1.3.2 - Model persistence

## 🎯 Future Enhancements

- [ ] Add LSTM/GRU for improved time series prediction
- [ ] Implement seasonal decomposition
- [ ] Add external factors (holidays, weather, events)
- [ ] Create recommendation system for pricing
- [ ] Add anomaly detection for unusual booking patterns
- [ ] Implement A/B testing framework for model comparison

## 📞 Support

If you encounter issues:
1. Check logs: `sudo journalctl -u travel-ml-service -f`
2. Verify backend can reach ML service: `curl localhost:5001/health`
3. Check model files exist: `ls saved_models/`
4. Ensure enough historical data (30+ days minimum)

---

**Built with ❤️ using Python, Flask, and scikit-learn**
