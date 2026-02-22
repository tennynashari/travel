const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all schedules (all authenticated users can view)
router.get('/', scheduleController.getSchedules);

// Get schedule by ID (all authenticated users can view)
router.get('/:id', scheduleController.getScheduleById);

// Get dropdown data (all authenticated users can view)
router.get('/dropdown/routes', scheduleController.getAvailableRoutes);
router.get('/dropdown/vehicles', scheduleController.getAvailableVehicles);
router.get('/dropdown/drivers', scheduleController.getAvailableDrivers);

// Create schedule (only ADMIN and OPERATOR)
router.post('/', roleMiddleware(['ADMIN', 'OPERATOR']), scheduleController.createSchedule);

// Update schedule (only ADMIN and OPERATOR)
router.put('/:id', roleMiddleware(['ADMIN', 'OPERATOR']), scheduleController.updateSchedule);

// Delete schedule (only ADMIN and OPERATOR)
router.delete('/:id', roleMiddleware(['ADMIN', 'OPERATOR']), scheduleController.deleteSchedule);

module.exports = router;
