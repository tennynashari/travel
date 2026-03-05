import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Pagination from '../components/Pagination';

function JadwalPerjalanan() {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState({
    id: '',
    routeId: '',
    vehicleId: '',
    driverId: '',
    departureDate: '',
    departureTime: '',
    ticketPrice: ''
  });
  const [filterDate, setFilterDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchSchedules();
  }, [filterDate]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = filterDate ? { date: filterDate } : {};
      const response = await api.get('/schedules', { params });
      setSchedules(response.data.data);
    } catch (err) {
      setError(t('schedule.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [routesRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/schedules/dropdown/routes'),
        api.get('/schedules/dropdown/vehicles'),
        api.get('/schedules/dropdown/drivers')
      ]);
      
      setRoutes(routesRes.data.data);
      setVehicles(vehiclesRes.data.data);
      setDrivers(driversRes.data.data);
    } catch (err) {
      console.error('Gagal mengambil data dropdown:', err);
    }
  };

  const handleOpenModal = async (schedule = null) => {
    await fetchDropdownData();
    
    if (schedule) {
      setEditMode(true);
      const departureDate = new Date(schedule.departureDate);
      const formattedDate = departureDate.toISOString().split('T')[0];
      
      setCurrentSchedule({
        id: schedule.id,
        routeId: schedule.routeId,
        vehicleId: schedule.vehicleId,
        driverId: schedule.driverId,
        departureDate: formattedDate,
        departureTime: schedule.departureTime,
        ticketPrice: schedule.ticketPrice
      });
    } else {
      setEditMode(false);
      setCurrentSchedule({
        id: '',
        routeId: '',
        vehicleId: '',
        driverId: '',
        departureDate: '',
        departureTime: '',
        ticketPrice: ''
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentSchedule({
      id: '',
      routeId: '',
      vehicleId: '',
      driverId: '',
      departureDate: '',
      departureTime: '',
      ticketPrice: ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editMode) {
        await api.put(`/schedules/${currentSchedule.id}`, {
          routeId: currentSchedule.routeId,
          vehicleId: currentSchedule.vehicleId,
          driverId: currentSchedule.driverId,
          departureDate: currentSchedule.departureDate,
          departureTime: currentSchedule.departureTime,
          ticketPrice: currentSchedule.ticketPrice
        });
        setSuccess(t('schedule.updateSuccess'));
      } else {
        await api.post('/schedules', currentSchedule);
        setSuccess(t('schedule.addSuccess'));
      }
      
      fetchSchedules();
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('schedule.saveError'));
    }
  };

  const handleDelete = async (id, route) => {
    if (window.confirm(t('schedule.deleteConfirm', { route }))) {
      try {
        await api.delete(`/schedules/${id}`);
        setSuccess(t('schedule.deleteSuccess'));
        fetchSchedules();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || t('schedule.saveError'));
        setTimeout(() => setError(''), 3000);
      }
    }
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

  const formatTime = (timeString) => {
    return timeString;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSeatsStatus = (availableSeats, capacity) => {
    const percentage = (availableSeats / capacity) * 100;
    if (percentage > 50) return 'text-green-600 bg-green-50';
    if (percentage > 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('schedule.title')}</h1>
          <p className="text-gray-600 mt-1">{t('schedule.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('schedule.addSchedule')}
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

      {/* Table */}
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
                    {t('schedule.number')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard.route')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('schedule.dateTime')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('schedule.vehicle')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('schedule.driver')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('schedule.price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('schedule.availableSeats')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      {filterDate ? t('schedule.noScheduleOnDate') : t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  schedules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((schedule, index) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">
                          {schedule.route.originCity.name} → {schedule.route.destinationCity.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {schedule.route.originCity.province} - {schedule.route.destinationCity.province}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">
                          {formatDate(schedule.departureDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(schedule.departureTime)} WIB
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{schedule.vehicle.vehicleType}</div>
                        <div className="text-xs text-gray-500">{schedule.vehicle.plateNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{schedule.driver.user.name}</div>
                        <div className="text-xs text-gray-500">{schedule.driver.licenseNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {formatCurrency(schedule.ticketPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getSeatsStatus(schedule.availableSeats, schedule.vehicle.capacity)}`}>
                          {schedule.availableSeats} / {schedule.vehicle.capacity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(schedule)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id, `${schedule.route.originCity.name} - ${schedule.route.destinationCity.name}`)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && schedules.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={schedules.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                {editMode ? t('schedule.editSchedule') : t('schedule.addSchedule')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.route')} *
                  </label>
                  <select
                    value={currentSchedule.routeId}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, routeId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('schedule.selectRoute')}</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.originCity.name} → {route.destinationCity.name} ({route.distance} km)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.vehicle')} *
                  </label>
                  <select
                    value={currentSchedule.vehicleId}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, vehicleId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('schedule.selectVehicle')}</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleType} - {vehicle.plateNumber} ({vehicle.capacity} {t('schedule.seats')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.driver')} *
                  </label>
                  <select
                    value={currentSchedule.driverId}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, driverId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('schedule.selectDriver')}</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.user.name} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.departureDate')} *
                  </label>
                  <input
                    type="date"
                    value={currentSchedule.departureDate}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, departureDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.departureTime')} *
                  </label>
                  <input
                    type="time"
                    value={currentSchedule.departureTime}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, departureTime: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.ticketPrice')} (Rp) *
                  </label>
                  <input
                    type="number"
                    value={currentSchedule.ticketPrice}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, ticketPrice: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Contoh: 150000"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editMode ? t('common.edit') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JadwalPerjalanan;
