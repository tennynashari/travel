const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all schedules with booking counts for check-in list
const getSchedulesForCheckIn = async (req, res) => {
  try {
    const { date, routeId, status } = req.query;
    const where = {};

    // Filter by departure date
    if (date) {
      where.departureDate = {
        gte: new Date(date),
        lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      };
    } else {
      // Default to today and future dates
      where.departureDate = {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
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
        vehicle: true,
        driver: {
          include: {
            user: {
              select: { name: true, phone: true }
            }
          }
        },
        bookings: {
          where: status ? { status } : {
            status: {
              in: ['PAID', 'CONFIRMED']
            }
          },
          select: {
            id: true,
            checkedIn: true
          }
        }
      },
      orderBy: [
        { departureDate: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    // Add booking statistics to each schedule
    const schedulesWithStats = schedules.map(schedule => {
      const totalBookings = schedule.bookings.length;
      const checkedInCount = schedule.bookings.filter(b => b.checkedIn).length;
      const pendingCheckIn = totalBookings - checkedInCount;

      return {
        ...schedule,
        bookingStats: {
          total: totalBookings,
          checkedIn: checkedInCount,
          pending: pendingCheckIn
        }
      };
    });

    res.json({
      success: true,
      data: schedulesWithStats
    });
  } catch (error) {
    console.error('Error fetching schedules for check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jadwal',
      error: error.message
    });
  }
};

// Get all bookings for a specific schedule
const getScheduleBookings = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { status, checkedIn } = req.query;

    const where = {
      scheduleId,
      status: {
        in: ['PAID', 'CONFIRMED']
      }
    };

    if (status) {
      where.status = status;
    }

    if (checkedIn !== undefined) {
      where.checkedIn = checkedIn === 'true';
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
                  select: { name: true }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { checkedIn: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Get statistics
    const stats = {
      total: bookings.length,
      checkedIn: bookings.filter(b => b.checkedIn).length,
      pending: bookings.filter(b => !b.checkedIn).length,
      totalSeats: bookings.reduce((sum, b) => sum + b.totalSeats, 0),
      checkedInSeats: bookings.filter(b => b.checkedIn).reduce((sum, b) => sum + b.totalSeats, 0)
    };

    res.json({
      success: true,
      data: bookings,
      stats
    });
  } catch (error) {
    console.error('Error fetching schedule bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data booking',
      error: error.message
    });
  }
};

// Check-in a single booking
const checkInBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware

    // Check if booking exists and is eligible for check-in
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        schedule: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Check if booking is paid or confirmed
    if (!['PAID', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Booking belum dibayar atau dikonfirmasi'
      });
    }

    // Check if already checked in
    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Booking sudah di-check in'
      });
    }

    // Check if schedule date is valid (not in the past)
    const scheduleDate = new Date(booking.schedule.departureDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Jadwal keberangkatan sudah lewat'
      });
    }

    // Perform check-in
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        checkedIn: true,
        checkInTime: new Date(),
        checkInBy: userId
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

    res.json({
      success: true,
      message: 'Check-in berhasil',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error checking in booking:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal melakukan check-in',
      error: error.message
    });
  }
};

// Undo check-in (for corrections)
const undoCheckIn = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    if (!booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Booking belum di-check in'
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        checkedIn: false,
        checkInTime: null,
        checkInBy: null
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
      }
    });

    res.json({
      success: true,
      message: 'Check-in dibatalkan',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error undoing check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membatalkan check-in',
      error: error.message
    });
  }
};

// Bulk check-in for all bookings in a schedule
const bulkCheckIn = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user.id;

    // Get all eligible bookings
    const bookings = await prisma.booking.findMany({
      where: {
        scheduleId,
        status: {
          in: ['PAID', 'CONFIRMED']
        },
        checkedIn: false
      }
    });

    if (bookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada booking yang perlu di-check in'
      });
    }

    // Bulk update
    const result = await prisma.booking.updateMany({
      where: {
        scheduleId,
        status: {
          in: ['PAID', 'CONFIRMED']
        },
        checkedIn: false
      },
      data: {
        checkedIn: true,
        checkInTime: new Date(),
        checkInBy: userId
      }
    });

    res.json({
      success: true,
      message: `${result.count} booking berhasil di-check in`,
      data: { count: result.count }
    });
  } catch (error) {
    console.error('Error bulk checking in:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal melakukan bulk check-in',
      error: error.message
    });
  }
};

// Get check-in statistics for a schedule
const getCheckInStats = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
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
              select: { name: true }
            }
          }
        },
        bookings: {
          where: {
            status: {
              in: ['PAID', 'CONFIRMED']
            }
          },
          select: {
            id: true,
            checkedIn: true,
            totalSeats: true,
            checkInTime: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan'
      });
    }

    const totalBookings = schedule.bookings.length;
    const checkedInBookings = schedule.bookings.filter(b => b.checkedIn).length;
    const pendingBookings = totalBookings - checkedInBookings;
    const totalSeats = schedule.bookings.reduce((sum, b) => sum + b.totalSeats, 0);
    const checkedInSeats = schedule.bookings.filter(b => b.checkedIn).reduce((sum, b) => sum + b.totalSeats, 0);

    res.json({
      success: true,
      data: {
        schedule: {
          id: schedule.id,
          departureDate: schedule.departureDate,
          departureTime: schedule.departureTime,
          route: schedule.route,
          vehicle: schedule.vehicle,
          driver: schedule.driver
        },
        stats: {
          totalBookings,
          checkedInBookings,
          pendingBookings,
          totalSeats,
          checkedInSeats,
          pendingSeats: totalSeats - checkedInSeats,
          checkInRate: totalBookings > 0 ? Math.round((checkedInBookings / totalBookings) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching check-in stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik check-in',
      error: error.message
    });
  }
};

module.exports = {
  getSchedulesForCheckIn,
  getScheduleBookings,
  checkInBooking,
  undoCheckIn,
  bulkCheckIn,
  getCheckInStats
};
