const express = require('express');
const router = express.Router();
const {
  getOverview,
  getSalesReport,
  getRouteRevenue,
  getVehicleUtilization,
  getDriverPerformance,
  getTopCustomers,
  exportReport
} = require('../controllers/laporan.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication and only accessible by ADMIN or OPERATOR
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN', 'OPERATOR']));

// Overview - Summary semua data
router.get('/overview', getOverview);

// Laporan Penjualan/Booking
router.get('/sales', getSalesReport);

// Laporan Pendapatan per Rute
router.get('/route-revenue', getRouteRevenue);

// Laporan Utilisasi Armada
router.get('/vehicle-utilization', getVehicleUtilization);

// Laporan Kinerja Driver
router.get('/driver-performance', getDriverPerformance);

// Laporan Top Customers
router.get('/top-customers', getTopCustomers);

// Export Report (JSON/CSV)
router.get('/export', exportReport);

module.exports = router;
