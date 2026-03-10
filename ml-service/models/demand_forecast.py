import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import joblib
import os

class DemandForecast:
    """Demand forecasting model for passenger prediction"""
    
    def __init__(self, model_dir):
        self.model_dir = model_dir
        self.model_path = os.path.join(model_dir, 'demand_model.pkl')
        self.model = None
        self.features_mean = None
        self.features_std = None
        
    def model_exists(self):
        """Check if trained model exists"""
        return os.path.exists(self.model_path)
    
    def train(self, df):
        """Train demand forecast model"""
        try:
            # Aggregate by date
            daily_data = df.groupby('date').agg({
                'total_passengers': 'sum'
            }).reset_index()
            
            daily_data = daily_data.sort_values('date')
            
            # Feature engineering
            daily_data['day_of_week'] = pd.to_datetime(daily_data['date']).dt.dayofweek
            daily_data['day_of_month'] = pd.to_datetime(daily_data['date']).dt.day
            daily_data['month'] = pd.to_datetime(daily_data['date']).dt.month
            daily_data['days_from_start'] = (pd.to_datetime(daily_data['date']) - pd.to_datetime(daily_data['date']).min()).dt.days
            
            # Rolling averages for trend
            daily_data['rolling_7d'] = daily_data['total_passengers'].rolling(window=7, min_periods=1).mean()
            daily_data['rolling_14d'] = daily_data['total_passengers'].rolling(window=14, min_periods=1).mean()
            
            # Prepare features
            features = ['day_of_week', 'day_of_month', 'month', 'days_from_start', 'rolling_7d', 'rolling_14d']
            X = daily_data[features].fillna(0)
            y = daily_data['total_passengers']
            
            # Normalize features
            self.features_mean = X.mean()
            self.features_std = X.std()
            X_normalized = (X - self.features_mean) / (self.features_std + 1e-8)
            
            # Train model
            self.model = LinearRegression()
            self.model.fit(X_normalized, y)
            
            # Calculate metrics
            predictions = self.model.predict(X_normalized)
            mse = np.mean((predictions - y) ** 2)
            rmse = np.sqrt(mse)
            mae = np.mean(np.abs(predictions - y))
            
            # R-squared
            ss_res = np.sum((y - predictions) ** 2)
            ss_tot = np.sum((y - y.mean()) ** 2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
            
            # Save model
            model_data = {
                'model': self.model,
                'features_mean': self.features_mean,
                'features_std': self.features_std,
                'last_date': daily_data['date'].max(),
                'last_rolling_7d': daily_data['rolling_7d'].iloc[-1],
                'last_rolling_14d': daily_data['rolling_14d'].iloc[-1],
                'historical_avg': daily_data['total_passengers'].mean()
            }
            joblib.dump(model_data, self.model_path)
            
            return {
                'rmse': round(rmse, 2),
                'mae': round(mae, 2),
                'r2_score': round(r2, 4),
                'training_samples': len(daily_data)
            }
            
        except Exception as e:
            print(f"Training error: {str(e)}")
            raise
    
    def predict(self, days=7):
        """Predict passenger demand for next N days"""
        try:
            # Load model
            if not self.model_exists():
                raise Exception("Model not trained yet")
            
            model_data = joblib.load(self.model_path)
            self.model = model_data['model']
            self.features_mean = model_data['features_mean']
            self.features_std = model_data['features_std']
            
            last_date = pd.to_datetime(model_data['last_date'])
            last_rolling_7d = model_data['last_rolling_7d']
            last_rolling_14d = model_data['last_rolling_14d']
            historical_avg = model_data['historical_avg']
            
            predictions = []
            current_rolling_7d = last_rolling_7d
            current_rolling_14d = last_rolling_14d
            
            for i in range(1, days + 1):
                pred_date = last_date + timedelta(days=i)
                
                # Create features
                features = {
                    'day_of_week': pred_date.dayofweek,
                    'day_of_month': pred_date.day,
                    'month': pred_date.month,
                    'days_from_start': (pred_date - last_date).days,
                    'rolling_7d': current_rolling_7d,
                    'rolling_14d': current_rolling_14d
                }
                
                X_pred = pd.DataFrame([features])
                X_normalized = (X_pred - self.features_mean) / (self.features_std + 1e-8)
                
                predicted_passengers = self.model.predict(X_normalized)[0]
                
                # Ensure positive prediction
                predicted_passengers = max(0, predicted_passengers)
                
                # Calculate confidence based on day of week patterns
                # Weekend typically has higher variance
                if pred_date.dayofweek in [5, 6]:  # Saturday, Sunday
                    confidence = 0.75
                else:
                    confidence = 0.85
                
                predictions.append({
                    'date': pred_date.strftime('%Y-%m-%d'),
                    'day_name': pred_date.strftime('%A'),
                    'predicted_passengers': int(round(predicted_passengers)),
                    'confidence': confidence,
                    'is_weekend': pred_date.dayofweek >= 5
                })
                
                # Update rolling averages (simplified)
                current_rolling_7d = (current_rolling_7d * 0.9 + predicted_passengers * 0.1)
                current_rolling_14d = (current_rolling_14d * 0.95 + predicted_passengers * 0.05)
            
            # Analyze trend
            values = [p['predicted_passengers'] for p in predictions]
            trend = 'increasing' if values[-1] > values[0] else 'decreasing' if values[-1] < values[0] else 'stable'
            
            # Find peak days
            peak_days = sorted(predictions, key=lambda x: x['predicted_passengers'], reverse=True)[:2]
            
            return {
                'predictions': predictions,
                'summary': {
                    'total_predicted': sum(values),
                    'daily_average': int(round(np.mean(values))),
                    'trend': trend,
                    'peak_days': [p['date'] for p in peak_days],
                    'historical_average': int(round(historical_avg))
                }
            }
            
        except Exception as e:
            print(f"Prediction error: {str(e)}")
            raise
