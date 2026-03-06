import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MasterKota from './MasterKota';
import MasterRute from './MasterRute';
import MasterTemplateKursi from './MasterTemplateKursi';
import MasterArmada from './MasterArmada';
import MasterDriver from './MasterDriver';
import JadwalPerjalanan from './JadwalPerjalanan';
import ManajemenUser from './ManajemenUser';
import BookingTiket from './BookingTiket';
import Pembayaran from './Pembayaran';
import CheckIn from './CheckIn';
import Laporan from './Laporan';

function Dashboard({ user, page = 'dashboard' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(page);
  const [expandedMenus, setExpandedMenus] = useState(['masterdata']);

  useEffect(() => {
    if (!currentUser) {
      const storedUser = authService.getCurrentUser();
      setCurrentUser(storedUser);
    }
  }, [currentUser]);

  useEffect(() => {
    setActiveMenu(page);
  }, [page]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    setSidebarOpen(false);
    
    // Navigate to different routes
    switch(menuId) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'kota':
        navigate('/master-kota');
        break;
      case 'rute':
        navigate('/master-rute');
        break;
      case 'template-kursi':
        navigate('/master-template-kursi');
        break;
      case 'armada':
        navigate('/master-armada');
        break;
      case 'driver':
        navigate('/master-driver');
        break;
      case 'jadwal':
        navigate('/jadwal-perjalanan');
        break;
      case 'booking':
        navigate('/booking-tiket');
        break;
      case 'pembayaran':
        navigate('/pembayaran');
        break;
      case 'checkin':
        navigate('/check-in');
        break;
      case 'laporan':
        navigate('/laporan');
        break;
      case 'users':
        navigate('/manajemen-user');
        break;
      default:
        // Handle other menus (not implemented yet)
        break;
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      OPERATOR: 'bg-green-100 text-green-800',
      DRIVER: 'bg-yellow-100 text-yellow-800',
      CUSTOMER: 'bg-blue-100 text-blue-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const getMenuItems = () => {
    const allMenus = [
      { id: 'dashboard', label: t('sidebar.dashboard'), icon: '📊', roles: ['ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER'] },
      { 
        id: 'masterdata', 
        label: t('sidebar.masterData'), 
        icon: '📁', 
        roles: ['ADMIN', 'OPERATOR'],
        submenus: [
          { id: 'kota', label: t('sidebar.masterCity'), icon: '🏙️', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'rute', label: t('sidebar.masterRoute'), icon: '🗺️', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'driver', label: t('sidebar.masterDriver'), icon: '👨‍✈️', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'template-kursi', label: 'Master Template Kursi', icon: '🪑', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'armada', label: t('sidebar.masterVehicle'), icon: '🚐', roles: ['ADMIN', 'OPERATOR'] },
        ]
      },
      { id: 'jadwal', label: t('sidebar.travelSchedule'), icon: '📅', roles: ['ADMIN', 'OPERATOR', 'DRIVER'] },
      { id: 'booking', label: t('sidebar.bookingTicket'), icon: '🎫', roles: ['ADMIN', 'OPERATOR', 'CUSTOMER'] },
      { id: 'pembayaran', label: t('sidebar.payment'), icon: '💳', roles: ['ADMIN', 'OPERATOR'] },
      { id: 'checkin', label: t('sidebar.checkIn'), icon: '✅', roles: ['ADMIN', 'OPERATOR', 'DRIVER'] },
      { id: 'laporan', label: t('sidebar.reports'), icon: '📈', roles: ['ADMIN', 'OPERATOR'] },
      { id: 'users', label: t('sidebar.userManagement'), icon: '👥', roles: ['ADMIN'] },
    ];

    return allMenus.filter(menu => menu.roles.includes(currentUser?.role));
  };

  const stats = [
    { labelKey: 'dashboard.statistics.totalTrips', value: '12', icon: '🚐', color: 'bg-blue-50 text-blue-600' },
    { labelKey: 'dashboard.statistics.bookingsToday', value: '8', icon: '🎫', color: 'bg-green-50 text-green-600' },
    { labelKey: 'dashboard.statistics.activeVehicles', value: '5', icon: '🚗', color: 'bg-purple-50 text-purple-600' },
    { labelKey: 'dashboard.statistics.totalRevenue', value: 'Rp 2.4M', icon: '💰', color: 'bg-yellow-50 text-yellow-600' }
  ];

  const recentBookings = [
    { code: 'BK-001', route: 'Jakarta - Bandung', customer: 'John Doe', status: 'PAID' },
    { code: 'BK-002', route: 'Bandung - Yogyakarta', customer: 'Jane Smith', status: 'CONFIRMED' },
    { code: 'BK-003', route: 'Jakarta - Surabaya', customer: 'Bob Wilson', status: 'PENDING' }
  ];

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-blue-500">
            <div className="flex items-center">
              <div className="bg-white text-blue-600 rounded-lg p-2 mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold">Travel App</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-blue-500">
            <p className="text-sm text-blue-200">Logged in as</p>
            <p className="text-base font-semibold mt-1">{currentUser?.name}</p>
            <span className={`inline-block px-2 py-1 mt-2 text-xs font-semibold rounded ${getRoleBadgeColor(currentUser?.role)}`}>
              {currentUser?.role}
            </span>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((menu) => (
                <li key={menu.id}>
                  {menu.submenus ? (
                    // Parent menu with submenus
                    <div>
                      <button
                        onClick={() => toggleMenu(menu.id)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-blue-100 hover:bg-blue-700 hover:text-white"
                      >
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{menu.icon}</span>
                          <span className="font-medium">{menu.label}</span>
                        </div>
                        <svg 
                          className={`w-4 h-4 transition-transform ${
                            expandedMenus.includes(menu.id) ? 'rotate-180' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {/* Submenus */}
                      {expandedMenus.includes(menu.id) && (
                        <ul className="mt-2 ml-4 space-y-1">
                          {menu.submenus.map((submenu) => (
                            <li key={submenu.id}>
                              <button
                                onClick={() => handleMenuClick(submenu.id)}
                                className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                                  activeMenu === submenu.id
                                    ? 'bg-white text-blue-600 shadow-md'
                                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                                }`}
                              >
                                <span className="text-lg mr-3">{submenu.icon}</span>
                                <span className="text-sm font-medium">{submenu.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    // Regular menu item
                    <button
                      onClick={() => handleMenuClick(menu.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                        activeMenu === menu.id
                          ? 'bg-white text-blue-600 shadow-md'
                          : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <span className="text-xl mr-3">{menu.icon}</span>
                      <span className="font-medium">{menu.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4 border-t border-blue-500">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('common.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="bg-white shadow-md sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <h1 className="text-xl font-bold text-gray-800 lg:hidden">Travel App</h1>
              
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <button className="relative text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Render different pages based on activeMenu */}
          {activeMenu === 'kota' && <MasterKota />}
          {activeMenu === 'rute' && <MasterRute />}
          {activeMenu === 'armada' && <MasterArmada />}
          {activeMenu === 'driver' && <MasterDriver />}
          {activeMenu === 'template-kursi' && <MasterTemplateKursi />}
          {activeMenu === 'jadwal' && <JadwalPerjalanan />}
          {activeMenu === 'booking' && <BookingTiket />}
          {activeMenu === 'pembayaran' && <Pembayaran />}
          {activeMenu === 'checkin' && <CheckIn />}
          {activeMenu === 'laporan' && <Laporan />}
          {activeMenu === 'users' && <ManajemenUser />}
          
          {/* Dashboard Home (default) */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {t('common.welcome')}, {currentUser?.name}! 👋
                </h1>
                <p className="text-gray-600">{t('dashboard.subtitle')}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`text-3xl ${stat.color} rounded-full w-12 h-12 flex items-center justify-center`}>
                        {stat.icon}
                      </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">{t(stat.labelKey)}</h3>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">{t('dashboard.recentBookings')}</h2>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    {t('dashboard.viewAll')} →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('dashboard.bookingCode')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('dashboard.route')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('dashboard.customer')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentBookings.map((booking, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-800">
                            {booking.code}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {booking.route}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {booking.customer}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                              booking.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Placeholder for other menus */}
          {!['dashboard', 'kota', 'rute', 'armada', 'driver', 'jadwal', 'booking', 'pembayaran', 'checkin', 'laporan', 'users'].includes(activeMenu) && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('dashboard.comingSoon')}</h2>
              <p className="text-gray-600">{t('dashboard.featureInDevelopment')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
