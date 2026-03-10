const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Fetch training data from database
const fetchTrainingData = async (req, res) => {
  try {
    // Fetch bookings from last 6 months with related data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        },
        status: 'PAID'
      },
      include: {
        schedule: {
          include: {
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Process data for ML service
    const processedBookings = bookings.map(booking => ({
      id: booking.id,
      created_at: booking.createdAt.toISOString(),
      total_passengers: booking.totalSeats,
      total_price: booking.totalPrice,
      status: booking.status,
      route_key: `${booking.schedule.route.originCity.name} → ${booking.schedule.route.destinationCity.name}`
    }));

    // Get routes info
    const routes = await prisma.route.findMany({
      include: {
        originCity: true,
        destinationCity: true
      }
    });

    const processedRoutes = routes.map(route => ({
      id: route.id,
      origin: route.originCity.name,
      destination: route.destinationCity.name,
      distance: route.distance,
      base_price: route.basePrice
    }));

    res.json({
      success: true,
      data: {
        bookings: processedBookings,
        routes: processedRoutes
      },
      stats: {
        total_bookings: processedBookings.length,
        date_range: {
          start: sixMonthsAgo.toISOString(),
          end: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching training data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training data',
      error: error.message
    });
  }
};

// Train ML models
const trainModels = async (req, res) => {
  try {
    // Fetch data from database
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        },
        status: 'PAID'
      },
      include: {
        schedule: {
          include: {
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (bookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Not enough data for training. Need at least 30 days of booking history.'
      });
    }

    // Process data
    const processedBookings = bookings.map(booking => ({
      created_at: booking.createdAt.toISOString(),
      total_passengers: booking.totalSeats,
      total_price: booking.totalPrice,
      status: booking.status,
      route_key: `${booking.schedule.route.originCity.name} → ${booking.schedule.route.destinationCity.name}`
    }));

    // Call ML service to train
    const response = await axios.post(`${ML_SERVICE_URL}/train`, {
      bookings: processedBookings
    });

    res.json({
      success: true,
      message: 'Models trained successfully',
      data: response.data
    });

  } catch (error) {
    console.error('Error training models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to train models',
      error: error.response?.data?.error || error.message
    });
  }
};

// Get predictions
const getPredictions = async (req, res) => {
  try {
    // Fetch recent bookings for context
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: ninetyDaysAgo
        },
        status: 'PAID'
      },
      include: {
        schedule: {
          include: {
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (bookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Not enough data for prediction'
      });
    }

    // Process data
    const processedBookings = bookings.map(booking => ({
      created_at: booking.createdAt.toISOString(),
      total_passengers: booking.totalSeats,
      total_price: booking.totalPrice,
      status: booking.status,
      route_key: `${booking.schedule.route.originCity.name} → ${booking.schedule.route.destinationCity.name}`
    }));

    // Get routes
    const routes = await prisma.route.findMany({
      include: {
        originCity: true,
        destinationCity: true
      }
    });

    const processedRoutes = routes.map(route => ({
      id: route.id,
      origin: route.originCity.name,
      destination: route.destinationCity.name
    }));

    // Call ML service for predictions
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      bookings: processedBookings,
      routes: processedRoutes
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get predictions',
      error: error.response?.data?.error || error.message
    });
  }
};

// Get model status
const getModelStatus = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/model-info`);
    
    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error getting model status:', error);
    res.status(500).json({
      success: false,
      message: 'ML service unavailable',
      error: error.message
    });
  }
};

// Health check for ML service
const healthCheck = async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`);
    
    res.json({
      success: true,
      ml_service: response.data
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML service is not available',
      error: error.message
    });
  }
};

module.exports = {
  fetchTrainingData,
  trainModels,
  getPredictions,
  getModelStatus,
  healthCheck
};
