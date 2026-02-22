const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all payments (bookings with PAID/CONFIRMED status)
const getPayments = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, search } = req.query;
    
    const where = {
      status: {
        in: ['PAID', 'CONFIRMED']
      },
      paidAt: {
        not: null
      }
    };
    
    // Filter by date range
    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paidAt.lte = end;
      }
    }
    
    // Filter by payment method
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    
    // Search by booking code
    if (search) {
      where.bookingCode = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const payments = await prisma.booking.findMany({
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
            vehicle: true
          }
        }
      },
      orderBy: {
        paidAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data pembayaran'
    });
  }
};

// Get payment statistics
const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      status: {
        in: ['PAID', 'CONFIRMED']
      },
      paidAt: {
        not: null
      }
    };
    
    // Filter by date range
    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) {
        where.paidAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paidAt.lte = end;
      }
    }

    // Get payment statistics
    const [
      totalPayments,
      totalRevenue,
      paymentsByMethod,
      recentPayments
    ] = await prisma.$transaction([
      // Total payments count
      prisma.booking.count({ where }),
      
      // Total revenue
      prisma.booking.aggregate({
        where,
        _sum: {
          totalPrice: true
        }
      }),
      
      // Payments grouped by method
      prisma.booking.groupBy({
        by: ['paymentMethod'],
        where,
        _count: true,
        _sum: {
          totalPrice: true
        }
      }),
      
      // Recent payments (last 7 days)
      prisma.booking.count({
        where: {
          ...where,
          paidAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      })
    ]);

    // Get today's revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayRevenue = await prisma.booking.aggregate({
      where: {
        ...where,
        paidAt: {
          gte: todayStart
        }
      },
      _sum: {
        totalPrice: true
      }
    });

    // Format payment methods data
    const methodsStats = paymentsByMethod.reduce((acc, curr) => {
      acc[curr.paymentMethod || 'Unknown'] = {
        count: curr._count,
        total: curr._sum.totalPrice || 0
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalPayments,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        todayRevenue: todayRevenue._sum.totalPrice || 0,
        recentPayments,
        byPaymentMethod: methodsStats
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil statistik pembayaran'
    });
  }
};

// Get payment by booking ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.booking.findUnique({
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

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pembayaran tidak ditemukan'
      });
    }

    if (!payment.paidAt) {
      return res.status(400).json({
        success: false,
        error: 'Booking belum dibayar'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data pembayaran'
    });
  }
};

// Get payment methods summary
const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await prisma.booking.findMany({
      where: {
        status: {
          in: ['PAID', 'CONFIRMED']
        },
        paymentMethod: {
          not: null
        }
      },
      select: {
        paymentMethod: true
      },
      distinct: ['paymentMethod']
    });

    const methods = paymentMethods.map(p => p.paymentMethod).filter(Boolean);

    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil metode pembayaran'
    });
  }
};

// Get daily revenue report
const getDailyRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const payments = await prisma.booking.findMany({
      where: {
        status: {
          in: ['PAID', 'CONFIRMED']
        },
        paidAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        paidAt: true,
        totalPrice: true
      },
      orderBy: {
        paidAt: 'asc'
      }
    });

    // Group by date
    const dailyRevenue = payments.reduce((acc, payment) => {
      const date = new Date(payment.paidAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          total: 0
        };
      }
      acc[date].count++;
      acc[date].total += payment.totalPrice;
      return acc;
    }, {});

    const result = Object.values(dailyRevenue).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching daily revenue:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil laporan pendapatan harian'
    });
  }
};

module.exports = {
  getPayments,
  getPaymentStats,
  getPaymentById,
  getPaymentMethods,
  getDailyRevenue
};
