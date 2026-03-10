from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
from models.demand_forecast import DemandForecast
from models.route_analysis import RouteAnalysis
from utils.data_processor import DataProcessor

app = Flask(__name__)
CORS(app)

# Paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')
os.makedirs(MODEL_DIR, exist_ok=True)

# Initialize models
demand_model = DemandForecast(MODEL_DIR)
route_analyzer = RouteAnalysis()
data_processor = DataProcessor()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Service',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/train', methods=['POST'])
def train_models():
    """Train ML models with provided data"""
    try:
        data = request.json
        
        if not data or 'bookings' not in data:
            return jsonify({'error': 'Missing bookings data'}), 400
        
        bookings_data = data['bookings']
        routes_data = data.get('routes', [])
        
        # Process data
        df_bookings = data_processor.process_bookings(bookings_data)
        
        if df_bookings.empty:
            return jsonify({'error': 'No valid training data'}), 400
        
        # Train demand forecast model
        demand_metrics = demand_model.train(df_bookings)
        
        # Save training metadata
        metadata = {
            'trained_at': datetime.now().isoformat(),
            'total_records': len(bookings_data),
            'demand_metrics': demand_metrics,
            'date_range': {
                'start': df_bookings['date'].min().isoformat(),
                'end': df_bookings['date'].max().isoformat()
            }
        }
        
        with open(os.path.join(MODEL_DIR, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'Models trained successfully',
            'metadata': metadata
        })
        
    except Exception as e:
        print(f"Training error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Generate predictions"""
    try:
        data = request.json
        
        if not data or 'bookings' not in data:
            return jsonify({'error': 'Missing bookings data'}), 400
        
        bookings_data = data['bookings']
        routes_data = data.get('routes', [])
        
        # Process data
        df_bookings = data_processor.process_bookings(bookings_data)
        
        if df_bookings.empty:
            return jsonify({'error': 'No valid data for prediction'}), 400
        
        # Generate demand forecast (7 days)
        demand_forecast = demand_model.predict(days=7)
        
        # Analyze routes
        route_analysis = route_analyzer.analyze(bookings_data, routes_data)
        
        return jsonify({
            'success': True,
            'demand_forecast': demand_forecast,
            'route_analysis': route_analysis,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get model information and status"""
    try:
        metadata_path = os.path.join(MODEL_DIR, 'metadata.json')
        
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            model_exists = demand_model.model_exists()
            
            return jsonify({
                'model_trained': model_exists,
                'metadata': metadata
            })
        else:
            return jsonify({
                'model_trained': False,
                'message': 'No trained model found'
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Travel ML Service Starting...")
    print("=" * 60)
    print(f"📁 Model directory: {MODEL_DIR}")
    print(f"🌐 Running on: http://localhost:5001")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5001, debug=True)
