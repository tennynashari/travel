import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';

function MasterRute() {
  const [routes, setRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRoute, setCurrentRoute] = useState({
    id: '',
    originCityId: '',
    destinationCityId: '',
    distance: '',
    estimatedTime: '',
    basePrice: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchRoutes();
    fetchCities();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/routes');
      setRoutes(response.data.data);
    } catch (err) {
      setError('Gagal mengambil data rute');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil data kota:', err);
    }
  };

  const handleOpenModal = (route = null) => {
    if (route) {
      setEditMode(true);
      setCurrentRoute({
        id: route.id,
        originCityId: route.originCityId,
        destinationCityId: route.destinationCityId,
        distance: route.distance,
        estimatedTime: route.estimatedTime,
        basePrice: route.basePrice
      });
    } else {
      setEditMode(false);
      setCurrentRoute({
        id: '',
        originCityId: '',
        destinationCityId: '',
        distance: '',
        estimatedTime: '',
        basePrice: ''
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentRoute({
      id: '',
      originCityId: '',
      destinationCityId: '',
      distance: '',
      estimatedTime: '',
      basePrice: ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editMode) {
        await api.put(`/routes/${currentRoute.id}`, currentRoute);
        setSuccess('Rute berhasil diupdate');
      } else {
        await api.post('/routes', currentRoute);
        setSuccess('Rute berhasil ditambahkan');
      }
      
      fetchRoutes();
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id, routeName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus rute "${routeName}"?`)) {
      try {
        await api.delete(`/routes/${id}`);
        setSuccess('Rute berhasil dihapus');
        fetchRoutes();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal menghapus rute');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}j ${mins}m`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Master Rute</h1>
          <p className="text-gray-600 mt-1">Kelola rute perjalanan antar kota</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Rute
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
            <p className="text-gray-600 mt-2">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rute
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jarak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Waktu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga Dasar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Belum ada data rute
                    </td>
                  </tr>
                ) : (
                  routes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((route, index) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-800">{route.originCity.name}</span>
                          <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="font-medium text-gray-800">{route.destinationCity.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {route.originCity.province} → {route.destinationCity.province}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{route.distance} km</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatTime(route.estimatedTime)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {formatRupiah(route.basePrice)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(route)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(route.id, `${route.originCity.name} - ${route.destinationCity.name}`)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Hapus
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
        {!loading && routes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={routes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editMode ? 'Edit Rute' : 'Tambah Rute'}
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
                    Kota Asal *
                  </label>
                  <select
                    value={currentRoute.originCityId}
                    onChange={(e) => setCurrentRoute({ ...currentRoute, originCityId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Pilih Kota Asal</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name} ({city.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kota Tujuan *
                  </label>
                  <select
                    value={currentRoute.destinationCityId}
                    onChange={(e) => setCurrentRoute({ ...currentRoute, destinationCityId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Pilih Kota Tujuan</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name} ({city.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jarak (km) *
                  </label>
                  <input
                    type="number"
                    value={currentRoute.distance}
                    onChange={(e) => setCurrentRoute({ ...currentRoute, distance: e.target.value })}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Contoh: 150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimasi Waktu (menit) *
                  </label>
                  <input
                    type="number"
                    value={currentRoute.estimatedTime}
                    onChange={(e) => setCurrentRoute({ ...currentRoute, estimatedTime: e.target.value })}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Contoh: 180 (3 jam)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Dasar (Rp) *
                  </label>
                  <input
                    type="number"
                    value={currentRoute.basePrice}
                    onChange={(e) => setCurrentRoute({ ...currentRoute, basePrice: e.target.value })}
                    required
                    min="1000"
                    step="1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Contoh: 100000"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editMode ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterRute;
