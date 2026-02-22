const express = require('express');
const router = express.Router();
const cityController = require('../controllers/city.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all cities (accessible by all authenticated users)
router.get('/', cityController.getCities);

// Get city by ID
router.get('/:id', cityController.getCityById);

// Create, Update, Delete - only Admin and Operator
router.post('/', roleMiddleware('ADMIN', 'OPERATOR'), cityController.createCity);
router.put('/:id', roleMiddleware('ADMIN', 'OPERATOR'), cityController.updateCity);
router.delete('/:id', roleMiddleware('ADMIN', 'OPERATOR'), cityController.deleteCity);

module.exports = router;
