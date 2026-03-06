const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('🗑️  Memulai penghapusan data...\n');

    // Delete bookings first (foreign key constraint)
    console.log('📋 Menghapus semua bookings...');
    const deletedBookings = await prisma.booking.deleteMany({});
    console.log(`✅ ${deletedBookings.count} bookings berhasil dihapus\n`);

    // Delete only real schedules (keep templates)
    console.log('📅 Menghapus semua jadwal perjalanan (non-template)...');
    const deletedSchedules = await prisma.schedule.deleteMany({
      where: {
        isTemplate: false
      }
    });
    console.log(`✅ ${deletedSchedules.count} jadwal berhasil dihapus\n`);

    console.log('🎉 Selesai! Data berhasil dibersihkan.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
