const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create users
  console.log('Creating users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@travel.com' },
    update: {},
    create: {
      email: 'admin@travel.com',
      password: hashedPassword,
      name: 'Admin Travel',
      phone: '081234567890',
      role: 'ADMIN'
    }
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@travel.com' },
    update: {},
    create: {
      email: 'operator@travel.com',
      password: hashedPassword,
      name: 'Operator Travel',
      phone: '081234567891',
      role: 'OPERATOR'
    }
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@travel.com' },
    update: {},
    create: {
      email: 'driver@travel.com',
      password: hashedPassword,
      name: 'Driver Budi',
      phone: '081234567892',
      role: 'DRIVER'
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@travel.com' },
    update: {},
    create: {
      email: 'customer@travel.com',
      password: hashedPassword,
      name: 'Customer Test',
      phone: '081234567893',
      role: 'CUSTOMER'
    }
  });

  console.log('✅ Users created');

  // Create cities
  console.log('Creating cities...');

  const jakarta = await prisma.city.upsert({
    where: { id: 'jakarta-id' },
    update: {},
    create: {
      id: 'jakarta-id',
      name: 'Jakarta',
      province: 'DKI Jakarta'
    }
  });

  const bandung = await prisma.city.upsert({
    where: { id: 'bandung-id' },
    update: {},
    create: {
      id: 'bandung-id',
      name: 'Bandung',
      province: 'Jawa Barat'
    }
  });

  const surabaya = await prisma.city.upsert({
    where: { id: 'surabaya-id' },
    update: {},
    create: {
      id: 'surabaya-id',
      name: 'Surabaya',
      province: 'Jawa Timur'
    }
  });

  const yogyakarta = await prisma.city.upsert({
    where: { id: 'yogyakarta-id' },
    update: {},
    create: {
      id: 'yogyakarta-id',
      name: 'Yogyakarta',
      province: 'DI Yogyakarta'
    }
  });

  console.log('✅ Cities created');

  // Create routes
  console.log('Creating routes...');

  const route1 = await prisma.route.create({
    data: {
      originCityId: jakarta.id,
      destinationCityId: bandung.id,
      distance: 150,
      estimatedTime: 180, // 3 hours
      basePrice: 100000
    }
  });

  const route2 = await prisma.route.create({
    data: {
      originCityId: jakarta.id,
      destinationCityId: surabaya.id,
      distance: 800,
      estimatedTime: 720, // 12 hours
      basePrice: 300000
    }
  });

  const route3 = await prisma.route.create({
    data: {
      originCityId: bandung.id,
      destinationCityId: yogyakarta.id,
      distance: 400,
      estimatedTime: 480, // 8 hours
      basePrice: 200000
    }
  });

  console.log('✅ Routes created');

  // Create vehicles
  console.log('Creating vehicles...');

  const vehicle1 = await prisma.vehicle.create({
    data: {
      plateNumber: 'B-1234-XYZ',
      vehicleType: 'Hiace',
      capacity: 14,
      status: 'ACTIVE'
    }
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      plateNumber: 'B-5678-ABC',
      vehicleType: 'Elf',
      capacity: 16,
      status: 'ACTIVE'
    }
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      plateNumber: 'AB-9999-CD',
      vehicleType: 'Avanza',
      capacity: 7,
      status: 'MAINTENANCE'
    }
  });

  console.log('✅ Vehicles created');

  // Create driver
  console.log('Creating driver...');

  const driver = await prisma.driver.create({
    data: {
      userId: driverUser.id,
      licenseNumber: 'SIM-123456789',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Driver created');

  // Create schedules
  console.log('Creating schedules...');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const schedule1 = await prisma.schedule.create({
    data: {
      routeId: route1.id,
      vehicleId: vehicle1.id,
      driverId: driver.id,
      departureDate: tomorrow,
      departureTime: '08:00',
      ticketPrice: 120000,
      availableSeats: 14
    }
  });

  const schedule2 = await prisma.schedule.create({
    data: {
      routeId: route2.id,
      vehicleId: vehicle2.id,
      driverId: driver.id,
      departureDate: tomorrow,
      departureTime: '20:00',
      ticketPrice: 350000,
      availableSeats: 16
    }
  });

  console.log('✅ Schedules created');

  // Create sample booking
  console.log('Creating sample booking...');

  const booking = await prisma.booking.create({
    data: {
      bookingCode: 'BK-' + Date.now(),
      userId: customer.id,
      scheduleId: schedule1.id,
      seatNumbers: ['A1', 'A2'],
      totalSeats: 2,
      totalPrice: 240000,
      status: 'PAID',
      paymentMethod: 'Transfer Bank',
      paidAt: new Date()
    }
  });

  console.log('✅ Sample booking created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📧 Default users:');
  console.log('Admin: admin@travel.com / password123');
  console.log('Operator: operator@travel.com / password123');
  console.log('Driver: driver@travel.com / password123');
  console.log('Customer: customer@travel.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
