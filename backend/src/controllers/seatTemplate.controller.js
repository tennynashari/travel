const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all seat templates
const getSeatTemplates = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const templates = await prisma.seatTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { vehicles: true }
        }
      }
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching seat templates:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data template kursi'
    });
  }
};

// Get seat template by ID
const getSeatTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.seatTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { vehicles: true }
        }
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching seat template:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data template'
    });
  }
};

// Create new seat template
const createSeatTemplate = async (req, res) => {
  try {
    const { name, description, rowsConfig, isDefault } = req.body;

    // Validate rowsConfig
    if (!Array.isArray(rowsConfig) || rowsConfig.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'rowsConfig harus berupa array dan tidak boleh kosong'
      });
    }

    // Validate each row has valid number of seats
    for (const seats of rowsConfig) {
      if (!Number.isInteger(seats) || seats < 1 || seats > 6) {
        return res.status(400).json({
          success: false,
          error: 'Jumlah kursi per baris harus antara 1-6'
        });
      }
    }

    // Calculate total seats
    const totalSeats = rowsConfig.reduce((sum, seats) => sum + seats, 0);

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.seatTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const template = await prisma.seatTemplate.create({
      data: {
        name,
        description,
        rowsConfig,
        totalSeats,
        isDefault: isDefault || false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Template berhasil dibuat',
      data: template
    });
  } catch (error) {
    console.error('Error creating seat template:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Nama template sudah digunakan'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Gagal membuat template'
    });
  }
};

// Update seat template
const updateSeatTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, rowsConfig, isActive, isDefault } = req.body;

    // Check if template exists
    const existingTemplate = await prisma.seatTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template tidak ditemukan'
      });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (rowsConfig !== undefined) {
      // Validate rowsConfig
      if (!Array.isArray(rowsConfig) || rowsConfig.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'rowsConfig harus berupa array dan tidak boleh kosong'
        });
      }

      for (const seats of rowsConfig) {
        if (!Number.isInteger(seats) || seats < 1 || seats > 6) {
          return res.status(400).json({
            success: false,
            error: 'Jumlah kursi per baris harus antara 1-6'
          });
        }
      }

      updateData.rowsConfig = rowsConfig;
      updateData.totalSeats = rowsConfig.reduce((sum, seats) => sum + seats, 0);
    }

    // If this is set as default, unset other defaults
    if (isDefault && !existingTemplate.isDefault) {
      await prisma.seatTemplate.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
      updateData.isDefault = true;
    } else if (isDefault !== undefined) {
      updateData.isDefault = isDefault;
    }

    const template = await prisma.seatTemplate.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Template berhasil diupdate',
      data: template
    });
  } catch (error) {
    console.error('Error updating seat template:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Nama template sudah digunakan'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate template'
    });
  }
};

// Delete seat template
const deleteSeatTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template is used by any vehicle
    const vehicleCount = await prisma.vehicle.count({
      where: { seatTemplateId: id }
    });

    if (vehicleCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Template tidak dapat dihapus karena digunakan oleh ${vehicleCount} kendaraan`
      });
    }

    await prisma.seatTemplate.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Template berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting seat template:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Template tidak ditemukan'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Gagal menghapus template'
    });
  }
};

module.exports = {
  getSeatTemplates,
  getSeatTemplateById,
  createSeatTemplate,
  updateSeatTemplate,
  deleteSeatTemplate
};
