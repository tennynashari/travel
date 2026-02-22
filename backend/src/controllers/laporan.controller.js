const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Laporan Overview - Summary semua data
const getOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get counts
    const [
      totalBookings,
      totalRevenue,
      totalVehicles,
      totalDrivers,
      totalRoutes,
      totalCustomers,
      activeSchedules
    ] = await Promise.all([
      prisma.booking.count({ where: dateFilter }),
      prisma.booking.aggregate({
        where: {
          ...dateFilter,
          status: { in: ['PAID', 'CONFIRMED'] }
        },
        _sum: { totalPrice: true }
      }),
      prisma.vehicle.count(),
      prisma.driver.count(),
      prisma.route.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.schedule.count({
        where: {
          departureDate: { gte: new Date() }
        }
      })
    ]);

    // Get booking by status
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { id: true },
      _sum: { totalPrice: true }
    });

    res.json({
      success: true,
      data: {
        totalBookings,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        totalVehicles,
        totalDrivers,
        totalRoutes,
        totalCustomers,
        activeSchedules,
        bookingsByStatus: bookingsByStatus.map(item => ({
          status: item.status,
          count: item._count.id,
          revenue: item._sum.totalPrice || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error getting overview:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data overview',
      error: error.message
    });
  }
};

// Laporan Penjualan/Booking
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate dan endDate harus diisi'
      });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: { in: ['PAID', 'CONFIRMED'] }
      },
      include: {
        user: {
          select: { name: true, email: true }
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
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by date
    const groupedData = {};
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      let key;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'year') {
        key = String(date.getFullYear());
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          count: 0,
          revenue: 0,
          seats: 0
        };
      }

      groupedData[key].count += 1;
      groupedData[key].revenue += booking.totalPrice;
      groupedData[key].seats += booking.totalSeats;
    });

    const summary = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.totalPrice, 0),
      totalSeats: bookings.reduce((sum, b) => sum + b.totalSeats, 0),
      averagePrice: bookings.length > 0 
        ? bookings.reduce((sum, b) => sum + b.totalPrice, 0) / bookings.length 
        : 0
    };

    res.json({
      success: true,
      data: {
        summary,
        details: bookings,
        grouped: Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date))
      }
    });
  } catch (error) {
    console.error('Error getting sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil laporan penjualan',
      error: error.message
    });
  }
};

// Laporan Pendapatan per Rute
const getRouteRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        ...dateFilter,
        status: { in: ['PAID', 'CONFIRMED'] }
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
      }
    });

    // Group by route
    const routeData = {};
    bookings.forEach(booking => {
      const routeId = booking.schedule.route.id;
      const routeName = `${booking.schedule.route.originCity.name} - ${booking.schedule.route.destinationCity.name}`;

      if (!routeData[routeId]) {
        routeData[routeId] = {
          routeId,
          routeName,
          origin: booking.schedule.route.originCity.name,
          destination: booking.schedule.route.destinationCity.name,
          bookingCount: 0,
          totalRevenue: 0,
          totalSeats: 0
        };
      }

      routeData[routeId].bookingCount += 1;
      routeData[routeId].totalRevenue += booking.totalPrice;
      routeData[routeId].totalSeats += booking.totalSeats;
    });

    const sortedRoutes = Object.values(routeData).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      success: true,
      data: sortedRoutes
    });
  } catch (error) {
    console.error('Error getting route revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil laporan pendapatan per rute',
      error: error.message
    });
  }
};

// Laporan Utilisasi Armada
const getVehicleUtilization = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.departureDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const vehicles = await prisma.vehicle.findMany({
      include: {
        schedules: {
          where: dateFilter,
          include: {
            bookings: {
              where: {
                status: { in: ['PAID', 'CONFIRMED'] }
              }
            }
          }
        }
      }
    });

    const vehicleStats = vehicles.map(vehicle => {
      const totalTrips = vehicle.schedules.length;
      const totalSeatsAvailable = totalTrips * vehicle.capacity;
      const totalSeatsBooked = vehicle.schedules.reduce((sum, schedule) => {
        return sum + schedule.bookings.reduce((bookingSum, booking) => {
          return bookingSum + booking.totalSeats;
        }, 0);
      }, 0);
      const revenue = vehicle.schedules.reduce((sum, schedule) => {
        return sum + schedule.bookings.reduce((bookingSum, booking) => {
          return bookingSum + booking.totalPrice;
        }, 0);
      }, 0);

      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
        capacity: vehicle.capacity,
        status: vehicle.status,
        totalTrips,
        totalSeatsAvailable,
        totalSeatsBooked,
        utilizationRate: totalSeatsAvailable > 0 
          ? Math.round((totalSeatsBooked / totalSeatsAvailable) * 100) 
          : 0,
        revenue
      };
    });

    vehicleStats.sort((a, b) => b.utilizationRate - a.utilizationRate);

    res.json({
      success: true,
      data: vehicleStats
    });
  } catch (error) {
    console.error('Error getting vehicle utilization:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil laporan utilisasi armada',
      error: error.message
    });
  }
};

// Laporan Kinerja Driver
const getDriverPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.departureDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const drivers = await prisma.driver.findMany({
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        },
        schedules: {
          where: dateFilter,
          include: {
            bookings: {
              where: {
                status: { in: ['PAID', 'CONFIRMED'] }
              }
            }
          }
        }
      }
    });

    const driverStats = drivers.map(driver => {
      const totalTrips = driver.schedules.length;
      const totalPassengers = driver.schedules.reduce((sum, schedule) => {
        return sum + schedule.bookings.reduce((bookingSum, booking) => {
          return bookingSum + booking.totalSeats;
        }, 0);
      }, 0);
      const revenue = driver.schedules.reduce((sum, schedule) => {
        return sum + schedule.bookings.reduce((bookingSum, booking) => {
          return bookingSum + booking.totalPrice;
        }, 0);
      }, 0);

      return {
        driverId: driver.id,
        driverName: driver.user.name,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        totalTrips,
        totalPassengers,
        revenue,
        averagePassengersPerTrip: totalTrips > 0 
          ? Math.round(totalPassengers / totalTrips) 
          : 0
      };
    });

    driverStats.sort((a, b) => b.totalTrips - a.totalTrips);

    res.json({
      success: true,
      data: driverStats
    });
  } catch (error) {
    console.error('Error getting driver performance:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil laporan kinerja driver',
      error: error.message
    });
  }
};

// Laporan Top Customers
const getTopCustomers = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        bookings: {
          some: {
            ...dateFilter,
            status: { in: ['PAID', 'CONFIRMED'] }
          }
        }
      },
      include: {
        bookings: {
          where: {
            ...dateFilter,
            status: { in: ['PAID', 'CONFIRMED'] }
          }
        }
      }
    });

    const customerStats = customers.map(customer => {
      const totalBookings = customer.bookings.length;
      const totalSpent = customer.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
      const lastBookingDate = customer.bookings.length > 0
        ? new Date(Math.max(...customer.bookings.map(b => new Date(b.createdAt))))
        : null;

      return {
        customerId: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalBookings,
        totalSpent,
        averageSpent: totalBookings > 0 ? Math.round(totalSpent / totalBookings) : 0,
        lastBookingDate
      };
    });

    customerStats.sort((a, b) => b.totalSpent - a.totalSpent);
    const topCustomers = customerStats.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    console.error('Error getting top customers:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil laporan pelanggan terbaik',
      error: error.message
    });
  }
};

// Export data dalam format JSON (bisa dikembangkan ke Excel/PDF)
const exportReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Parameter type harus diisi'
      });
    }

    let data;
    let filename;

    switch (type) {
      case 'sales':
        const salesData = await getSalesDataForExport(startDate, endDate);
        data = salesData;
        filename = `laporan-penjualan-${Date.now()}.json`;
        break;
      case 'route':
        const routeData = await getRouteDataForExport(startDate, endDate);
        data = routeData;
        filename = `laporan-rute-${Date.now()}.json`;
        break;
      case 'vehicle':
        const vehicleData = await getVehicleDataForExport(startDate, endDate);
        data = vehicleData;
        filename = `laporan-armada-${Date.now()}.json`;
        break;
      case 'driver':
        const driverData = await getDriverDataForExport(startDate, endDate);
        data = driverData;
        filename = `laporan-driver-${Date.now()}.json`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipe laporan tidak valid'
        });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json({
      success: true,
      exportDate: new Date(),
      type,
      startDate,
      endDate,
      data
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal export laporan',
      error: error.message
    });
  }
};

// Helper functions untuk export
const getSalesDataForExport = async (startDate, endDate) => {
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      user: { select: { name: true, email: true } },
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
  return bookings;
};

const getRouteDataForExport = async (startDate, endDate) => {
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      status: { in: ['PAID', 'CONFIRMED'] }
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
    }
  });
  return bookings;
};

const getVehicleDataForExport = async (startDate, endDate) => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      schedules: {
        where: {
          departureDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          bookings: true
        }
      }
    }
  });
  return vehicles;
};

const getDriverDataForExport = async (startDate, endDate) => {
  const drivers = await prisma.driver.findMany({
    include: {
      user: true,
      schedules: {
        where: {
          departureDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          bookings: true
        }
      }
    }
  });
  return drivers;
};

module.exports = {
  getOverview,
  getSalesReport,
  getRouteRevenue,
  getVehicleUtilization,
  getDriverPerformance,
  getTopCustomers,
  exportReport
};
