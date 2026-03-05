import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Pagination from '../components/Pagination';

function MasterArmada() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState({
    id: '',
    plateNumber: '',
    vehicleType: '',
    capacity: '',
    status: 'ACTIVE'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehicles');
      setVehicles(response.data.data);
    } catch (err) {
      setError(t('masterVehicle.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vehicle = null) => {
    if (vehicle) {
      setEditMode(true);
      setCurrentVehicle(vehicle);
    } else {
      setEditMode(false);
      setCurrentVehicle({
        id: '',
        plateNumber: '',
        vehicleType: '',
        capacity: '',
        status: 'ACTIVE'
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentVehicle({
      id: '',
      plateNumber: '',
      vehicleType: '',
      capacity: '',
      status: 'ACTIVE'
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editMode) {
        await api.put(`/vehicles/${currentVehicle.id}`, currentVehicle);
        setSuccess(t('masterVehicle.updateSuccess'));
      } else {
        await api.post('/vehicles', currentVehicle);
        setSuccess(t('masterVehicle.addSuccess'));
      }
      
      fetchVehicles();
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('masterVehicle.saveError'));
    }
  };

  const handleDelete = async (id, plateNumber) => {
    if (window.confirm(t('masterVehicle.deleteConfirm', { plate: plateNumber }))) {
      try {
        await api.delete(`/vehicles/${id}`);
        setSuccess(t('masterVehicle.deleteSuccess'));
        fetchVehicles();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || t('masterVehicle.saveError'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    return t(`masterVehicle.status.${status}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('masterVehicle.title')}</h1>
          <p className="text-gray-600 mt-1">{t('masterVehicle.subtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('masterVehicle.addVehicle')}
        </button>
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
                    {t('masterVehicle.number')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('masterVehicle.plateNumber')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('masterVehicle.vehicleType')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('masterVehicle.capacity')}
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
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  vehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((vehicle, index) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">🚐</span>
                          <span className="text-sm font-medium text-gray-800">{vehicle.plateNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vehicle.vehicleType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vehicle.capacity} kursi</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(vehicle.status)}`}>
                          {getStatusLabel(vehicle.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(vehicle)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id, vehicle.plateNumber)}
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
        {!loading && vehicles.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={vehicles.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editMode ? t('masterVehicle.editVehicle') : t('masterVehicle.addVehicle')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('masterVehicle.plateNumber')} *
                  </label>
                  <input
                    type="text"
                    value={currentVehicle.plateNumber}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, plateNumber: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase"
                    placeholder={t('masterVehicle.enterPlate')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('masterVehicle.vehicleType')} *
                  </label>
                  <select
                    value={currentVehicle.vehicleType}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, vehicleType: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('masterVehicle.vehicleType')}</option>
                    <option value="Hiace">Hiace</option>
                    <option value="Elf">Elf</option>
                    <option value="Avanza">Avanza</option>
                    <option value="Innova">Innova</option>
                    <option value="Bus Mini">Bus Mini</option>
                    <option value="Bus Besar">Bus Besar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('masterVehicle.capacity')} *
                  </label>
                  <input
                    type="number"
                    value={currentVehicle.capacity}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, capacity: e.target.value })}
                    required
                    min="1"
                    max="60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={t('masterVehicle.enterCapacity')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.status')} *
                  </label>
                  <select
                    value={currentVehicle.status}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, status: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="ACTIVE">{t('masterVehicle.status.ACTIVE')}</option>
                    <option value="MAINTENANCE">{t('masterVehicle.status.MAINTENANCE')}</option>
                    <option value="INACTIVE">{t('masterVehicle.status.INACTIVE')}</option>
                  </select>
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

export default MasterArmada;
