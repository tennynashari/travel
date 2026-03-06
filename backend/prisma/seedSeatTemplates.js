const { PrismaClient } = require('@prisma/client');

async function seedSeatTemplates() {
  const prisma = new PrismaClient();
  
  console.log('🪑 Seeding seat templates ...');

  try {
    // Create default seat templates
    const templates = [
      {
        name: 'Minibus Standard',
        description: 'Layout standar minibus dengan 12 kursi (6 baris x 2 kursi)',
        rowsConfig: [2, 2, 2, 2, 2, 2],
        totalSeats: 12,
        isDefault: true,
        isActive: true
      },
      {
        name: 'Elf Standard',
        description: 'Layout standar Elf dengan 15 kursi (5 baris x 3 kursi)',
        rowsConfig: [3, 3, 3, 3, 3],
        totalSeats: 15,
        isDefault: false,
        isActive: true
      },
      {
        name: 'Hiace Standard',
        description: 'Layout Toyota Hiace dengan 12 kursi (4 baris x 3 kursi)',
        rowsConfig: [3, 3, 3, 3],
        totalSeats: 12,
        isDefault: false,
        isActive: true
      },
      {
        name: 'Bus Medium',
        description: 'Layout bus medium dengan 24 kursi (6 baris x 4 kursi)',
        rowsConfig: [4, 4, 4, 4, 4, 4],
        totalSeats: 24,
        isDefault: false,
        isActive: true
      },
      {
        name: 'Bus Besar',
        description: 'Layout bus besar dengan 32 kursi (8 baris x 4 kursi)',
        rowsConfig: [4, 4, 4, 4, 4, 4, 4, 4],
        totalSeats: 32,
        isDefault: false,
        isActive: true
      },
      {
        name: 'Van Kecil',
        description: 'Layout van kecil dengan 8 kursi (4 baris x 2 kursi)',
        rowsConfig: [2, 2, 2, 2],
        totalSeats: 8,
        isDefault: false,
        isActive: true
      },
      {
        name: 'Minibus VIP',
        description: 'Layout minibus VIP dengan kursi lebih longgar (10 kursi)',
        rowsConfig: [2, 2, 2, 2, 2],
        totalSeats: 10,
        isDefault: false,
        isActive: true
      }
    ];

    for (const template of templates) {
      const existing = await prisma.seatTemplate.findUnique({
        where: { name: template.name }
      });

      if (!existing) {
        await prisma.seatTemplate.create({
          data: template
        });
        console.log(`✅ Created template: ${template.name} (${template.totalSeats} seats)`);
      } else {
        console.log(`⏭️  Skipped existing template: ${template.name}`);
      }
    }

    // Migrate existing vehicles to use default template
    const defaultTemplate = await prisma.seatTemplate.findFirst({
      where: { isDefault: true }
    });

    if (defaultTemplate) {
      const vehiclesWithoutTemplate = await prisma.vehicle.findMany({
        where: {
          seatTemplateId: null
        }
      });

      if (vehiclesWithoutTemplate.length > 0) {
        console.log(`\n🚐 Migrating ${vehiclesWithoutTemplate.length} existing vehicles to default template...`);
        
        for (const vehicle of vehiclesWithoutTemplate) {
          await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: {
              seatTemplateId: defaultTemplate.id,
              capacity: defaultTemplate.totalSeats
            }
          });
          console.log(`✅ Migrated vehicle: ${vehicle.plateNumber}`);
        }
      }
    }

    console.log('\n✅ Seat templates seeding completed!\n');
  } catch (error) {
    console.error('❌ Error seeding seat templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedSeatTemplates().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { seedSeatTemplates };
