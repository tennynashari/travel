import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';

function MasterArmada() {
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
      setError('Gagal mengambil data armada');
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
        setSuccess('Armada berhasil diupdate');
      } else {
        await api.post('/vehicles', currentVehicle);
        setSuccess('Armada berhasil ditambahkan');
      }
      
      fetchVehicles();
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id, plateNumber) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus armada "${plateNumber}"?`)) {
      try {
        await api.delete(`/vehicles/${id}`);
        setSuccess('Armada berhasil dihapus');
        fetchVehicles();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal menghapus armada');
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
    const labels = {
      ACTIVE: 'Aktif',
      MAINTENANCE: 'Maintenance',
      INACTIVE: 'Tidak Aktif'
    };
    return labels[status] || status;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Master Armada</h1>
          <p className="text-gray-600 mt-1">Kelola kendaraan travel</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Armada
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
                    Nomor Polisi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe Kendaraan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kapasitas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Belum ada data armada
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
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id, vehicle.plateNumber)}
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
                {editMode ? 'Edit Armada' : 'Tambah Armada'}
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
                    Nomor Polisi *
                  </label>
                  <input
                    type="text"
                    value={currentVehicle.plateNumber}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, plateNumber: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase"
                    placeholder="Contoh: B-1234-XYZ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Kendaraan *
                  </label>
                  <select
                    value={currentVehicle.vehicleType}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, vehicleType: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Pilih Tipe</option>
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
                    Kapasitas Kursi *
                  </label>
                  <input
                    type="number"
                    value={currentVehicle.capacity}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, capacity: e.target.value })}
                    required
                    min="1"
                    max="60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Contoh: 14"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={currentVehicle.status}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, status: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="INACTIVE">Tidak Aktif</option>
                  </select>
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

export default MasterArmada;
