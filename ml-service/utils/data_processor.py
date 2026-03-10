import pandas as pd
from datetime import datetime

class DataProcessor:
    """Data preprocessing utilities"""
    
    def process_bookings(self, bookings_data):
        """Process raw bookings data into DataFrame"""
        try:
            if not bookings_data:
                return pd.DataFrame()
            
            # Convert to DataFrame
            processed = []
            for booking in bookings_data:
                try:
                    # Parse date
                    created_at = booking.get('created_at', '')
                    if isinstance(created_at, str):
                        date = pd.to_datetime(created_at).date()
                    else:
                        date = created_at
                    
                    processed.append({
                        'date': date,
                        'total_passengers': booking.get('total_passengers', 0),
                        'total_price': booking.get('total_price', 0),
                        'route_key': booking.get('route_key', ''),
                        'status': booking.get('status', '')
                    })
                except Exception as e:
                    print(f"Error processing booking: {str(e)}")
                    continue
            
            if not processed:
                return pd.DataFrame()
            
            df = pd.DataFrame(processed)
            
            # Filter only paid bookings
            if 'status' in df.columns:
                df = df[df['status'] == 'PAID']
            
            # Remove invalid dates
            df = df[df['date'].notna()]
            
            return df
            
        except Exception as e:
            print(f"Data processing error: {str(e)}")
            return pd.DataFrame()
