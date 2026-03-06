const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Generate schedules from templates
const generateSchedules = async (req, res) => {
  try {
    const { days } = req.body; // 7 or 30
    
    const daysToGenerate = days || 7;
    
    // 1. Get all active templates
    const templates = await prisma.schedule.findMany({
      where: {
        isTemplate: true,
        isActive: true,
        recurringType: { not: 'NONE' }
      },
      include: {
        route: {
          include: {
            originCity: true,
            destinationCity: true
          }
        },
        vehicle: true,
        driver: { include: { user: true } }
      }
    });

    if (templates.length === 0) {
      return res.json({
        success: true,
        message: 'Tidak ada template aktif untuk di-generate',
        data: { created: 0, skipped: 0, details: [] }
      });
    }

    // 2. Calculate date range (today + next X days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysToGenerate - 1);

    const dateRange = [];
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d));
    }

    // 3. Generate schedules for each template
    const schedulesToCreate = [];
    const skippedSchedules = [];

    for (const template of templates) {
      for (const date of dateRange) {
        // Check if should generate for this date
        if (!shouldGenerateForDate(template, date)) {
          continue;
        }

        // Check if already exists
        const exists = await checkScheduleExists(template, date);
        if (exists) {
          skippedSchedules.push({
            templateName: template.templateName,
            date: date.toISOString().split('T')[0],
            reason: 'Jadwal sudah ada'
          });
          continue;
        }

        // Check vehicle/driver availability
        const availabilityCheck = await checkAvailability(template, date);
        if (!availabilityCheck.available) {
          skippedSchedules.push({
            templateName: template.templateName,
            date: date.toISOString().split('T')[0],
            reason: availabilityCheck.reason
          });
          continue;
        }

        schedulesToCreate.push({
          routeId: template.routeId,
          vehicleId: template.vehicleId,
          driverId: template.driverId,
          departureDate: date,
          departureTime: template.departureTime,
          ticketPrice: template.ticketPrice,
          availableSeats: template.availableSeats,
          sourceTemplateId: template.id,
          isTemplate: false,
          isActive: true
        });
      }
    }

    // 4. Bulk create schedules
    if (schedulesToCreate.length > 0) {
      await prisma.schedule.createMany({
        data: schedulesToCreate
      });
    }

    res.json({
      success: true,
      message: schedulesToCreate.length > 0 
        ? `${schedulesToCreate.length} jadwal berhasil dibuat untuk ${daysToGenerate} hari ke depan`
        : 'Tidak ada jadwal baru yang perlu dibuat',
      data: {
        created: schedulesToCreate.length,
        skipped: skippedSchedules.length,
        period: `${daysToGenerate} hari`,
        details: {
          created: schedulesToCreate.map(s => ({
            date: s.departureDate.toISOString().split('T')[0],
            time: s.departureTime,
            route: templates.find(t => t.id === s.sourceTemplateId)?.route?.originCity?.name + ' → ' + 
                   templates.find(t => t.id === s.sourceTemplateId)?.route?.destinationCity?.name
          })),
          skipped: skippedSchedules
        }
      }
    });
  } catch (error) {
    console.error('Generate schedules error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal generate jadwal: ' + error.message
    });
  }
};

// Helper: Check if should generate for this date based on recurring type
function shouldGenerateForDate(template, date) {
  const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

  switch (template.recurringType) {
    case 'DAILY':
      return true;

    case 'WEEKLY':
      // Check if this day is in recurringDays array
      // recurringDays: [0,1,2,3,4,5,6] for Sunday-Saturday
      if (!template.recurringDays || !Array.isArray(template.recurringDays)) {
        return false;
      }
      return template.recurringDays.includes(dayOfWeek);

    case 'MONTHLY':
      // Generate on same date each month
      const templateDate = new Date(template.departureDate);
      return date.getDate() === templateDate.getDate();

    default:
      return false;
  }
}

// Helper: Check if schedule already exists
async function checkScheduleExists(template, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await prisma.schedule.findFirst({
    where: {
      routeId: template.routeId,
      vehicleId: template.vehicleId,
      departureDate: {
        gte: startOfDay,
        lte: endOfDay
      },
      departureTime: template.departureTime,
      isTemplate: false
    }
  });

  return !!existing;
}

// Helper: Check vehicle & driver availability
async function checkAvailability(template, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const conflictingSchedule = await prisma.schedule.findFirst({
    where: {
      departureDate: {
        gte: startOfDay,
        lte: endOfDay
      },
      departureTime: template.departureTime,
      isTemplate: false,
      OR: [
        { vehicleId: template.vehicleId },
        { driverId: template.driverId }
      ],
      NOT: {
        routeId: template.routeId  // Allow same route
      }
    }
  });

  if (conflictingSchedule) {
    return {
      available: false,
      reason: 'Kendaraan atau driver sudah terjadwal'
    };
  }

  return { available: true };
}

// Get all templates
const getTemplates = async (req, res) => {
  try {
    const templates = await prisma.schedule.findMany({
      where: {
        isTemplate: true
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
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            generatedSchedules: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data template'
    });
  }
};

// Get template by ID
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.schedule.findUnique({
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
            user: true
          }
        }
      }
    });

    if (!template || !template.isTemplate) {
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
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data template'
    });
  }
};

// Create template
const createTemplate = async (req, res) => {
  try {
    const {
      templateName,
      routeId,
      vehicleId,
      driverId,
      departureTime,
      ticketPrice,
      recurringType,
      recurringDays
    } = req.body;

    // Validation
    if (!templateName || !routeId || !vehicleId || !driverId || !departureTime || !ticketPrice || !recurringType) {
      return res.status(400).json({
        success: false,
        error: 'Semua field wajib diisi'
      });
    }

    // Get vehicle capacity
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return res.status(400).json({
        success: false,
        error: 'Kendaraan tidak ditemukan'
      });
    }

    // Create template (use a dummy date since it's a template)
    const dummyDate = new Date('2026-01-01');

    const template = await prisma.schedule.create({
      data: {
        templateName,
        routeId,
        vehicleId,
        driverId,
        departureDate: dummyDate,
        departureTime,
        ticketPrice: parseInt(ticketPrice),
        availableSeats: vehicle.capacity,
        isTemplate: true,
        recurringType,
        recurringDays: recurringDays || null,
        isActive: true
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
            user: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Template berhasil dibuat',
      data: template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat template: ' + error.message
    });
  }
};

// Update template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      templateName,
      routeId,
      vehicleId,
      driverId,
      departureTime,
      ticketPrice,
      recurringType,
      recurringDays,
      isActive
    } = req.body;

    // Check if template exists
    const existingTemplate = await prisma.schedule.findUnique({
      where: { id }
    });

    if (!existingTemplate || !existingTemplate.isTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template tidak ditemukan'
      });
    }

    // Get vehicle capacity if vehicleId changed
    let availableSeats = existingTemplate.availableSeats;
    if (vehicleId && vehicleId !== existingTemplate.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId }
      });
      if (vehicle) {
        availableSeats = vehicle.capacity;
      }
    }

    const template = await prisma.schedule.update({
      where: { id },
      data: {
        templateName: templateName || existingTemplate.templateName,
        routeId: routeId || existingTemplate.routeId,
        vehicleId: vehicleId || existingTemplate.vehicleId,
        driverId: driverId || existingTemplate.driverId,
        departureTime: departureTime || existingTemplate.departureTime,
        ticketPrice: ticketPrice !== undefined ? parseInt(ticketPrice) : existingTemplate.ticketPrice,
        availableSeats,
        recurringType: recurringType || existingTemplate.recurringType,
        recurringDays: recurringDays !== undefined ? recurringDays : existingTemplate.recurringDays,
        isActive: isActive !== undefined ? isActive : existingTemplate.isActive
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
            user: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Template berhasil diupdate',
      data: template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate template: ' + error.message
    });
  }
};

// Delete template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const template = await prisma.schedule.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            generatedSchedules: true
          }
        }
      }
    });

    if (!template || !template.isTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template tidak ditemukan'
      });
    }

    // Delete template (generated schedules will have sourceTemplateId set to null)
    await prisma.schedule.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Template berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus template: ' + error.message
    });
  }
};

module.exports = {
  generateSchedules,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
