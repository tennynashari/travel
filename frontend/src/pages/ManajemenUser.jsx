import { useState, useEffect } from 'react';
import api from '../services/api';

function ManajemenUser() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'CUSTOMER'
  });
  const [filterRole, setFilterRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filterRole, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole) params.role = filterRole;
      if (searchQuery) params.search = searchQuery;
      
      const response = await api.get('/users', { params });
      setUsers(response.data.data);
    } catch (err) {
      setError('Gagal mengambil data user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil statistik:', err);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditMode(true);
      setCurrentUser({
        id: user.id,
        email: user.email,
        password: '',
        name: user.name,
        phone: user.phone || '',
        role: user.role
      });
    } else {
      setEditMode(false);
      setCurrentUser({
        id: '',
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'CUSTOMER'
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentUser({
      id: '',
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'CUSTOMER'
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        email: currentUser.email,
        name: currentUser.name,
        phone: currentUser.phone,
        role: currentUser.role
      };

      // Only include password if it's provided
      if (currentUser.password) {
        payload.password = currentUser.password;
      }

      if (editMode) {
        await api.put(`/users/${currentUser.id}`, payload);
        setSuccess('User berhasil diupdate');
      } else {
        // Password is required for new user
        if (!currentUser.password) {
          setError('Password wajib diisi untuk user baru');
          return;
        }
        await api.post('/users', { ...payload, password: currentUser.password });
        setSuccess('User berhasil ditambahkan');
      }
      
      fetchUsers();
      fetchStats();
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`)) {
      try {
        await api.delete(`/users/${id}`);
        setSuccess('User berhasil dihapus');
        fetchUsers();
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal menghapus user');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: 'bg-purple-100 text-purple-800',
      OPERATOR: 'bg-green-100 text-green-800',
      DRIVER: 'bg-yellow-100 text-yellow-800',
      CUSTOMER: 'bg-blue-100 text-blue-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: 'Admin',
      OPERATOR: 'Operator',
      DRIVER: 'Driver',
      CUSTOMER: 'Customer'
    };
    return labels[role] || role;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
            <p className="text-gray-600 mt-1">Kelola akun pengguna sistem</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="mt-3 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah User
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Total User</div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
            </div>
            <div className="bg-purple-50 rounded-lg shadow-md p-4">
              <div className="text-sm text-purple-600">Admin</div>
              <div className="text-2xl font-bold text-purple-800">{stats.byRole.ADMIN || 0}</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow-md p-4">
              <div className="text-sm text-green-600">Operator</div>
              <div className="text-2xl font-bold text-green-800">{stats.byRole.OPERATOR || 0}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-md p-4">
              <div className="text-sm text-yellow-600">Driver</div>
              <div className="text-2xl font-bold text-yellow-800">{stats.byRole.DRIVER || 0}</div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-md p-4">
              <div className="text-sm text-blue-600">Customer</div>
              <div className="text-2xl font-bold text-blue-800">{stats.byRole.CUSTOMER || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Semua Role</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="DRIVER">Driver</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari User
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
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
                    Nama / Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telepon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Terdaftar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {searchQuery || filterRole ? 'Tidak ada user yang sesuai filter' : 'Belum ada data user'}
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-800">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          {user.driver && (
                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded">
                              Driver Aktif
                            </span>
                          )}
                          {user._count.bookings > 0 && (
                            <span className="inline-block px-2 py-1 bg-gray-50 text-gray-700 rounded ml-1">
                              {user._count.bookings} Booking
                            </span>
                          )}
                          {!user.driver && user._count.bookings === 0 && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editMode ? 'Edit User' : 'Tambah User'}
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
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={currentUser.name}
                    onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={currentUser.email}
                    onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {editMode && '(kosongkan jika tidak ingin mengubah)'}
                    {!editMode && ' *'}
                  </label>
                  <input
                    type="password"
                    value={currentUser.password}
                    onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                    required={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Minimal 6 karakter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    value={currentUser.phone}
                    onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="08123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={currentUser.role}
                    onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="OPERATOR">Operator</option>
                    <option value="DRIVER">Driver</option>
                    <option value="CUSTOMER">Customer</option>
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

export default ManajemenUser;
