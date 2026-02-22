const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Get all users
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    
    const where = {};
    
    // Filter by role if provided
    if (role) {
      where.role = role;
    }
    
    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        driver: {
          select: {
            id: true,
            licenseNumber: true,
            status: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data user'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        driver: true,
        bookings: {
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
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data user'
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, nama, dan role wajib diisi'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format email tidak valid'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email sudah terdaftar'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password minimal 6 karakter'
      });
    }

    // Validate role
    const validRoles = ['ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role tidak valid'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menambahkan user'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, phone, role, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        driver: true,
        bookings: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan'
      });
    }

    // Prevent changing role if user is a driver with active driver profile
    if (role && role !== existingUser.role && existingUser.driver) {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat mengubah role user yang sudah terdaftar sebagai driver. Hapus profil driver terlebih dahulu.'
      });
    }

    const updateData = {};

    // Update email if provided and different
    if (email && email !== existingUser.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Format email tidak valid'
        });
      }

      // Check if new email already exists
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Email sudah digunakan oleh user lain'
        });
      }

      updateData.email = email;
    }

    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    
    if (role) {
      const validRoles = ['ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Role tidak valid'
        });
      }
      updateData.role = role;
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password minimal 6 karakter'
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user,
      message: 'User berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate user'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            schedules: true
          }
        },
        bookings: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan'
      });
    }

    // Prevent deleting current logged in user
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat menghapus akun sendiri'
      });
    }

    // Check if user is a driver with schedules
    if (user.driver && user.driver.schedules.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat menghapus user yang memiliki jadwal sebagai driver'
      });
    }

    // Check if user has bookings
    if (user.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat menghapus user yang memiliki riwayat booking'
      });
    }

    // Delete driver profile first if exists
    if (user.driver) {
      await prisma.driver.delete({
        where: { id: user.driver.id }
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus user'
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      // Total users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      // Total users
      prisma.user.count(),
      // Users created in last 30 days
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      })
    ]);

    const roleStats = stats[0].reduce((acc, curr) => {
      acc[curr.role] = curr._count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalUsers: stats[1],
        newUsersLast30Days: stats[2],
        byRole: roleStats
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil statistik user'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
};
