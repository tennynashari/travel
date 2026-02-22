const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      message: 'Drivers retrieved successfully',
      data: drivers
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to get drivers' });
  }
};

// Get driver by ID
exports.getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      message: 'Driver retrieved successfully',
      data: driver
    });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ error: 'Failed to get driver' });
  }
};

// Create driver
exports.createDriver = async (req, res) => {
  try {
    const { userId, licenseNumber, status } = req.body;

    // Validation
    if (!userId || !licenseNumber) {
      return res.status(400).json({ 
        error: 'User ID and license number are required' 
      });
    }

    // Check if user exists and has DRIVER role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'DRIVER') {
      return res.status(400).json({ 
        error: 'User must have DRIVER role' 
      });
    }

    // Check if user is already a driver
    const existingDriver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (existingDriver) {
      return res.status(400).json({ error: 'User is already registered as a driver' });
    }

    // Check if license number already exists
    const licenseExists = await prisma.driver.findUnique({
      where: { licenseNumber }
    });

    if (licenseExists) {
      return res.status(400).json({ error: 'License number already exists' });
    }

    const driver = await prisma.driver.create({
      data: {
        userId,
        licenseNumber,
        status: status || 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Driver created successfully',
      data: driver
    });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

// Update driver
exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { licenseNumber, status } = req.body;

    // Validation
    if (!licenseNumber) {
      return res.status(400).json({ error: 'License number is required' });
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id }
    });

    if (!existingDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if license number is taken by another driver
    if (licenseNumber !== existingDriver.licenseNumber) {
      const licenseExists = await prisma.driver.findUnique({
        where: { licenseNumber }
      });

      if (licenseExists) {
        return res.status(400).json({ error: 'License number already exists' });
      }
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        licenseNumber,
        status: status || existingDriver.status
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        }
      }
    });

    res.json({
      message: 'Driver updated successfully',
      data: driver
    });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

// Delete driver
exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id }
    });

    if (!existingDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if driver is assigned to schedules
    const schedulesCount = await prisma.schedule.count({
      where: { driverId: id }
    });

    if (schedulesCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete driver. Driver is assigned to existing schedules.' 
      });
    }

    await prisma.driver.delete({
      where: { id }
    });

    res.json({
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
};

// Get users with DRIVER role (for dropdown)
exports.getDriverUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { 
        role: 'DRIVER',
        driver: null // Only users without driver profile
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    });

    res.json({
      message: 'Driver users retrieved successfully',
      data: users
    });
  } catch (error) {
    console.error('Get driver users error:', error);
    res.status(500).json({ error: 'Failed to get driver users' });
  }
};
