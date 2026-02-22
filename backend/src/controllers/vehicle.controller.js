const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all vehicles
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      message: 'Vehicles retrieved successfully',
      data: vehicles
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
};

// Get vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({
      message: 'Vehicle retrieved successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to get vehicle' });
  }
};

// Create vehicle
exports.createVehicle = async (req, res) => {
  try {
    const { plateNumber, vehicleType, capacity, status } = req.body;

    // Validation
    if (!plateNumber || !vehicleType || !capacity) {
      return res.status(400).json({ 
        error: 'Plate number, vehicle type, and capacity are required' 
      });
    }

    // Check if plate number already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plateNumber }
    });

    if (existingVehicle) {
      return res.status(400).json({ error: 'Plate number already exists' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber,
        vehicleType,
        capacity: parseInt(capacity),
        status: status || 'ACTIVE'
      }
    });

    res.status(201).json({
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { plateNumber, vehicleType, capacity, status } = req.body;

    // Validation
    if (!plateNumber || !vehicleType || !capacity) {
      return res.status(400).json({ 
        error: 'Plate number, vehicle type, and capacity are required' 
      });
    }

    // Check if vehicle exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if plate number is taken by another vehicle
    if (plateNumber !== existingVehicle.plateNumber) {
      const plateExists = await prisma.vehicle.findUnique({
        where: { plateNumber }
      });

      if (plateExists) {
        return res.status(400).json({ error: 'Plate number already exists' });
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        plateNumber,
        vehicleType,
        capacity: parseInt(capacity),
        status: status || 'ACTIVE'
      }
    });

    res.json({
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if vehicle is used in schedules
    const schedulesCount = await prisma.schedule.count({
      where: { vehicleId: id }
    });

    if (schedulesCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete vehicle. It is used in existing schedules.' 
      });
    }

    await prisma.vehicle.delete({
      where: { id }
    });

    res.json({
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};
