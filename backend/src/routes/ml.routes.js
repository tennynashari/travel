const express = require('express');
const router = express.Router();
const mlController = require('../controllers/ml.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All ML routes require authentication
router.use(authenticateToken);

// Health check
router.get('/health', mlController.healthCheck);

// Fetch training data
router.get('/data', mlController.fetchTrainingData);

// Train models
router.post('/train', mlController.trainModels);

// Get predictions
router.post('/predict', mlController.getPredictions);

// Get model status
router.get('/model-status', mlController.getModelStatus);

module.exports = router;
