// scripts/clear-and-seed-real-routes.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolbus';

// Real addresses in Ho Chi Minh City
const REAL_LOCATIONS = {
  // Ví dụ điểm xuất phát - Quận 1
  START_POINT: {
    name: 'Nhà Thờ Đức Bà',
    address: '01 Công xã Paris, Bến Nghé, Quận 1, TP.HCM',
    coordinates: [106.699092, 10.779384] // [lng, lat]
  },
  
  // Đại học Sài Gòn - Các cơ sở
  SGU_CS1: {
    name: 'ĐH Sài Gòn - Cơ sở 1',
    address: '273 An Dương Vương, Phường 3, Quận 5, TP.HCM',
    coordinates: [106.675889, 10.755831]
  },
  
  SGU_CS2: {
    name: 'ĐH Sài Gòn - Cơ sở 2', 
    address: '67/68 Nguyễn Văn Quá, Đông Hưng Thuận, Quận 12, TP.HCM',
    coordinates: [106.652778, 10.851389]
  },
  
  SGU_CS3: {
    name: 'ĐH Sài Gòn - Cơ sở 3',
    address: 'Tổ 10, Ấp Xuân Thới Thượng, Hóc Môn, TP.HCM',
    coordinates: [106.591667, 10.883333]
  },
  
  // Các điểm trung gian
  PICKUP_1: {
    name: 'Bến xe Miền Tây',
    address: '395 Kinh Dương Vương, An Lạc, Bình Tân, TP.HCM',
    coordinates: [106.620278, 10.739167]
  },
  
  PICKUP_2: {
    name: 'Chợ Bình Tây',
    address: '57 Tháp Mười, Phường 2, Quận 6, TP.HCM',
    coordinates: [106.643333, 10.752222]
  }
};

async function clearAndSeedRealData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db!;

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('parents').deleteMany({});
    await db.collection('students').deleteMany({});
    await db.collection('drivers').deleteMany({});
    await db.collection('buses').deleteMany({});
    await db.collection('routes').deleteMany({});
    await db.collection('stops').deleteMany({});
    await db.collection('trips').deleteMany({});
    await db.collection('buslocations').deleteMany({});
    console.log('✅ Cleared all collections');

    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create users
    console.log('\n👥 Creating users...');
    const users = await db.collection('users').insertMany([
      {
        email: 'parent1@example.com',
        password: hashedPassword,
        name: 'Nguyễn Văn A',
        phone: '0901234567',
        role: 'parent',
        createdAt: new Date()
      },
      {
        email: 'driver1@schoolbus.com',
        password: hashedPassword,
        name: 'Trần Văn Tài',
        phone: '0912345678',
        role: 'driver',
        licenseNumber: 'B1-123456',
        createdAt: new Date()
      },
      {
        email: 'driver2@schoolbus.com',
        password: hashedPassword,
        name: 'Lê Văn Sơn',
        phone: '0923456789',
        role: 'driver',
        licenseNumber: 'B2-234567',
        createdAt: new Date()
      }
    ]);
    console.log('✅ Created users');

    const userIds = Object.values(users.insertedIds);

    // Create drivers
    const drivers = await db.collection('drivers').insertMany([
      {
        userId: userIds[1], // driver1@schoolbus.com
        name: 'Trần Văn Tài',
        email: 'driver1@schoolbus.com',
        phone: '0912345678',
        licenseNumber: 'B1-123456',
        busId: null, // Sẽ update sau
        createdAt: new Date()
      },
      {
        userId: userIds[2], // driver2@schoolbus.com
        name: 'Lê Văn Sơn',
        email: 'driver2@schoolbus.com',
        phone: '0923456789',
        licenseNumber: 'B2-234567',
        busId: null, // Sẽ update sau
        createdAt: new Date()
      }
    ]);
    console.log('✅ Created drivers');

    // Create parents
    const parents = await db.collection('parents').insertMany([
      {
        userId: userIds[0],
        name: 'Nguyễn Văn A',
        email: 'parent1@example.com',
        phone: '0901234567',
        address: 'Quận 1, TP.HCM',
        studentIds: [],
        createdAt: new Date()
      }
    ]);

    // Create students
    const students = await db.collection('students').insertMany([
      {
        name: 'Nguyễn Minh An',
        parentId: parents.insertedIds[0],
        grade: '10A1',
        school: 'Đại học Sài Gòn',
        address: REAL_LOCATIONS.START_POINT.address,
        pickupLocation: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.START_POINT.coordinates
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.SGU_CS1.coordinates
        },
        createdAt: new Date()
      },
      {
        name: 'Nguyễn Minh Bảo',
        parentId: parents.insertedIds[0],
        grade: '11B2',
        school: 'Đại học Sài Gòn',
        address: REAL_LOCATIONS.PICKUP_1.address,
        pickupLocation: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.PICKUP_1.coordinates
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.SGU_CS2.coordinates
        },
        createdAt: new Date()
      }
    ]);
    console.log('✅ Created students');

    // Update parent with studentIds
    await db.collection('parents').updateOne(
      { _id: parents.insertedIds[0] },
      { $set: { studentIds: Object.values(students.insertedIds) } }
    );

    // Create buses
    const buses = await db.collection('buses').insertMany([
      {
        plateNumber: '51B-123.45',
        capacity: 29,
        status: 'active',
        driverId: userIds[1],
        createdAt: new Date()
      },
      {
        plateNumber: '51B-678.90',
        capacity: 35,
        status: 'active',
        driverId: userIds[2],
        createdAt: new Date()
      }
    ]);
    console.log('✅ Created buses');

    // Update drivers with busId
    await db.collection('drivers').updateOne(
      { userId: userIds[1] },
      { $set: { busId: buses.insertedIds[0] } }
    );
    await db.collection('drivers').updateOne(
      { userId: userIds[2] },
      { $set: { busId: buses.insertedIds[1] } }
    );
    console.log('✅ Updated drivers with bus assignments');

    // Create routes with REAL addresses
    console.log('\n🗺️  Creating routes with real addresses...');
    
    // Helper function to generate times relative to now
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const makeTime = (offsetMinutes: number) => {
      const totalMinutes = currentMinutes + offsetMinutes;
      const hours = Math.floor(totalMinutes / 60) % 24;
      const mins = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    
    console.log(`  📅 Current time: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
    console.log(`  📅 Route 1 will run: ${makeTime(-5)} to ${makeTime(25)}`);
    console.log(`  📅 Route 2 will run: ${makeTime(-5)} to ${makeTime(40)}`);
    
    // Route 1: Nhà Thờ Đức Bà → ĐH Sài Gòn Cơ sở 1
    const route1Stops = await db.collection('stops').insertMany([
      {
        name: REAL_LOCATIONS.START_POINT.name,
        address: REAL_LOCATIONS.START_POINT.address,
        location: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.START_POINT.coordinates
        },
        order: 1,
        type: 'pickup',
        estimatedTime: makeTime(-5), // Started 5 minutes ago
        createdAt: new Date()
      },
      {
        name: REAL_LOCATIONS.PICKUP_2.name,
        address: REAL_LOCATIONS.PICKUP_2.address,
        location: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.PICKUP_2.coordinates
        },
        order: 2,
        type: 'pickup',
        estimatedTime: makeTime(10), // 10 minutes from now
        createdAt: new Date()
      },
      {
        name: REAL_LOCATIONS.SGU_CS1.name,
        address: REAL_LOCATIONS.SGU_CS1.address,
        location: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.SGU_CS1.coordinates
        },
        order: 3,
        type: 'dropoff',
        estimatedTime: makeTime(25), // 25 minutes from now
        createdAt: new Date()
      }
    ]);

    const route1 = await db.collection('routes').insertOne({
      name: 'Tuyến 1 - Quận 1 → ĐH Sài Gòn CS1',
      department: REAL_LOCATIONS.START_POINT.name,
      arrival: REAL_LOCATIONS.SGU_CS1.name,
      time: makeTime(-5), // Thời gian khởi hành
      stopIds: Object.values(route1Stops.insertedIds),
      stops: [
        {
          stopId: route1Stops.insertedIds[0],
          order: 1,
          estimatedArrivalTime: makeTime(-5)
        },
        {
          stopId: route1Stops.insertedIds[1],
          order: 2,
          estimatedArrivalTime: makeTime(10)
        },
        {
          stopId: route1Stops.insertedIds[2],
          order: 3,
          estimatedArrivalTime: makeTime(25)
        }
      ],
      distance: 5.2, // km
      estimatedDuration: 30, // minutes
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Route 2: Bến xe Miền Tây → ĐH Sài Gòn Cơ sở 2
    const route2Stops = await db.collection('stops').insertMany([
      {
        name: REAL_LOCATIONS.PICKUP_1.name,
        address: REAL_LOCATIONS.PICKUP_1.address,
        location: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.PICKUP_1.coordinates
        },
        order: 1,
        type: 'pickup',
        estimatedTime: makeTime(-5), // Started 5 minutes ago
        createdAt: new Date()
      },
      {
        name: 'Bệnh viện Nhi Đồng 1',
        address: '341 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',
        location: {
          type: 'Point',
          coordinates: [106.664722, 10.774444]
        },
        order: 2,
        type: 'pickup',
        estimatedTime: makeTime(15), // 15 minutes from now
        createdAt: new Date()
      },
      {
        name: REAL_LOCATIONS.SGU_CS2.name,
        address: REAL_LOCATIONS.SGU_CS2.address,
        location: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.SGU_CS2.coordinates
        },
        order: 3,
        type: 'dropoff',
        estimatedTime: makeTime(40), // 40 minutes from now
        createdAt: new Date()
      }
    ]);

    const route2 = await db.collection('routes').insertOne({
      name: 'Tuyến 2 - Bình Tân → ĐH Sài Gòn CS2',
      department: REAL_LOCATIONS.PICKUP_1.name,
      arrival: REAL_LOCATIONS.SGU_CS2.name,
      time: makeTime(-5), // Thời gian khởi hành
      stopIds: Object.values(route2Stops.insertedIds),
      stops: [
        {
          stopId: route2Stops.insertedIds[0],
          order: 1,
          estimatedArrivalTime: makeTime(-5)
        },
        {
          stopId: route2Stops.insertedIds[1],
          order: 2,
          estimatedArrivalTime: makeTime(15)
        },
        {
          stopId: route2Stops.insertedIds[2],
          order: 3,
          estimatedArrivalTime: makeTime(40)
        }
      ],
      distance: 12.5,
      estimatedDuration: 45,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Created routes with real addresses');

    // Create trips for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trips = await db.collection('trips').insertMany([
      {
        routeId: route1.insertedId,
        busId: buses.insertedIds[0],
        driverId: userIds[1],
        tripDate: today,
        direction: 'departure',
        departureTime: '06:30',
        status: 'in_progress', // Đang di chuyển
        studentIds: [students.insertedIds[0]],
        stopDetails: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        routeId: route2.insertedId,
        busId: buses.insertedIds[1],
        driverId: userIds[2],
        tripDate: today,
        direction: 'departure',
        departureTime: '06:30',
        status: 'in_progress', // Đang di chuyển
        studentIds: [students.insertedIds[1]],
        stopDetails: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Created trips');

    // Create initial bus locations
    await db.collection('buslocations').insertMany([
      {
        busId: buses.insertedIds[0],
        location: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.START_POINT.coordinates
        },
        speed: 0,
        heading: 0,
        timestamp: new Date(),
        createdAt: new Date()
      },
      {
        busId: buses.insertedIds[1],
        location: {
          type: 'Point',
          coordinates: REAL_LOCATIONS.PICKUP_1.coordinates
        },
        speed: 0,
        heading: 0,
        timestamp: new Date(),
        createdAt: new Date()
      }
    ]);
    console.log('✅ Created bus locations');

    console.log('\n✅ Database seeded successfully with REAL addresses!');
    console.log('\n📍 Routes created:');
    console.log(`1. ${REAL_LOCATIONS.START_POINT.name} → ${REAL_LOCATIONS.SGU_CS1.name}`);
    console.log(`2. ${REAL_LOCATIONS.PICKUP_1.name} → ${REAL_LOCATIONS.SGU_CS2.name}`);
    console.log('\n🔐 Test accounts:');
    console.log('Parent: parent1@example.com / 123456');
    console.log('Driver 1: driver1@schoolbus.com / 123456');
    console.log('Driver 2: driver2@schoolbus.com / 123456');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

clearAndSeedRealData();
