const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all drivers
router.get('/', driverController.getDrivers);

// Get users with DRIVER role (for dropdown)
router.get('/users/available', roleMiddleware('ADMIN', 'OPERATOR'), driverController.getDriverUsers);

// Get driver by ID
router.get('/:id', driverController.getDriverById);

// Create, Update, Delete - only Admin and Operator
router.post('/', roleMiddleware('ADMIN', 'OPERATOR'), driverController.createDriver);
router.put('/:id', roleMiddleware('ADMIN', 'OPERATOR'), driverController.updateDriver);
router.delete('/:id', roleMiddleware('ADMIN', 'OPERATOR'), driverController.deleteDriver);

module.exports = router;
