const express = require('express');
const router = express.Router();
const seatTemplateController = require('../controllers/seatTemplate.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all seat templates
router.get('/', seatTemplateController.getSeatTemplates);

// Get seat template by ID
router.get('/:id', seatTemplateController.getSeatTemplateById);

// Create, Update, Delete - only Admin and Operator
router.post('/', roleMiddleware('ADMIN', 'OPERATOR'), seatTemplateController.createSeatTemplate);
router.put('/:id', roleMiddleware('ADMIN', 'OPERATOR'), seatTemplateController.updateSeatTemplate);
router.delete('/:id', roleMiddleware('ADMIN', 'OPERATOR'), seatTemplateController.deleteSeatTemplate);

module.exports = router;
