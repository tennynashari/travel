const express = require('express');
const router = express.Router();
const seatTemplateController = require('../controllers/seatTemplate.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorizeAdmin);

// Get all seat templates
router.get('/', seatTemplateController.getSeatTemplates);

// Get seat template by ID
router.get('/:id', seatTemplateController.getSeatTemplateById);

// Create new seat template
router.post('/', seatTemplateController.createSeatTemplate);

// Update seat template
router.put('/:id', seatTemplateController.updateSeatTemplate);

// Delete seat template
router.delete('/:id', seatTemplateController.deleteSeatTemplate);

module.exports = router;
