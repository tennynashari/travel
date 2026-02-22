const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all vehicles
router.get('/', vehicleController.getVehicles);

// Get vehicle by ID
router.get('/:id', vehicleController.getVehicleById);

// Create, Update, Delete - only Admin and Operator
router.post('/', roleMiddleware('ADMIN', 'OPERATOR'), vehicleController.createVehicle);
router.put('/:id', roleMiddleware('ADMIN', 'OPERATOR'), vehicleController.updateVehicle);
router.delete('/:id', roleMiddleware('ADMIN', 'OPERATOR'), vehicleController.deleteVehicle);

module.exports = router;
