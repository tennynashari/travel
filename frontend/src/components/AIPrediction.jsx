import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AIPrediction() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ml/model-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setModelStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error checking model status:', error);
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/ml/train`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess(t('ai.trainSuccess'));
        checkModelStatus();
      }
    } catch (error) {
      setError(error.response?.data?.message || t('ai.trainError'));
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/ml/predict`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPredictions(response.data.data);
        setSuccess(t('ai.predictSuccess'));
      }
    } catch (error) {
      setError(error.response?.data?.message || t('ai.predictError'));
    } finally {
      setPredicting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return '↑';
    if (trend === 'decreasing') return '↓';
    return '→';
  };

  const getTrendColor = (trend) => {
    if (trend === 'increasing') return 'text-green-600';
    if (trend === 'decreasing') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">{t('ai.title')}</h2>
            <p className="text-sm sm:text-base opacity-90">{t('ai.subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={handleTrain}
              disabled={training}
              className="w-full sm:w-auto bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {training ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  {t('ai.training')}
                </>
              ) : (
                <>
                  <span className="mr-2">🤖</span>
                  {t('ai.fetchTrain')}
                </>
              )}
            </button>
            <button
              onClick={handlePredict}
              disabled={predicting || !modelStatus?.model_trained}
              className="w-full sm:w-auto bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-300 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {predicting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  {t('ai.predicting')}
                </>
              ) : (
                <>
                  <span className="mr-2">🔮</span>
                  {t('ai.predict')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Model Status */}
        {modelStatus && (
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center px-2 py-1 bg-white bg-opacity-20 rounded">
              {modelStatus.model_trained ? '✅' : '⚠️'} 
              <span className="ml-1">{modelStatus.model_trained ? t('ai.modelReady') : t('ai.modelNotTrained')}</span>
            </span>
            {modelStatus.metadata?.trained_at && (
              <span className="opacity-75">
                {t('ai.lastTrained')}: {formatDate(modelStatus.metadata.trained_at)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Predictions Display */}
      {predictions && (
        <>
          {/* Demand Forecast */}
          {predictions.demand_forecast && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4 border-b">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                  <span className="mr-2">📈</span>
                  {t('ai.demandForecast')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('ai.next7Days')}</p>
              </div>

              {/* Chart - Desktop */}
              <div className="p-3 sm:p-6 hidden md:block">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={predictions.demand_forecast.predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => formatDate(date)}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip 
                      labelFormatter={(date) => formatDate(date)}
                      formatter={(value) => [value + ' ' + t('ai.passengers'), t('ai.predicted')]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted_passengers" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      name={t('ai.passengers')}
                      dot={{ fill: '#8b5cf6', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-3">
                <div className="grid grid-cols-2 gap-2">
                  {predictions.demand_forecast.predictions.map((pred, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">{pred.day_name}</div>
                      <div className="text-sm font-medium text-gray-700">{formatDate(pred.date)}</div>
                      <div className="text-lg font-bold text-purple-600 mt-2">
                        {pred.predicted_passengers}
                      </div>
                      <div className="text-xs text-gray-500">{t('ai.passengers')}</div>
                      {pred.is_weekend && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                          Weekend
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-3 sm:p-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs text-gray-500">{t('ai.totalPredicted')}</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-800">
                    {predictions.demand_forecast.summary.total_predicted}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('ai.dailyAverage')}</div>
                  <div className="text-lg sm:text-xl font-bold text-gray-800">
                    {predictions.demand_forecast.summary.daily_average}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('ai.trend')}</div>
                  <div className={`text-lg sm:text-xl font-bold ${getTrendColor(predictions.demand_forecast.summary.trend)}`}>
                    {getTrendIcon(predictions.demand_forecast.summary.trend)} {t(`ai.${predictions.demand_forecast.summary.trend}`)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('ai.peakDays')}</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-700 mt-1">
                    {predictions.demand_forecast.summary.peak_days.map(d => formatDate(d)).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Route Analysis */}
          {predictions.route_analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Top Routes */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 border-b">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                    <span className="mr-2">🏆</span>
                    {t('ai.topRoutes')}
                  </h3>
                </div>
                <div className="p-3 sm:p-4">
                  {predictions.route_analysis.top_routes.map((route, index) => (
                    <div key={index} className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg sm:text-xl font-bold text-gray-400">#{index + 1}</span>
                            <span className="text-sm sm:text-base font-bold text-gray-800 truncate">{route.route}</span>
                          </div>
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold ml-2 ${route.trend === 'increasing' ? 'text-green-600' : route.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'}`}>
                          {getTrendIcon(route.trend)} {route.trend_percentage > 0 ? '+' : ''}{route.trend_percentage}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500">{t('ai.passengers')}:</span>
                          <span className="ml-1 font-semibold text-gray-800">{route.total_passengers}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t('ai.bookings')}:</span>
                          <span className="ml-1 font-semibold text-gray-800">{route.total_bookings}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">{t('ai.revenue')}:</span>
                          <span className="ml-1 font-semibold text-gray-800">{formatCurrency(route.total_revenue)}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{t('ai.occupancy')}</span>
                          <span className="font-semibold">{Math.round(route.occupancy_rate * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${route.occupancy_rate * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Routes */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 sm:p-4 border-b">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                    <span className="mr-2">⚠️</span>
                    {t('ai.bottomRoutes')}
                  </h3>
                </div>
                <div className="p-3 sm:p-4">
                  {predictions.route_analysis.bottom_routes.length > 0 ? (
                    predictions.route_analysis.bottom_routes.map((route, index) => (
                      <div key={index} className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm sm:text-base font-bold text-gray-800 block truncate">{route.route}</span>
                          </div>
                          <span className={`text-xs sm:text-sm font-semibold ml-2 ${route.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'}`}>
                            {getTrendIcon(route.trend)} {route.trend_percentage > 0 ? '+' : ''}{route.trend_percentage}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500">{t('ai.passengers')}:</span>
                            <span className="ml-1 font-semibold text-gray-800">{route.total_passengers}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{t('ai.bookings')}:</span>
                            <span className="ml-1 font-semibold text-gray-800">{route.total_bookings}</span>
                          </div>
                        </div>
                        {route.recommendation && (
                          <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700 border border-orange-200">
                            💡 {route.recommendation}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4 text-sm">
                      {t('ai.noBottomRoutes')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!predictions && !loading && (
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-12 text-center">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🤖</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{t('ai.noData')}</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            {modelStatus?.model_trained ? t('ai.clickPredict') : t('ai.clickTrain')}
          </p>
        </div>
      )}
    </div>
  );
}

export default AIPrediction;
