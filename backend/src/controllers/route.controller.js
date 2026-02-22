const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all routes
exports.getRoutes = async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        originCity: true,
        destinationCity: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      message: 'Routes retrieved successfully',
      data: routes
    });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ error: 'Failed to get routes' });
  }
};

// Get route by ID
exports.getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        originCity: true,
        destinationCity: true
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({
      message: 'Route retrieved successfully',
      data: route
    });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ error: 'Failed to get route' });
  }
};

// Create route
exports.createRoute = async (req, res) => {
  try {
    const { originCityId, destinationCityId, distance, estimatedTime, basePrice } = req.body;

    // Validation
    if (!originCityId || !destinationCityId || !distance || !estimatedTime || !basePrice) {
      return res.status(400).json({ 
        error: 'Origin city, destination city, distance, estimated time, and base price are required' 
      });
    }

    if (originCityId === destinationCityId) {
      return res.status(400).json({ error: 'Origin and destination cities must be different' });
    }

    // Check if cities exist
    const originCity = await prisma.city.findUnique({
      where: { id: originCityId }
    });

    const destinationCity = await prisma.city.findUnique({
      where: { id: destinationCityId }
    });

    if (!originCity || !destinationCity) {
      return res.status(404).json({ error: 'One or both cities not found' });
    }

    // Check if route already exists
    const existingRoute = await prisma.route.findFirst({
      where: {
        originCityId,
        destinationCityId
      }
    });

    if (existingRoute) {
      return res.status(400).json({ error: 'Route already exists' });
    }

    const route = await prisma.route.create({
      data: {
        originCityId,
        destinationCityId,
        distance: parseInt(distance),
        estimatedTime: parseInt(estimatedTime),
        basePrice: parseInt(basePrice)
      },
      include: {
        originCity: true,
        destinationCity: true
      }
    });

    res.status(201).json({
      message: 'Route created successfully',
      data: route
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
};

// Update route
exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { originCityId, destinationCityId, distance, estimatedTime, basePrice } = req.body;

    // Validation
    if (!originCityId || !destinationCityId || !distance || !estimatedTime || !basePrice) {
      return res.status(400).json({ 
        error: 'Origin city, destination city, distance, estimated time, and base price are required' 
      });
    }

    if (originCityId === destinationCityId) {
      return res.status(400).json({ error: 'Origin and destination cities must be different' });
    }

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id }
    });

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Check if cities exist
    const originCity = await prisma.city.findUnique({
      where: { id: originCityId }
    });

    const destinationCity = await prisma.city.findUnique({
      where: { id: destinationCityId }
    });

    if (!originCity || !destinationCity) {
      return res.status(404).json({ error: 'One or both cities not found' });
    }

    const route = await prisma.route.update({
      where: { id },
      data: {
        originCityId,
        destinationCityId,
        distance: parseInt(distance),
        estimatedTime: parseInt(estimatedTime),
        basePrice: parseInt(basePrice)
      },
      include: {
        originCity: true,
        destinationCity: true
      }
    });

    res.json({
      message: 'Route updated successfully',
      data: route
    });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ error: 'Failed to update route' });
  }
};

// Delete route
exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id }
    });

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Check if route is used in schedules
    const schedulesCount = await prisma.schedule.count({
      where: { routeId: id }
    });

    if (schedulesCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete route. It is used in existing schedules.' 
      });
    }

    await prisma.route.delete({
      where: { id }
    });

    res.json({
      message: 'Route deleted successfully'
    });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
};
