const express = require('express');
const router = express.Router();
const {
  getSchedulesForCheckIn,
  getScheduleBookings,
  checkInBooking,
  undoCheckIn,
  bulkCheckIn,
  getCheckInStats
} = require('../controllers/checkin.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get schedules with booking counts for check-in
// Accessible by: ADMIN, OPERATOR, DRIVER
router.get(
  '/schedules',
  roleMiddleware(['ADMIN', 'OPERATOR', 'DRIVER']),
  getSchedulesForCheckIn
);

// Get all bookings for a specific schedule
// Accessible by: ADMIN, OPERATOR, DRIVER
router.get(
  '/schedules/:scheduleId/bookings',
  roleMiddleware(['ADMIN', 'OPERATOR', 'DRIVER']),
  getScheduleBookings
);

// Get check-in statistics for a schedule
// Accessible by: ADMIN, OPERATOR, DRIVER
router.get(
  '/schedules/:scheduleId/stats',
  roleMiddleware(['ADMIN', 'OPERATOR', 'DRIVER']),
  getCheckInStats
);

// Check-in a single booking
// Accessible by: ADMIN, OPERATOR, DRIVER
router.post(
  '/bookings/:id/checkin',
  roleMiddleware(['ADMIN', 'OPERATOR', 'DRIVER']),
  checkInBooking
);

// Undo check-in (for corrections)
// Accessible by: ADMIN, OPERATOR
router.post(
  '/bookings/:id/undo',
  roleMiddleware(['ADMIN', 'OPERATOR']),
  undoCheckIn
);

// Bulk check-in all bookings in a schedule
// Accessible by: ADMIN, OPERATOR
router.post(
  '/schedules/:scheduleId/bulk-checkin',
  roleMiddleware(['ADMIN', 'OPERATOR']),
  bulkCheckIn
);

module.exports = router;
