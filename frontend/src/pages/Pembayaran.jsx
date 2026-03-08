import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Pagination from '../components/Pagination';

function Pembayaran() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchPayments();
    fetchStats();
    fetchPaymentMethods();
  }, [filterStartDate, filterEndDate, filterMethod]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterMethod) params.paymentMethod = filterMethod;
      
      const response = await api.get('/payments', { params });
      setPayments(response.data.data);
    } catch (err) {
      setError(t('payment.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      
      const response = await api.get('/payments/stats', { params });
      setStats(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil statistik:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payments/methods');
      setPaymentMethods(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil metode pembayaran:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      PAID: 'bg-green-100 text-green-800',
      CONFIRMED: 'bg-blue-100 text-blue-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    return t(`booking.status.${status}`);
  };

  const handleResetFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMethod('');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t('payment.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">{t('payment.subtitle')}</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">💰</div>
              <div className="text-sm opacity-90">{t('payment.total')}</div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-sm opacity-90">{stats.totalPayments} {t('payment.transactions')}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📅</div>
              <div className="text-sm opacity-90">{t('payment.today')}</div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <div className="text-sm opacity-90">{t('payment.todayRevenue')}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📈</div>
              <div className="text-sm opacity-90">{t('payment.last7Days')}</div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {stats.recentPayments}
            </div>
            <div className="text-sm opacity-90">{t('payment.weekTransactions')}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">💳</div>
              <div className="text-sm opacity-90">{t('payment.paymentMethod')}</div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {Object.keys(stats.byPaymentMethod).length}
            </div>
            <div className="text-sm opacity-90">{t('payment.activeMethods')}</div>
          </div>
        </div>
      )}

      {/* Payment Methods Breakdown */}
      {stats && Object.keys(stats.byPaymentMethod).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t('payment.paymentPerMethod')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.byPaymentMethod).map(([method, data]) => (
              <div key={method} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{method}</div>
                <div className="text-xl font-bold text-gray-800 mb-1">
                  {formatCurrency(data.total)}
                </div>
                <div className="text-xs text-gray-500">{data.count} {t('payment.transactions')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('payment.startDate')}
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('payment.endDate')}
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('payment.paymentMethod')}
            </label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">{t('payment.allMethods')}</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleResetFilter}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              {t('payment.resetFilter')}
            </button>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">{t('common.loading')}</p>
          </div>
        ) : (
          <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payment.bookingCode')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('booking.customer')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payment.routeSchedule')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payment.paymentMethod')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payment.paymentTime')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('booking.total')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {filterStartDate || filterEndDate || filterMethod
                        ? t('payment.noPaymentFilter')
                        : t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((payment, index) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">
                          {payment.bookingCode}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.totalSeats} {t('schedule.seats')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {payment.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-800">{payment.user.name}</div>
                            <div className="text-xs text-gray-500">{payment.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">
                          {payment.schedule.route.originCity.name} → {payment.schedule.route.destinationCity.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(payment.schedule.departureDate).split(',')[0]} • {payment.schedule.departureTime}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {payment.paymentMethod || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-800">
                          {formatCurrency(payment.totalPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden">
            {payments.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                {filterStartDate || filterEndDate || filterMethod
                  ? t('payment.noPaymentFilter')
                  : t('common.noData')}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((payment) => (
                  <div key={payment.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium mb-1">
                          {payment.bookingCode}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">{payment.totalSeats} {t('schedule.seats')}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusBadge(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </div>
                    
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {payment.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{payment.user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{payment.user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-gray-500">Rute & Jadwal:</span>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">
                          {payment.schedule.route.originCity.name} → {payment.schedule.route.destinationCity.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(payment.schedule.departureDate).split(',')[0]} • {payment.schedule.departureTime}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div>
                          <span className="text-gray-500">Metode Bayar:</span>
                          <p className="font-medium text-gray-800 mt-0.5">
                            {payment.paymentMethod || '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Waktu Bayar:</span>
                          <p className="font-medium text-gray-800 mt-0.5">
                            {formatDate(payment.paidAt).split(',')[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Total:</span>
                      <p className="text-lg font-bold text-gray-800">{formatCurrency(payment.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
        )}
        {!loading && payments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={payments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Total Summary */}
      {payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">{t('payment.totalDisplayed')}</div>
              <div className="text-3xl font-bold text-gray-800 mt-1">
                {formatCurrency(payments.reduce((sum, p) => sum + p.totalPrice, 0))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">{t('payment.transactionCount')}</div>
              <div className="text-3xl font-bold text-gray-800 mt-1">{payments.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pembayaran;
