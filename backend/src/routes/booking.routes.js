const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get available schedules for booking (all authenticated users)
router.get('/schedules/available', bookingController.getAvailableSchedules);

// Get available seats for a schedule (all authenticated users)
router.get('/schedules/:scheduleId/seats', bookingController.getAvailableSeats);

// Get all bookings (customers see their own, admin/operator see all)
router.get('/', bookingController.getBookings);

// Get booking by ID
router.get('/:id', bookingController.getBookingById);

// Create booking (all authenticated users can create)
router.post('/', bookingController.createBooking);

// Update booking status (only ADMIN and OPERATOR)
router.put('/:id', roleMiddleware(['ADMIN', 'OPERATOR']), bookingController.updateBooking);

// Cancel booking (all authenticated users can cancel their own)
router.delete('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
