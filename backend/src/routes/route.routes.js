const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all routes (accessible by all authenticated users)
router.get('/', routeController.getRoutes);

// Get route by ID
router.get('/:id', routeController.getRouteById);

// Create, Update, Delete - only Admin and Operator
router.post('/', roleMiddleware('ADMIN', 'OPERATOR'), routeController.createRoute);
router.put('/:id', roleMiddleware('ADMIN', 'OPERATOR'), routeController.updateRoute);
router.delete('/:id', roleMiddleware('ADMIN', 'OPERATOR'), routeController.deleteRoute);

module.exports = router;
