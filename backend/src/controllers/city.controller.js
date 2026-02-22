const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all cities
exports.getCities = async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      message: 'Cities retrieved successfully',
      data: cities
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Failed to get cities' });
  }
};

// Get city by ID
exports.getCityById = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
      where: { id }
    });

    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json({
      message: 'City retrieved successfully',
      data: city
    });
  } catch (error) {
    console.error('Get city error:', error);
    res.status(500).json({ error: 'Failed to get city' });
  }
};

// Create city
exports.createCity = async (req, res) => {
  try {
    const { name, province } = req.body;

    // Validation
    if (!name || !province) {
      return res.status(400).json({ error: 'Name and province are required' });
    }

    // Check if city already exists
    const existingCity = await prisma.city.findFirst({
      where: {
        name: name,
        province: province
      }
    });

    if (existingCity) {
      return res.status(400).json({ error: 'City already exists in this province' });
    }

    const city = await prisma.city.create({
      data: {
        name,
        province
      }
    });

    res.status(201).json({
      message: 'City created successfully',
      data: city
    });
  } catch (error) {
    console.error('Create city error:', error);
    res.status(500).json({ error: 'Failed to create city' });
  }
};

// Update city
exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, province } = req.body;

    // Validation
    if (!name || !province) {
      return res.status(400).json({ error: 'Name and province are required' });
    }

    // Check if city exists
    const existingCity = await prisma.city.findUnique({
      where: { id }
    });

    if (!existingCity) {
      return res.status(404).json({ error: 'City not found' });
    }

    const city = await prisma.city.update({
      where: { id },
      data: {
        name,
        province
      }
    });

    res.json({
      message: 'City updated successfully',
      data: city
    });
  } catch (error) {
    console.error('Update city error:', error);
    res.status(500).json({ error: 'Failed to update city' });
  }
};

// Delete city
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if city exists
    const existingCity = await prisma.city.findUnique({
      where: { id }
    });

    if (!existingCity) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Check if city is used in routes
    const routesCount = await prisma.route.count({
      where: {
        OR: [
          { originCityId: id },
          { destinationCityId: id }
        ]
      }
    });

    if (routesCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete city. It is used in existing routes.' 
      });
    }

    await prisma.city.delete({
      where: { id }
    });

    res.json({
      message: 'City deleted successfully'
    });
  } catch (error) {
    console.error('Delete city error:', error);
    res.status(500).json({ error: 'Failed to delete city' });
  }
};
