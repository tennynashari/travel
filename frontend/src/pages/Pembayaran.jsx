import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';

function Pembayaran() {
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
      setError('Gagal mengambil data pembayaran');
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
    const labels = {
      PAID: 'Sudah Bayar',
      CONFIRMED: 'Terkonfirmasi'
    };
    return labels[status] || status;
  };

  const handleResetFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMethod('');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pembayaran</h1>
        <p className="text-gray-600 mt-1">Kelola dan pantau pembayaran tiket</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">💰</div>
              <div className="text-sm opacity-90">Total</div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-sm opacity-90">{stats.totalPayments} transaksi</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📅</div>
              <div className="text-sm opacity-90">Hari Ini</div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <div className="text-sm opacity-90">Pendapatan hari ini</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📈</div>
              <div className="text-sm opacity-90">7 Hari Terakhir</div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {stats.recentPayments}
            </div>
            <div className="text-sm opacity-90">Transaksi minggu ini</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">💳</div>
              <div className="text-sm opacity-90">Metode Pembayaran</div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {Object.keys(stats.byPaymentMethod).length}
            </div>
            <div className="text-sm opacity-90">Metode aktif</div>
          </div>
        </div>
      )}

      {/* Payment Methods Breakdown */}
      {stats && Object.keys(stats.byPaymentMethod).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Pembayaran per Metode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.byPaymentMethod).map(([method, data]) => (
              <div key={method} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{method}</div>
                <div className="text-xl font-bold text-gray-800 mb-1">
                  {formatCurrency(data.total)}
                </div>
                <div className="text-xs text-gray-500">{data.count} transaksi</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
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
              Tanggal Akhir
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
              Metode Pembayaran
            </label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Semua Metode</option>
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
              Reset Filter
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
            <p className="text-gray-600 mt-2">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rute & Jadwal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metode Pembayaran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waktu Bayar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {filterStartDate || filterEndDate || filterMethod
                        ? 'Tidak ada pembayaran yang sesuai filter'
                        : 'Belum ada data pembayaran'}
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
                          {payment.totalSeats} kursi
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
                )}
              </tbody>
            </table>
          </div>
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
              <div className="text-sm text-gray-600">Total Pembayaran yang Ditampilkan</div>
              <div className="text-3xl font-bold text-gray-800 mt-1">
                {formatCurrency(payments.reduce((sum, p) => sum + p.totalPrice, 0))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Jumlah Transaksi</div>
              <div className="text-3xl font-bold text-gray-800 mt-1">{payments.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pembayaran;
