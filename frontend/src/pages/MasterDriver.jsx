import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Pagination from '../components/Pagination';

function MasterDriver() {
  const { t } = useTranslation();
  const [drivers, setDrivers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDriver, setCurrentDriver] = useState({
    id: '',
    userId: '',
    licenseNumber: '',
    status: 'ACTIVE'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/drivers');
      setDrivers(response.data.data);
    } catch (err) {
      setError(t('masterDriver.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/drivers/users/available');
      setAvailableUsers(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil data user driver:', err);
    }
  };

  const handleOpenModal = async (driver = null) => {
    if (driver) {
      setEditMode(true);
      setCurrentDriver({
        id: driver.id,
        userId: driver.userId,
        licenseNumber: driver.licenseNumber,
        status: driver.status
      });
    } else {
      setEditMode(false);
      setCurrentDriver({
        id: '',
        userId: '',
        licenseNumber: '',
        status: 'ACTIVE'
      });
      await fetchAvailableUsers();
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentDriver({
      id: '',
      userId: '',
      licenseNumber: '',
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
        await api.put(`/drivers/${currentDriver.id}`, {
          licenseNumber: currentDriver.licenseNumber,
          status: currentDriver.status
        });
        setSuccess(t('masterDriver.updateSuccess'));
      } else {
        await api.post('/drivers', currentDriver);
        setSuccess(t('masterDriver.addSuccess'));
      }
      
      fetchDrivers();
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('masterDriver.saveError'));
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(t('masterDriver.deleteConfirm', { name }))) {
      try {
        await api.delete(`/drivers/${id}`);
        setSuccess(t('masterDriver.deleteSuccess'));
        fetchDrivers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || t('masterDriver.saveError'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800',
      OFF_DUTY: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    return t(`masterDriver.status.${status}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('masterDriver.title')}</h1>
          <p className="text-gray-600 mt-1">{t('masterDriver.subtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('masterDriver.addDriver')}
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
                    {t('masterDriver.number')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('masterDriver.driverName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email / {t('userManagement.table.phone')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('masterDriver.licenseNumber')}
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
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  drivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((driver, index) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">👨‍✈️</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-800">{driver.user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{driver.user.email}</div>
                        <div className="text-xs text-gray-500">{driver.user.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-800">{driver.licenseNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(driver.status)}`}>
                          {getStatusLabel(driver.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(driver)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(driver.id, driver.user.name)}
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
        {!loading && drivers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={drivers.length}
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
                {editMode ? t('masterDriver.editDriver') : t('masterDriver.addDriver')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {!editMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('masterDriver.selectUser')} *
                    </label>
                    <select
                      value={currentDriver.userId}
                      onChange={(e) => setCurrentDriver({ ...currentDriver, userId: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">{t('masterDriver.selectUser')}</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Hanya menampilkan user dengan role DRIVER yang belum terdaftar sebagai driver
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('masterDriver.licenseNumber')} *
                  </label>
                  <input
                    type="text"
                    value={currentDriver.licenseNumber}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, licenseNumber: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={t('masterDriver.enterLicense')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.status')} *
                  </label>
                  <select
                    value={currentDriver.status}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, status: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="ACTIVE">{t('masterDriver.status.ACTIVE')}</option>
                    <option value="OFF_DUTY">{t('masterDriver.status.OFF_DUTY')}</option>
                    <option value="INACTIVE">{t('masterDriver.status.INACTIVE')}</option>
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

export default MasterDriver;
