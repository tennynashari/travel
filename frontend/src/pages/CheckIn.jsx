import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';

function CheckIn() {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterCheckedIn, setFilterCheckedIn] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchSchedules();
  }, [filterDate]);

  useEffect(() => {
    if (selectedSchedule) {
      fetchScheduleBookings(selectedSchedule.id);
    }
  }, [selectedSchedule, filterCheckedIn]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDate) params.date = filterDate;
      
      const response = await api.get('/checkin/schedules', { params });
      setSchedules(response.data.data);
      
      // Auto-select first schedule if available
      if (response.data.data.length > 0 && !selectedSchedule) {
        setSelectedSchedule(response.data.data[0]);
      }
    } catch (err) {
      setError('Gagal mengambil data jadwal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleBookings = async (scheduleId) => {
    try {
      setLoading(true);
      const params = {};
      if (filterCheckedIn !== 'all') {
        params.checkedIn = filterCheckedIn;
      }
      
      const response = await api.get(`/checkin/schedules/${scheduleId}/bookings`, { params });
      setBookings(response.data.data);
      setStats(response.data.stats);
      setError('');
    } catch (err) {
      setError('Gagal mengambil data booking');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const response = await api.post(`/checkin/bookings/${bookingId}/checkin`);
      setSuccess('Check-in berhasil!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh bookings
      if (selectedSchedule) {
        fetchScheduleBookings(selectedSchedule.id);
        fetchSchedules(); // Refresh schedule stats
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan check-in');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleUndoCheckIn = async (bookingId) => {
    if (!confirm('Yakin ingin membatalkan check-in ini?')) return;
    
    try {
      await api.post(`/checkin/bookings/${bookingId}/undo`);
      setSuccess('Check-in berhasil dibatalkan');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh bookings
      if (selectedSchedule) {
        fetchScheduleBookings(selectedSchedule.id);
        fetchSchedules();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membatalkan check-in');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleBulkCheckIn = async () => {
    if (!confirm('Yakin ingin check-in semua booking yang belum di-check in?')) return;
    
    try {
      const response = await api.post(`/checkin/schedules/${selectedSchedule.id}/bulk-checkin`);
      setSuccess(response.data.message);
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh bookings
      fetchScheduleBookings(selectedSchedule.id);
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan bulk check-in');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Check-In Penumpang</h1>
        <p className="text-gray-600 mt-1">Kelola check-in penumpang untuk setiap jadwal keberangkatan</p>
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

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Filter Tanggal:
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            onClick={() => setFilterDate('')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Daftar Jadwal</h2>
            
            {loading && !selectedSchedule ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Memuat...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada jadwal
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedSchedule?.id === schedule.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800 mb-1">
                      {schedule.route.originCity.name} → {schedule.route.destinationCity.name}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {formatDate(schedule.departureDate).split(',')[0]}, {schedule.departureTime}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {schedule.vehicle.plateNumber} • {schedule.driver.user.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        ✓ {schedule.bookingStats.checkedIn}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        ⏳ {schedule.bookingStats.pending}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                        Total: {schedule.bookingStats.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking List & Details */}
        <div className="lg:col-span-2">
          {!selectedSchedule ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Pilih Jadwal</h2>
              <p className="text-gray-600">Pilih jadwal untuk melihat daftar booking</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Booking</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-sm text-gray-600 mb-1">Sudah Check-In</div>
                    <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-sm text-gray-600 mb-1">Belum Check-In</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Kursi</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.checkedInSeats}/{stats.totalSeats}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    Filter Status:
                  </label>
                  <select
                    value={filterCheckedIn}
                    onChange={(e) => setFilterCheckedIn(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="all">Semua</option>
                    <option value="true">Sudah Check-In</option>
                    <option value="false">Belum Check-In</option>
                  </select>
                </div>
                {stats && stats.pending > 0 && (
                  <button
                    onClick={handleBulkCheckIn}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Check-In Semua ({stats.pending})
                  </button>
                )}
              </div>

              {/* Bookings Table */}
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
                            Booking
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Penumpang
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kursi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Waktu Check-In
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookings.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                              Tidak ada booking
                            </td>
                          </tr>
                        ) : (
                          bookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking, index) => (
                            <tr key={booking.id} className={`hover:bg-gray-50 ${booking.checkedIn ? 'bg-green-50' : ''}`}>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-800">
                                  {booking.bookingCode}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {booking.status}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold">
                                      {booking.user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-800">{booking.user.name}</div>
                                    <div className="text-xs text-gray-500">{booking.user.phone || booking.user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-800">
                                  {booking.seatNumbers.join(', ')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {booking.totalSeats} kursi
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {booking.checkedIn ? (
                                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    ✓ Sudah Check-In
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    ⏳ Belum Check-In
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {booking.checkedIn ? formatTime(booking.checkInTime) : '-'}
                              </td>
                              <td className="px-6 py-4">
                                {booking.checkedIn ? (
                                  <button
                                    onClick={() => handleUndoCheckIn(booking.id)}
                                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                  >
                                    Batalkan
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleCheckIn(booking.id)}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                  >
                                    Check-In
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {!loading && bookings.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalItems={bookings.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckIn;
