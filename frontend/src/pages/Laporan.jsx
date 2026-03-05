import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Pagination from '../components/Pagination';

function Laporan() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [routeRevenue, setRouteRevenue] = useState([]);
  const [vehicleUtilization, setVehicleUtilization] = useState([]);
  const [driverPerformance, setDriverPerformance] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);

  // Pagination states
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);
  const [routeCurrentPage, setRouteCurrentPage] = useState(1);
  const [vehicleCurrentPage, setVehicleCurrentPage] = useState(1);
  const [driverCurrentPage, setDriverCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [activeTab, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = { startDate, endDate };
      
      switch (activeTab) {
        case 'overview':
          const overviewRes = await api.get('/laporan/overview', { params });
          setOverview(overviewRes.data.data);
          break;
        case 'sales':
          const salesRes = await api.get('/laporan/sales', { params: { ...params, groupBy: 'day' } });
          setSalesReport(salesRes.data.data);
          break;
        case 'route':
          const routeRes = await api.get('/laporan/route-revenue', { params });
          setRouteRevenue(routeRes.data.data);
          break;
        case 'vehicle':
          const vehicleRes = await api.get('/laporan/vehicle-utilization', { params });
          setVehicleUtilization(vehicleRes.data.data);
          break;
        case 'driver':
          const driverRes = await api.get('/laporan/driver-performance', { params });
          setDriverPerformance(driverRes.data.data);
          break;
        case 'customers':
          const customerRes = await api.get('/laporan/top-customers', { params: { ...params, limit: 10 } });
          setTopCustomers(customerRes.data.data);
          break;
      }
    } catch (err) {
      setError(t('reports.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await api.get('/laporan/export', {
        params: { type, startDate, endDate }
      });
      
      // Create download link
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-${type}-${Date.now()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(t('reports.exportError'));
      console.error(err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', label: t('reports.tabs.overview'), icon: '📊' },
    { id: 'sales', label: t('reports.tabs.sales'), icon: '💰' },
    { id: 'route', label: t('reports.tabs.route'), icon: '🗺️' },
    { id: 'vehicle', label: t('reports.tabs.vehicle'), icon: '🚐' },
    { id: 'driver', label: t('reports.tabs.driver'), icon: '👨‍✈️' },
    { id: 'customers', label: t('reports.tabs.customers'), icon: '👥' }
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('reports.title')}</h1>
        <p className="text-gray-600 mt-1">{t('reports.subtitle')}</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.endDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex-1"></div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => setActiveTab(activeTab)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t('reports.refreshData')}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-x-auto">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">{t('reports.loadingData')}</p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && overview && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
                  <div className="text-3xl mb-2">🎫</div>
                  <div className="text-2xl font-bold">{overview.totalBookings}</div>
                  <div className="text-sm opacity-90">{t('reports.overview.totalBookings')}</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</div>
                  <div className="text-sm opacity-90">{t('reports.overview.totalRevenue')}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
                  <div className="text-3xl mb-2">🚐</div>
                  <div className="text-2xl font-bold">{overview.totalVehicles}</div>
                  <div className="text-sm opacity-90">{t('reports.overview.totalVehicles')}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
                  <div className="text-3xl mb-2">👨‍✈️</div>
                  <div className="text-2xl font-bold">{overview.totalDrivers}</div>
                  <div className="text-sm opacity-90">{t('reports.overview.totalDrivers')}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-lg font-bold text-gray-800 mb-2">📍 {t('reports.overview.totalRoutes')}</div>
                  <div className="text-3xl font-bold text-blue-600">{overview.totalRoutes}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-lg font-bold text-gray-800 mb-2">👥 {t('reports.overview.totalCustomers')}</div>
                  <div className="text-3xl font-bold text-green-600">{overview.totalCustomers}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-lg font-bold text-gray-800 mb-2">📅 {t('reports.overview.activeSchedules')}</div>
                  <div className="text-3xl font-bold text-purple-600">{overview.activeSchedules}</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('reports.overview.bookingsByStatus')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {overview.bookingsByStatus.map((item) => (
                    <div key={item.status} className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">{item.status}</div>
                      <div className="text-2xl font-bold text-gray-800 mb-1">{item.count}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(item.revenue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sales Report Tab */}
          {activeTab === 'sales' && salesReport && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-600 mb-1">{t('reports.sales.totalBookings')}</div>
                  <div className="text-2xl font-bold text-gray-800">{salesReport.summary.totalBookings}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-600 mb-1">{t('reports.sales.totalRevenue')}</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(salesReport.summary.totalRevenue)}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-600 mb-1">{t('reports.sales.totalSeats')}</div>
                  <div className="text-2xl font-bold text-blue-600">{salesReport.summary.totalSeats}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm text-gray-600 mb-1">{t('reports.sales.averagePrice')}</div>
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(salesReport.summary.averagePrice)}</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800">{t('reports.sales.dailyTrend')}</h2>
                  <button
                    onClick={() => handleExport('sales')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    📥 {t('reports.export')}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.sales.date')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.sales.bookings')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.sales.seats')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.sales.revenue')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {salesReport.grouped.slice((salesCurrentPage - 1) * itemsPerPage, salesCurrentPage * itemsPerPage).map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{item.count}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{item.seats}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">{formatCurrency(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {salesReport.grouped.length > 0 && (
                  <Pagination
                    currentPage={salesCurrentPage}
                    totalItems={salesReport.grouped.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setSalesCurrentPage}
                  />
                )}
              </div>
            </div>
          )}

          {/* Route Revenue Tab */}
          {activeTab === 'route' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">{t('reports.route.title')}</h2>
                <button
                  onClick={() => handleExport('route')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  📥 {t('reports.export')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.route.route')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.route.bookings')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.route.seats')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.route.revenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {routeRevenue.slice((routeCurrentPage - 1) * itemsPerPage, routeCurrentPage * itemsPerPage).map((route) => (
                      <tr key={route.routeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">{route.routeName}</div>
                          <div className="text-xs text-gray-500">{route.origin} → {route.destination}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">{route.bookingCount}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{route.totalSeats}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">{formatCurrency(route.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {routeRevenue.length > 0 && (
                <Pagination
                  currentPage={routeCurrentPage}
                  totalItems={routeRevenue.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setRouteCurrentPage}
                />
              )}
            </div>
          )}

          {/* Vehicle Utilization Tab */}
          {activeTab === 'vehicle' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">{t('reports.vehicle.title')}</h2>
                <button
                  onClick={() => handleExport('vehicle')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  📥 {t('reports.export')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.vehicle.vehicle')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.vehicle.trips')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.vehicle.capacity')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.vehicle.filled')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.vehicle.utilization')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.vehicle.revenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vehicleUtilization.slice((vehicleCurrentPage - 1) * itemsPerPage, vehicleCurrentPage * itemsPerPage).map((vehicle) => (
                      <tr key={vehicle.vehicleId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">{vehicle.plateNumber}</div>
                          <div className="text-xs text-gray-500">{vehicle.vehicleType}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">{vehicle.totalTrips}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{vehicle.totalSeatsAvailable}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{vehicle.totalSeatsBooked}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  vehicle.utilizationRate >= 80 ? 'bg-green-500' :
                                  vehicle.utilizationRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${vehicle.utilizationRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-800">{vehicle.utilizationRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">{formatCurrency(vehicle.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {vehicleUtilization.length > 0 && (
                <Pagination
                  currentPage={vehicleCurrentPage}
                  totalItems={vehicleUtilization.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setVehicleCurrentPage}
                />
              )}
            </div>
          )}

          {/* Driver Performance Tab */}
          {activeTab === 'driver' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">{t('reports.driver.title')}</h2>
                <button
                  onClick={() => handleExport('driver')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  📥 {t('reports.export')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.driver.driver')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.driver.totalTrips')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.driver.totalPassengers')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.driver.averagePerTrip')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.driver.revenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {driverPerformance.slice((driverCurrentPage - 1) * itemsPerPage, driverCurrentPage * itemsPerPage).map((driver) => (
                      <tr key={driver.driverId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">{driver.driverName}</div>
                          <div className="text-xs text-gray-500">{driver.licenseNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">{driver.totalTrips}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{driver.totalPassengers}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{driver.averagePassengersPerTrip}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">{formatCurrency(driver.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {driverPerformance.length > 0 && (
                <Pagination
                  currentPage={driverCurrentPage}
                  totalItems={driverPerformance.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setDriverCurrentPage}
                />
              )}
            </div>
          )}

          {/* Top Customers Tab */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t('reports.customers.title')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.customers.rank')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.customers.customer')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.customers.totalBookings')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.customers.totalSpending')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.customers.average')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('reports.customers.lastBooking')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topCustomers.map((customer, idx) => (
                      <tr key={customer.customerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                            idx === 1 ? 'bg-gray-300 text-gray-900' :
                            idx === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-blue-100 text-blue-900'
                          }`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">{customer.totalBookings}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</td>
                        <td className="px-6 py-4 text-sm text-gray-800">{formatCurrency(customer.averageSpent)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {customer.lastBookingDate ? formatDate(customer.lastBookingDate) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Laporan;
