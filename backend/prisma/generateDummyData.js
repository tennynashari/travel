const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Indonesian cities for routes
const cities = [
  { name: 'Jakarta', province: 'DKI Jakarta' },
  { name: 'Bandung', province: 'Jawa Barat' },
  { name: 'Surabaya', province: 'Jawa Timur' },
  { name: 'Yogyakarta', province: 'DI Yogyakarta' },
  { name: 'Solo', province: 'Jawa Tengah' },
  { name: 'Semarang', province: 'Jawa Tengah' },
  { name: 'Malang', province: 'Jawa Timur' },
  { name: 'Cirebon', province: 'Jawa Barat' },
  { name: 'Tasikmalaya', province: 'Jawa Barat' },
  { name: 'Purwokerto', province: 'Jawa Tengah' },
  { name: 'Tegal', province: 'Jawa Tengah' },
  { name: 'Bali', province: 'Bali' }
];

// Route configurations (origin -> destination)
const routeConfigs = [
  { origin: 'Jakarta', destination: 'Bandung', distance: 150, time: 180, basePrice: 50000 },
  { origin: 'Bandung', destination: 'Jakarta', distance: 150, time: 180, basePrice: 50000 },
  { origin: 'Jakarta', destination: 'Surabaya', distance: 800, time: 720, basePrice: 200000 },
  { origin: 'Surabaya', destination: 'Jakarta', distance: 800, time: 720, basePrice: 200000 },
  { origin: 'Bandung', destination: 'Yogyakarta', distance: 450, time: 480, basePrice: 120000 },
  { origin: 'Yogyakarta', destination: 'Bandung', distance: 450, time: 480, basePrice: 120000 },
  { origin: 'Yogyakarta', destination: 'Solo', distance: 65, time: 60, basePrice: 30000 },
  { origin: 'Solo', destination: 'Yogyakarta', distance: 65, time: 60, basePrice: 30000 },
  { origin: 'Semarang', destination: 'Jakarta', distance: 450, time: 420, basePrice: 110000 },
  { origin: 'Jakarta', destination: 'Semarang', distance: 450, time: 420, basePrice: 110000 },
  { origin: 'Surabaya', destination: 'Malang', distance: 90, time: 120, basePrice: 40000 },
  { origin: 'Malang', destination: 'Surabaya', distance: 90, time: 120, basePrice: 40000 },
  { origin: 'Jakarta', destination: 'Cirebon', distance: 250, time: 240, basePrice: 70000 },
  { origin: 'Cirebon', destination: 'Tasikmalaya', distance: 120, time: 150, basePrice: 45000 }
];

// Helper function to generate random date in past 6 months
function randomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

// Helper function to get random item from array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  console.log('🚀 Starting dummy data generation...\n');

  // 1. Create Cities
  console.log('📍 Creating cities...');
  const createdCities = [];
  for (const city of cities) {
    // Try to find existing city first
    let created = await prisma.city.findFirst({
      where: { name: city.name }
    });
    
    // If not found, create new one
    if (!created) {
      created = await prisma.city.create({
        data: city
      });
    }
    
    createdCities.push(created);
    console.log(`  ✓ ${city.name}, ${city.province}`);
  }
  console.log(`✅ Created ${createdCities.length} cities\n`);

  // 2. Create Routes
  console.log('🗺️  Creating routes...');
  const createdRoutes = [];
  const cityMap = {};
  createdCities.forEach(city => {
    cityMap[city.name] = city.id;
  });

  for (const config of routeConfigs) {
    const route = await prisma.route.create({
      data: {
        originCityId: cityMap[config.origin],
        destinationCityId: cityMap[config.destination],
        distance: config.distance,
        estimatedTime: config.time,
        basePrice: config.basePrice
      },
      include: {
        originCity: true,
        destinationCity: true
      }
    });
    createdRoutes.push(route);
    console.log(`  ✓ ${route.originCity.name} → ${route.destinationCity.name} (${route.distance}km)`);
  }
  console.log(`✅ Created ${createdRoutes.length} routes\n`);

  // 3. Get or Create Seat Template
  console.log('🪑 Getting/Creating seat template...');
  let seatTemplate = await prisma.seatTemplate.findFirst({
    where: { name: '2-2 Standard' }
  });
  
  if (!seatTemplate) {
    seatTemplate = await prisma.seatTemplate.create({
      data: {
        name: '2-2 Standard',
        description: 'Standard 40 seats configuration',
        rowsConfig: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        totalSeats: 40,
        isActive: true,
        isDefault: true
      }
    });
  }
  console.log(`✅ Seat template: ${seatTemplate.name}\n`);

  // 4. Create Vehicles
  console.log('🚐 Creating vehicles...');
  const vehicles = [];
  const plateNumbers = ['B 1234 ABC', 'B 5678 DEF', 'D 9012 GHI', 'AB 3456 JKL', 'L 7890 MNO'];
  
  for (let i = 0; i < plateNumbers.length; i++) {
    // Try to find existing vehicle first
    let vehicle = await prisma.vehicle.findFirst({
      where: { plateNumber: plateNumbers[i] }
    });
    
    // If not found, create new one
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          plateNumber: plateNumbers[i],
          vehicleType: 'Bus',
          capacity: 40,
          seatTemplateId: seatTemplate.id,
          status: 'ACTIVE'
        }
      });
    }
    
    vehicles.push(vehicle);
    console.log(`  ✓ ${vehicle.plateNumber}`);
  }
  console.log(`✅ Created ${vehicles.length} vehicles\n`);

  // 5. Create Driver Users and Drivers
  console.log('👨‍✈️ Creating drivers...');
  const drivers = [];
  const driverNames = ['Ahmad Driver', 'Budi Driver', 'Candra Driver', 'Dedi Driver', 'Eko Driver'];
  
  for (let i = 0; i < driverNames.length; i++) {
    const hashedPassword = await bcrypt.hash('driver123', 10);
    
    // Try to find existing user first
    let user = await prisma.user.findFirst({
      where: { email: `driver${i + 1}@travel.com` }
    });
    
    // If not found, create new one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `driver${i + 1}@travel.com`,
          password: hashedPassword,
          name: driverNames[i],
          phone: `08123456${i}00`,
          role: 'DRIVER'
        }
      });
    }

    // Try to find existing driver
    let driver = await prisma.driver.findFirst({
      where: { userId: user.id }
    });
    
    // If not found, create new one
    if (!driver) {
      driver = await prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber: `SIM-${1000 + i}`,
          status: 'ACTIVE'
        }
      });
    }
    
    drivers.push(driver);
    console.log(`  ✓ ${user.name} (${driver.licenseNumber})`);
  }
  console.log(`✅ Created ${drivers.length} drivers\n`);

  // 6. Create Customer Users
  console.log('👥 Creating customers...');
  const customers = [];
  const customerNames = [
    'John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis',
    'Diana Evans', 'Frank Garcia', 'Grace Harris', 'Henry Jackson', 'Ivy King',
    'Jack Lee', 'Kate Martin', 'Leo Nelson', 'Mia Oliver', 'Noah Parker'
  ];

  for (let i = 0; i < customerNames.length; i++) {
    const hashedPassword = await bcrypt.hash('customer123', 10);
    
    // Try to find existing user first
    let user = await prisma.user.findFirst({
      where: { email: `customer${i + 1}@email.com` }
    });
    
    // If not found, create new one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `customer${i + 1}@email.com`,
          password: hashedPassword,
          name: customerNames[i],
          phone: `08129876${i.toString().padStart(3, '0')}`,
          role: 'CUSTOMER'
        }
      });
    }
    
    customers.push(user);
  }
  console.log(`✅ Created ${customers.length} customers\n`);

  // 7. Create Schedules (past 6 months)
  console.log('📅 Creating schedules...');
  const schedules = [];
  const departureTimes = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
  
  // Create schedules for various dates in past 6 months
  for (let i = 0; i < 180; i += 2) { // Every 2 days
    for (const route of createdRoutes) {
      if (Math.random() > 0.3) { // 70% chance to create schedule
        const departureDate = new Date();
        departureDate.setDate(departureDate.getDate() - i);
        
        const schedule = await prisma.schedule.create({
          data: {
            routeId: route.id,
            vehicleId: randomItem(vehicles).id,
            driverId: randomItem(drivers).id,
            departureDate: departureDate,
            departureTime: randomItem(departureTimes),
            ticketPrice: route.basePrice,
            availableSeats: 40,
            isTemplate: false,
            recurringType: 'NONE',
            isActive: true
          }
        });
        schedules.push(schedule);
      }
    }
  }
  console.log(`✅ Created ${schedules.length} schedules\n`);

  // 8. Create Bookings (100+ bookings with varied dates)
  console.log('🎫 Creating bookings...');
  const bookings = [];
  const paymentMethods = ['CASH', 'TRANSFER', 'E_WALLET', 'QRIS'];
  const targetBookings = 105; // Create 100+ bookings

  for (let i = 0; i < targetBookings; i++) {
    const schedule = randomItem(schedules);
    const customer = randomItem(customers);
    const totalSeats = Math.floor(Math.random() * 4) + 1; // 1-4 seats
    
    // Generate seat numbers
    const seatNumbers = [];
    for (let j = 1; j <= totalSeats; j++) {
      seatNumbers.push(`A${Math.floor(Math.random() * 10) + 1}`);
    }

    // 90% bookings are PAID, 10% PENDING/CANCELLED
    const statusRandom = Math.random();
    const status = statusRandom > 0.9 ? 
      (statusRandom > 0.95 ? 'CANCELLED' : 'PENDING') : 
      'PAID';

    const createdAt = randomDate(180); // Random date in past 6 months
    const paidAt = status === 'PAID' ? new Date(createdAt.getTime() + Math.random() * 3600000) : null;

    try {
      const booking = await prisma.booking.create({
        data: {
          bookingCode: `BK-${Date.now()}-${i}`,
          userId: customer.id,
          scheduleId: schedule.id,
          seatNumbers: seatNumbers,
          totalSeats: totalSeats,
          totalPrice: schedule.ticketPrice * totalSeats,
          status: status,
          paymentMethod: status === 'PAID' ? randomItem(paymentMethods) : null,
          paidAt: paidAt,
          checkedIn: status === 'PAID' && Math.random() > 0.5,
          createdAt: createdAt,
          updatedAt: createdAt
        }
      });
      bookings.push(booking);

      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ Created ${i + 1} bookings...`);
      }
    } catch (error) {
      console.log(`  ⚠️  Skipped booking ${i + 1}: ${error.message}`);
    }
  }
  console.log(`✅ Created ${bookings.length} bookings\n`);

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Cities:     ${createdCities.length}`);
  console.log(`Routes:     ${createdRoutes.length}`);
  console.log(`Vehicles:   ${vehicles.length}`);
  console.log(`Drivers:    ${drivers.length}`);
  console.log(`Customers:  ${customers.length}`);
  console.log(`Schedules:  ${schedules.length}`);
  console.log(`Bookings:   ${bookings.length}`);
  console.log('═══════════════════════════════════════');
  
  // Booking status breakdown
  const paidCount = bookings.filter(b => b.status === 'PAID').length;
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length;
  
  console.log('\n📈 BOOKING STATUS:');
  console.log(`  PAID:      ${paidCount}`);
  console.log(`  PENDING:   ${pendingCount}`);
  console.log(`  CANCELLED: ${cancelledCount}`);
  console.log('═══════════════════════════════════════\n');
  
  console.log('✅ Dummy data generation completed!\n');
  console.log('🤖 You can now use AI Prediction feature:');
  console.log('   1. Go to Dashboard → AI Prediction');
  console.log('   2. Click "Fetch & Train" button');
  console.log('   3. Wait for training to complete');
  console.log('   4. Click "Predict" to see predictions\n');
}

main()
  .catch((e) => {
    console.error('❌ Error generating dummy data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
