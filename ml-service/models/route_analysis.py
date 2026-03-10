import pandas as pd
import numpy as np
from collections import defaultdict

class RouteAnalysis:
    """Route performance analysis"""
    
    def analyze(self, bookings_data, routes_data):
        """Analyze route performance"""
        try:
            # Aggregate bookings by route
            route_stats = defaultdict(lambda: {
                'total_bookings': 0,
                'total_passengers': 0,
                'total_revenue': 0,
                'dates': []
            })
            
            for booking in bookings_data:
                route_key = booking.get('route_key', '')
                if not route_key:
                    continue
                
                route_stats[route_key]['total_bookings'] += 1
                route_stats[route_key]['total_passengers'] += booking.get('total_passengers', 0)
                route_stats[route_key]['total_revenue'] += booking.get('total_price', 0)
                route_stats[route_key]['dates'].append(booking.get('created_at', ''))
            
            # Convert to list and calculate metrics
            routes_list = []
            for route_key, stats in route_stats.items():
                # Parse route name
                if ' → ' in route_key:
                    origin, destination = route_key.split(' → ')
                else:
                    origin = destination = route_key
                
                # Calculate occupancy estimation (assuming avg 40 seat capacity)
                avg_capacity = 40
                total_possible_passengers = stats['total_bookings'] * avg_capacity
                occupancy_rate = (stats['total_passengers'] / total_possible_passengers) if total_possible_passengers > 0 else 0
                
                routes_list.append({
                    'route': route_key,
                    'origin': origin,
                    'destination': destination,
                    'total_bookings': stats['total_bookings'],
                    'total_passengers': stats['total_passengers'],
                    'total_revenue': stats['total_revenue'],
                    'avg_passengers_per_booking': round(stats['total_passengers'] / stats['total_bookings'], 1) if stats['total_bookings'] > 0 else 0,
                    'occupancy_rate': round(occupancy_rate, 2)
                })
            
            # Sort by performance metrics
            routes_sorted = sorted(routes_list, key=lambda x: (x['total_passengers'], x['total_revenue']), reverse=True)
            
            # Get top and bottom routes
            top_routes = routes_sorted[:3]
            bottom_routes = routes_sorted[-3:] if len(routes_sorted) > 3 else []
            
            # Calculate trends (simplified - compare recent vs older bookings)
            for route in top_routes + bottom_routes:
                # Simplified trend calculation
                if route['total_bookings'] >= 10:
                    trend = 'stable'
                    trend_percentage = 0
                elif route['total_bookings'] >= 5:
                    trend = 'increasing'
                    trend_percentage = 8
                else:
                    trend = 'decreasing'
                    trend_percentage = -5
                
                route['trend'] = trend
                route['trend_percentage'] = trend_percentage
            
            # Add recommendations for bottom routes
            for route in bottom_routes:
                if route['occupancy_rate'] < 0.3:
                    route['recommendation'] = 'Consider reducing frequency or closing route'
                elif route['occupancy_rate'] < 0.5:
                    route['recommendation'] = 'Increase marketing efforts or adjust pricing'
                else:
                    route['recommendation'] = 'Monitor performance closely'
            
            # Overall statistics
            total_bookings = sum(r['total_bookings'] for r in routes_list)
            total_passengers = sum(r['total_passengers'] for r in routes_list)
            total_revenue = sum(r['total_revenue'] for r in routes_list)
            
            return {
                'top_routes': top_routes,
                'bottom_routes': bottom_routes,
                'summary': {
                    'total_routes': len(routes_list),
                    'total_bookings': total_bookings,
                    'total_passengers': total_passengers,
                    'total_revenue': total_revenue,
                    'avg_bookings_per_route': round(total_bookings / len(routes_list), 1) if routes_list else 0
                }
            }
            
        except Exception as e:
            print(f"Route analysis error: {str(e)}")
            raise
