const express = require('express');
const router = express.Router();
const scheduleTemplateController = require('../controllers/scheduleTemplate.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Generate schedules from templates
router.post('/generate', roleMiddleware('ADMIN', 'OPERATOR'), scheduleTemplateController.generateSchedules);

// Get all templates
router.get('/', scheduleTemplateController.getTemplates);

// Get template by ID
router.get('/:id', scheduleTemplateController.getTemplateById);

// Create, Update, Delete - only Admin and Operator
router.post('/', roleMiddleware('ADMIN', 'OPERATOR'), scheduleTemplateController.createTemplate);
router.put('/:id', roleMiddleware('ADMIN', 'OPERATOR'), scheduleTemplateController.updateTemplate);
router.delete('/:id', roleMiddleware('ADMIN', 'OPERATOR'), scheduleTemplateController.deleteTemplate);

module.exports = router;
