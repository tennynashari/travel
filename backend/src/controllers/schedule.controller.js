const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all schedules with relations
const getSchedules = async (req, res) => {
  try {
    const { date, routeId, status } = req.query;
    
    const where = {};
    
    // Filter by date if provided
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.departureDate = {
        gte: searchDate,
        lt: nextDay
      };
    }
    
    // Filter by route if provided
    if (routeId) {
      where.routeId = routeId;
    }
    
    // Filter by available seats (active schedules)
    if (status === 'active') {
      where.availableSeats = {
        gt: 0
      };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        route: {
          include: {
            originCity: true,
            destinationCity: true
          }
        },
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: [
        { departureDate: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data jadwal'
    });
  }
};

// Get schedule by ID
const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        route: {
          include: {
            originCity: true,
            destinationCity: true
          }
        },
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        bookings: true
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Jadwal tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data jadwal'
    });
  }
};

// Create new schedule
const createSchedule = async (req, res) => {
  try {
    const { routeId, vehicleId, driverId, departureDate, departureTime, ticketPrice } = req.body;

    // Validate required fields
    if (!routeId || !vehicleId || !driverId || !departureDate || !departureTime || !ticketPrice) {
      return res.status(400).json({
        success: false,
        error: 'Semua field wajib diisi'
      });
    }

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id: routeId }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Rute tidak ditemukan'
      });
    }

    // Check if vehicle exists and is active
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Armada tidak ditemukan'
      });
    }

    if (vehicle.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Armada tidak dalam status aktif'
      });
    }

    // Check if driver exists and is active
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver tidak ditemukan'
      });
    }

    if (driver.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Driver tidak dalam status aktif'
      });
    }

    // Check for conflicting schedules (same vehicle or driver at same time)
    const conflictingSchedule = await prisma.schedule.findFirst({
      where: {
        departureDate: new Date(departureDate),
        departureTime: departureTime,
        OR: [
          { vehicleId: vehicleId },
          { driverId: driverId }
        ]
      }
    });

    if (conflictingSchedule) {
      return res.status(400).json({
        success: false,
        error: 'Armada atau driver sudah memiliki jadwal pada waktu yang sama'
      });
    }

    // Create schedule with available seats from vehicle capacity
    const schedule = await prisma.schedule.create({
      data: {
        routeId,
        vehicleId,
        driverId,
        departureDate: new Date(departureDate),
        departureTime,
        ticketPrice: parseInt(ticketPrice),
        availableSeats: vehicle.capacity
      },
      include: {
        route: {
          include: {
            originCity: true,
            destinationCity: true
          }
        },
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Jadwal berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menambahkan jadwal'
    });
  }
};

// Update schedule
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { routeId, vehicleId, driverId, departureDate, departureTime, ticketPrice, availableSeats } = req.body;

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        bookings: true
      }
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Jadwal tidak ditemukan'
      });
    }

    // Check if there are bookings for this schedule
    if (existingSchedule.bookings.length > 0) {
      // If there are bookings, only allow updating ticket price and available seats
      if (routeId || vehicleId || driverId || departureDate || departureTime) {
        return res.status(400).json({
          success: false,
          error: 'Jadwal yang sudah memiliki booking hanya bisa mengubah harga tiket dan kursi tersedia'
        });
      }
    }

    const updateData = {};

    if (routeId) {
      const route = await prisma.route.findUnique({ where: { id: routeId } });
      if (!route) {
        return res.status(404).json({
          success: false,
          error: 'Rute tidak ditemukan'
        });
      }
      updateData.routeId = routeId;
    }

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Armada tidak ditemukan'
        });
      }
      if (vehicle.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          error: 'Armada tidak dalam status aktif'
        });
      }
      updateData.vehicleId = vehicleId;
    }

    if (driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver tidak ditemukan'
        });
      }
      if (driver.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          error: 'Driver tidak dalam status aktif'
        });
      }
      updateData.driverId = driverId;
    }

    if (departureDate) updateData.departureDate = new Date(departureDate);
    if (departureTime) updateData.departureTime = departureTime;
    if (ticketPrice) updateData.ticketPrice = parseInt(ticketPrice);
    if (availableSeats !== undefined) updateData.availableSeats = parseInt(availableSeats);

    // Check for conflicting schedules if date, time, vehicle, or driver changed
    if (departureDate || departureTime || vehicleId || driverId) {
      const conflictingSchedule = await prisma.schedule.findFirst({
        where: {
          id: { not: id },
          departureDate: departureDate ? new Date(departureDate) : existingSchedule.departureDate,
          departureTime: departureTime || existingSchedule.departureTime,
          OR: [
            { vehicleId: vehicleId || existingSchedule.vehicleId },
            { driverId: driverId || existingSchedule.driverId }
          ]
        }
      });

      if (conflictingSchedule) {
        return res.status(400).json({
          success: false,
          error: 'Armada atau driver sudah memiliki jadwal pada waktu yang sama'
        });
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        route: {
          include: {
            originCity: true,
            destinationCity: true
          }
        },
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: schedule,
      message: 'Jadwal berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate jadwal'
    });
  }
};

// Delete schedule
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        bookings: true
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Jadwal tidak ditemukan'
      });
    }

    // Check if there are bookings for this schedule
    if (schedule.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat menghapus jadwal yang sudah memiliki booking'
      });
    }

    await prisma.schedule.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Jadwal berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus jadwal'
    });
  }
};

// Get available routes for dropdown
const getAvailableRoutes = async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        originCity: true,
        destinationCity: true
      },
      orderBy: [
        { originCity: { name: 'asc' } },
        { destinationCity: { name: 'asc' } }
      ]
    });

    res.json({
      success: true,
      data: routes
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data rute'
    });
  }
};

// Get available vehicles for dropdown
const getAvailableVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        plateNumber: 'asc'
      }
    });

    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data armada'
    });
  }
};

// Get available drivers for dropdown
const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data driver'
    });
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAvailableRoutes,
  getAvailableVehicles,
  getAvailableDrivers
};
