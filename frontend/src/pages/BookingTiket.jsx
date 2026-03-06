import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api, { authService } from '../services/api';
import Pagination from '../components/Pagination';

// Helper function to get seat numbers for a specific row
const getRowSeats = (rowIndex, rowsConfig) => {
  const seatsBeforeRow = rowsConfig.slice(0, rowIndex).reduce((sum, seats) => sum + seats, 0);
  const seatsInRow = rowsConfig[rowIndex];
  return Array.from({ length: seatsInRow }, (_, i) => (seatsBeforeRow + i + 1).toString());
};

function BookingTiket() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [createdBookingInfo, setCreatedBookingInfo] = useState(null);
  const [currentBooking, setCurrentBooking] = useState({
    scheduleId: '',
    seatNumbers: [],
    userId: ''
  });
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      
      const response = await api.get('/bookings', { params });
      setBookings(response.data.data);
    } catch (err) {
      setError(t('booking.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/bookings/schedules/available');
      setSchedules(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil jadwal:', err);
    }
  };

  const fetchAvailableSeats = async (scheduleId) => {
    try {
      const response = await api.get(`/bookings/schedules/${scheduleId}/seats`);
      setAvailableSeats(response.data.data);
      // Set selectedSchedule from response if available
      if (response.data.data.schedule) {
        setSelectedSchedule(response.data.data.schedule);
      }
    } catch (err) {
      console.error('Gagal mengambil kursi tersedia:', err);
    }
  };

  const handleOpenBookingModal = async () => {
    await fetchSchedules();
    setCurrentBooking({
      scheduleId: '',
      seatNumbers: [],
      userId: currentUser.role === 'CUSTOMER' ? currentUser.id : ''
    });
    setSelectedSchedule(null);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleScheduleSelect = async (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    setSelectedSchedule(schedule);
    setCurrentBooking({ ...currentBooking, scheduleId, seatNumbers: [] });
    await fetchAvailableSeats(scheduleId);
  };

  const handleOpenSeatModal = () => {
    if (!currentBooking.scheduleId) {
      setError('Pilih jadwal terlebih dahulu');
      return;
    }
    setShowSeatModal(true);
  };

  const handleSeatToggle = (seatNumber) => {
    const seats = [...currentBooking.seatNumbers];
    const index = seats.indexOf(seatNumber);
    
    if (index > -1) {
      seats.splice(index, 1);
    } else {
      seats.push(seatNumber);
    }
    
    seats.sort((a, b) => parseInt(a) - parseInt(b));
    setCurrentBooking({ ...currentBooking, seatNumbers: seats });
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (currentBooking.seatNumbers.length === 0) {
      setError(t('booking.selectMinimum'));
      return;
    }

    try {
      const response = await api.post('/bookings', currentBooking);
      const booking = response.data.data;
      
      // Save booking info and show payment modal
      setCreatedBookingInfo({
        bookingCode: booking.bookingCode,
        totalAmount: booking.totalAmount,
        seatNumbers: booking.seatNumbers,
        schedule: selectedSchedule
      });
      
      setSuccess(t('booking.createSuccess'));
      fetchBookings();
      
      // Close booking modal and show payment info
      setShowModal(false);
      setShowSeatModal(false);
      
      setTimeout(() => {
        setShowPaymentInfo(true);
        setSuccess('');
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || t('booking.saveError'));
    }
  };

  const handleUpdateStatus = async (bookingId, status, paymentMethod = null) => {
    try {
      const data = { status };
      if (paymentMethod) data.paymentMethod = paymentMethod;
      
      await api.put(`/bookings/${bookingId}`, data);
      setSuccess(t('booking.updateSuccess', { status }));
      fetchBookings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('booking.saveError'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleShowPaymentInfo = (booking) => {
    setSelectedBookingForPayment(booking);
    setShowPaymentInfo(true);
  };

  const handleClosePaymentInfo = () => {
    setShowPaymentInfo(false);
    setSelectedBookingForPayment(null);
    setCreatedBookingInfo(null);
  };

  const handleCancelBooking = async (bookingId, bookingCode) => {
    if (window.confirm(t('booking.cancelConfirm', { code: bookingCode }))) {
      try {
        await api.delete(`/bookings/${bookingId}/cancel`);
        setSuccess(t('booking.cancelSuccess'));
        fetchBookings();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || t('booking.saveError'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    return t(`booking.status.${status}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERATOR';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('booking.title')}</h1>
          <p className="text-gray-600 mt-1">{t('booking.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">{t('booking.allStatus')}</option>
            <option value="PENDING">{t('booking.status.PENDING')}</option>
            <option value="PAID">{t('booking.status.PAID')}</option>
            <option value="CONFIRMED">{t('booking.status.CONFIRMED')}</option>
            <option value="CANCELLED">{t('booking.status.CANCELLED')}</option>
          </select>
          <button
            onClick={handleOpenBookingModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('booking.newBooking')}
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}
      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">{t('common.loading')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('booking.bookingCode')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isAdmin ? t('booking.customer') : t('booking.schedule')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('booking.routeDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('booking.seat')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('booking.total')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  bookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking, index) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">{booking.bookingCode}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(booking.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isAdmin ? (
                          <div>
                            <div className="text-sm font-medium text-gray-800">{booking.user.name}</div>
                            <div className="text-xs text-gray-500">{booking.user.email}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-800">{booking.schedule.vehicle.vehicleType}</div>
                            <div className="text-xs text-gray-500">{booking.schedule.vehicle.plateNumber}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">
                          {booking.schedule?.route?.originCity?.name || 'N/A'} → {booking.schedule?.route?.destinationCity?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(booking.schedule?.departureDate)} • {booking.schedule?.departureTime}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">
                          {booking.seatNumbers.join(', ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.totalSeats} {t('schedule.seats')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {formatCurrency(booking.totalPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                        {booking.paymentMethod && (
                          <div className="text-xs text-gray-500 mt-1">{booking.paymentMethod}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col space-y-1">
                          {/* Button to view payment info - available for PENDING status */}
                          {booking.status === 'PENDING' && (
                            <button
                              onClick={() => handleShowPaymentInfo(booking)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-left flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t('booking.viewPaymentInfo')}
                            </button>
                          )}
                          {isAdmin && booking.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                const method = prompt(t('booking.enterPaymentMethod'));
                                if (method) handleUpdateStatus(booking.id, 'PAID', method);
                              }}
                              className="text-green-600 hover:text-green-800 font-medium text-left"
                            >
                              {t('booking.confirmPayment')}
                            </button>
                          )}
                          {isAdmin && booking.status === 'PAID' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                              className="text-blue-600 hover:text-blue-800 font-medium text-left"
                            >
                              {t('booking.confirm')}
                            </button>
                          )}
                          {booking.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id, booking.bookingCode)}
                              className="text-red-600 hover:text-red-800 font-medium text-left"
                            >
                              {t('booking.cancel')}
                            </button>
                          )}
                        </div>
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

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">{t('booking.newBooking')}</h2>
            </div>

            <form onSubmit={handleSubmitBooking} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.selectSchedule')} *
                  </label>
                  <select
                    value={currentBooking.scheduleId}
                    onChange={(e) => handleScheduleSelect(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('booking.availableSchedules')}</option>
                    {schedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.route?.originCity?.name || 'N/A'} → {schedule.route?.destinationCity?.name || 'N/A'} | {formatDate(schedule.departureDate)} {schedule.departureTime} | {schedule.vehicle?.vehicleType || 'N/A'} | {t('booking.seat')}: {schedule.availableSeats}/{schedule.vehicle?.capacity || 0} | {formatCurrency(schedule.ticketPrice)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSchedule && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">{t('booking.schedule')}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">{t('dashboard.route')}:</div>
                      <div className="font-medium">
                        {selectedSchedule.route?.originCity?.name || 'N/A'} → {selectedSchedule.route?.destinationCity?.name || 'N/A'}
                      </div>
                      <div className="text-gray-600">{t('schedule.departureDate')}:</div>
                      <div className="font-medium">
                        {formatDate(selectedSchedule.departureDate)} {selectedSchedule.departureTime}
                      </div>
                      <div className="text-gray-600">{t('schedule.vehicle')}:</div>
                      <div className="font-medium">
                        {selectedSchedule.vehicle.vehicleType} ({selectedSchedule.vehicle.plateNumber})
                      </div>
                      <div className="text-gray-600">{t('schedule.price')}/{t('booking.seat')}:</div>
                      <div className="font-medium">{formatCurrency(selectedSchedule.ticketPrice)}</div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.selectSeats')} * ({currentBooking.seatNumbers.length} {t('booking.selectedSeats')})
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenSeatModal}
                    disabled={!currentBooking.scheduleId}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentBooking.seatNumbers.length > 0
                      ? `${t('booking.seat')}: ${currentBooking.seatNumbers.join(', ')}`
                      : t('booking.selectSeats')}
                  </button>
                </div>

                {currentBooking.seatNumbers.length > 0 && selectedSchedule && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-600">{t('booking.total')} {t('booking.seat')}: {currentBooking.seatNumbers.length}</div>
                        <div className="text-xl font-bold text-gray-800">
                          {formatCurrency(selectedSchedule.ticketPrice * currentBooking.seatNumbers.length)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={currentBooking.seatNumbers.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('booking.confirm')} {t('booking.title')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seat Selection Modal */}
      {showSeatModal && availableSeats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">{t('booking.seatSelection')}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('schedule.availableSeats')}: {availableSeats.availableCount} {t('common.total')} {availableSeats.totalSeats} {t('schedule.seats')}
              </p>
            </div>

            <div className="p-6">
              {/* Seat Layout */}
              <div className="space-y-3">
                {selectedSchedule?.vehicle?.seatTemplate?.rowsConfig ? (
                  // Dynamic seat layout based on template
                  (() => {
                    const rowsConfig = typeof selectedSchedule.vehicle.seatTemplate.rowsConfig === 'string' 
                      ? JSON.parse(selectedSchedule.vehicle.seatTemplate.rowsConfig)
                      : selectedSchedule.vehicle.seatTemplate.rowsConfig;
                    
                    return rowsConfig.map((seatsInRow, rowIndex) => {
                      const rowSeats = getRowSeats(rowIndex, rowsConfig);
                      
                      return (
                        <div key={rowIndex} className="flex justify-center gap-3">
                          {rowSeats.map((seatNumber) => {
                            const isBooked = availableSeats.bookedSeats.includes(seatNumber);
                            const isSelected = currentBooking.seatNumbers.includes(seatNumber);

                            return (
                              <button
                                key={seatNumber}
                                type="button"
                                onClick={() => !isBooked && handleSeatToggle(seatNumber)}
                                disabled={isBooked}
                                className={`p-3 w-12 h-12 rounded-lg font-medium transition ${
                                  isBooked
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500'
                                }`}
                              >
                                {seatNumber}
                              </button>
                            );
                          })}
                        </div>
                      );
                    });
                  })()
                ) : (
                  // Fallback: Simple 5-column grid if no template
                  <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: availableSeats.totalSeats }, (_, i) => {
                      const seatNumber = (i + 1).toString();
                      const isBooked = availableSeats.bookedSeats.includes(seatNumber);
                      const isSelected = currentBooking.seatNumbers.includes(seatNumber);

                      return (
                        <button
                          key={seatNumber}
                          type="button"
                          onClick={() => !isBooked && handleSeatToggle(seatNumber)}
                          disabled={isBooked}
                          className={`p-3 rounded-lg font-medium transition ${
                            isBooked
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500'
                          }`}
                        >
                          {seatNumber}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                    <span>Terpilih</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded mr-2"></div>
                    <span>Tersedia</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                    <span>Terpesan</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {currentBooking.seatNumbers.length} {t('schedule.seats')} {t('booking.selectedSeats')}
              </div>
              <button
                type="button"
                onClick={() => setShowSeatModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Information Modal */}
      {showPaymentInfo && (createdBookingInfo || selectedBookingForPayment) && (() => {
        const paymentData = createdBookingInfo || {
          bookingCode: selectedBookingForPayment.bookingCode,
          totalAmount: selectedBookingForPayment.totalPrice,
          seatNumbers: selectedBookingForPayment.seatNumbers,
          schedule: selectedBookingForPayment.schedule
        };
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {createdBookingInfo ? t('booking.bookingSuccess') : t('booking.paymentInfo')}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {t('booking.bookingCode')}: <span className="font-bold text-green-600">{paymentData.bookingCode}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Booking Summary */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">{t('booking.orderDetails')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('dashboard.route')}:</span>
                      <span className="font-medium">
                        {paymentData.schedule?.route?.originCity?.name} → {paymentData.schedule?.route?.destinationCity?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.date')}:</span>
                      <span className="font-medium">
                        {new Date(paymentData.schedule?.departureDate).toLocaleDateString(t('common.locale'), { 
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.time')}:</span>
                      <span className="font-medium">{paymentData.schedule?.departureTime} WIB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.seats')}:</span>
                      <span className="font-medium">{paymentData.seatNumbers.join(', ')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-gray-800 font-semibold">{t('booking.totalPayment')}:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {new Intl.NumberFormat(t('common.locale'), { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentData.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-yellow-800 mb-1">{t('booking.important')}!</p>
                      <p className="text-sm text-yellow-700">{t('booking.paymentReminder')}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Transfer Info */}
                <div className="border-2 border-gray-200 rounded-lg p-5 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    {t('booking.bankTransferInfo')}
                  </h3>
                  <div className="space-y-4">
                    {/* BCA */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">BCA</span>
                        </div>
                        <span className="font-semibold text-gray-800">Bank Central Asia</span>
                      </div>
                      <div className="ml-15 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{t('booking.accountNumber')}:</span>
                          <span className="font-mono font-bold text-gray-800">1234567890</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{t('booking.accountName')}:</span>
                          <span className="font-medium text-gray-800">PT Travel Nusantara</span>
                        </div>
                      </div>
                    </div>

                    {/* Mandiri */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <div className="w-12 h-8 bg-yellow-500 rounded flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-xs">MANDIRI</span>
                        </div>
                        <span className="font-semibold text-gray-800">Bank Mandiri</span>
                      </div>
                      <div className="ml-15 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{t('booking.accountNumber')}:</span>
                          <span className="font-mono font-bold text-gray-800">9876543210</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{t('booking.accountName')}:</span>
                          <span className="font-medium text-gray-800">PT Travel Nusantara</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Payment */}
                <div className="border-2 border-gray-200 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    {t('booking.qrisPayment')}
                  </h3>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">{t('booking.qrisScan')}</p>
                    <div className="inline-block bg-white p-4 rounded-lg border-2 border-gray-300">
                      {/* Dummy QR Code - Using placeholder */}
                      <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                        <div className="text-center">
                          <svg className="w-16 h-16 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <p className="text-xs text-gray-500">QR Code QRIS</p>
                          <p className="text-xs text-gray-400 mt-1">Dummy Image</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      {t('booking.amount')}: <span className="font-bold">
                        {new Intl.NumberFormat(t('common.locale'), { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paymentData.totalAmount)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                  <p>{t('booking.confirmationInfo')}</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    WhatsApp: 0812-3456-7890 {t('common.or')} Email: payment@travelnusantara.com
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleClosePaymentInfo}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default BookingTiket;
