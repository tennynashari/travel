const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication and ADMIN/OPERATOR role
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN', 'OPERATOR']));

// Get payment statistics
router.get('/stats', paymentController.getPaymentStats);

// Get daily revenue report
router.get('/revenue/daily', paymentController.getDailyRevenue);

// Get payment methods list
router.get('/methods', paymentController.getPaymentMethods);

// Get all payments
router.get('/', paymentController.getPayments);

// Get payment by booking ID
router.get('/:id', paymentController.getPaymentById);

module.exports = router;
