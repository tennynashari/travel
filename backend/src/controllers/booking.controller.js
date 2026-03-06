const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate booking code
const generateBookingCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}${random}`;
};

// Get all bookings
const getBookings = async (req, res) => {
  try {
    const { status, search, userId } = req.query;
    
    const where = {};
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    // Filter by userId (for customer to see their own bookings)
    if (userId) {
      where.userId = userId;
    } else if (req.user.role === 'CUSTOMER') {
      // Customers can only see their own bookings
      where.userId = req.user.id;
    }
    
    // Search by booking code
    if (search) {
      where.bookingCode = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        schedule: {
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
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data booking'
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        schedule: {
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
                    name: true,
                    phone: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking tidak ditemukan'
      });
    }

    // Check authorization (customers can only view their own bookings)
    if (req.user.role === 'CUSTOMER' && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses ke booking ini'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data booking'
    });
  }
};

// Get available seats for a schedule
const getAvailableSeats = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        vehicle: {
          include: {
            seatTemplate: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'PAID', 'CONFIRMED']
            }
          },
          select: {
            seatNumbers: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Jadwal tidak ditemukan'
      });
    }

    // Get all booked seats
    const bookedSeats = schedule.bookings.flatMap(booking => booking.seatNumbers);
    
    // Generate all seat numbers based on vehicle capacity
    const allSeats = Array.from({ length: schedule.vehicle.capacity }, (_, i) => (i + 1).toString());
    
    // Filter available seats
    const availableSeats = allSeats.filter(seat => !bookedSeats.includes(seat));

    res.json({
      success: true,
      data: {
        schedule: schedule,  // Include full schedule with vehicle and seatTemplate
        totalSeats: schedule.vehicle.capacity,
        availableSeats: availableSeats,
        bookedSeats: bookedSeats,
        availableCount: availableSeats.length
      }
    });
  } catch (error) {
    console.error('Error fetching available seats:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data kursi'
    });
  }
};

// Create new booking
const createBooking = async (req, res) => {
  try {
    const { scheduleId, seatNumbers, userId } = req.body;

    // Determine the customer (admin/operator can book for other users)
    let customerId = userId;
    if (req.user.role === 'CUSTOMER') {
      customerId = req.user.id;
    } else if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID wajib diisi'
      });
    }

    // Validate required fields
    if (!scheduleId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Jadwal dan kursi wajib dipilih'
      });
    }

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        vehicle: true,
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'PAID', 'CONFIRMED']
            }
          },
          select: {
            seatNumbers: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Jadwal tidak ditemukan'
      });
    }

    // Check if seats are available
    const bookedSeats = schedule.bookings.flatMap(booking => booking.seatNumbers);
    const conflictingSeats = seatNumbers.filter(seat => bookedSeats.includes(seat));

    if (conflictingSeats.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Kursi ${conflictingSeats.join(', ')} sudah dipesan`
      });
    }

    // Check if requested seats exceed vehicle capacity
    const invalidSeats = seatNumbers.filter(seat => parseInt(seat) > schedule.vehicle.capacity);
    if (invalidSeats.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Nomor kursi ${invalidSeats.join(', ')} melebihi kapasitas armada`
      });
    }

    // Calculate total price
    const totalSeats = seatNumbers.length;
    const totalPrice = schedule.ticketPrice * totalSeats;

    // Generate booking code
    const bookingCode = generateBookingCode();

    // Create booking in transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          userId: customerId,
          scheduleId,
          seatNumbers,
          totalSeats,
          totalPrice,
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          schedule: {
            include: {
              route: {
                include: {
                  originCity: true,
                  destinationCity: true
                }
              },
              vehicle: true
            }
          }
        }
      });

      // Update available seats in schedule
      await tx.schedule.update({
        where: { id: scheduleId },
        data: {
          availableSeats: {
            decrement: totalSeats
          }
        }
      });

      return newBooking;
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat booking'
    });
  }
};

// Update booking status
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        schedule: true
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking tidak ditemukan'
      });
    }

    // Check authorization (customers can only update their own bookings)
    if (req.user.role === 'CUSTOMER' && existingBooking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses untuk mengubah booking ini'
      });
    }

    const updateData = {};

    if (status) {
      const validStatuses = ['PENDING', 'PAID', 'CONFIRMED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status tidak valid'
        });
      }

      updateData.status = status;

      // Set paidAt when marking as PAID
      if (status === 'PAID' && existingBooking.status !== 'PAID') {
        updateData.paidAt = new Date();
      }
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        schedule: {
          include: {
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            },
            vehicle: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: booking,
      message: 'Booking berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate booking'
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        schedule: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking tidak ditemukan'
      });
    }

    // Check authorization
    if (req.user.role === 'CUSTOMER' && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses untuk membatalkan booking ini'
      });
    }

    // Check if already cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Booking sudah dibatalkan'
      });
    }

    // Cannot cancel if already paid/confirmed
    if (booking.status === 'PAID' || booking.status === 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat membatalkan booking yang sudah dibayar/dikonfirmasi'
      });
    }

    // Update booking and restore seats in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
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
        }
      });

      // Restore available seats
      await tx.schedule.update({
        where: { id: booking.scheduleId },
        data: {
          availableSeats: {
            increment: booking.totalSeats
          }
        }
      });

      return updated;
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking berhasil dibatalkan'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membatalkan booking'
    });
  }
};

// Get available schedules for booking
const getAvailableSchedules = async (req, res) => {
  try {
    const { date, routeId } = req.query;
    
    const where = {
      availableSeats: {
        gt: 0
      }
    };
    
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.departureDate = {
        gte: searchDate,
        lt: nextDay
      };
    } else {
      // Only show future schedules
      where.departureDate = {
        gte: new Date()
      };
    }
    
    if (routeId) {
      where.routeId = routeId;
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
        vehicle: {
          include: {
            seatTemplate: true
          }
        },
        driver: {
          include: {
            user: {
              select: {
                name: true
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
    console.error('Error fetching available schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil jadwal tersedia'
    });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  getAvailableSeats,
  createBooking,
  updateBooking,
  cancelBooking,
  getAvailableSchedules
};
