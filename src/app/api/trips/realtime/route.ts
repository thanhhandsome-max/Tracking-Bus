import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Trip from '@/models/trip.model';
import Route from '@/models/route.model';
import Stop from '@/models/stop.model';
import Bus from '@/models/bus.model';
import BusLocation from '@/models/busLocation.model';

/**
 * API: Theo dõi xe bus THẬT từ database
 * 
 * Logic:
 * 1. Lấy trips đang active từ DB
 * 2. Lấy vị trí xe THẬT từ buslocations collection (do tài xế cập nhật)
 * 3. Lấy thông tin tuyến đường, trạm dừng từ DB
 * 4. Trả về dữ liệu để vẽ lên map
 * 
 * Query params:
 * - studentId: Lọc chỉ hiển thị chuyến có học sinh này (PARENT)
 * - plateNumber: Lọc chỉ hiển thị xe có biển số này (DRIVER)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Ensure models loaded
    const _r = Route;
    const _s = Stop;
    const _b = Bus;
    const _bl = BusLocation;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const plateNumber = searchParams.get('plateNumber');

    console.log('🚌 Fetching active trips from database...');
    if (studentId) console.log(`   👨‍👩‍👧 Filter: studentId=${studentId}`);
    if (plateNumber) console.log(`   🚗 Filter: plateNumber=${plateNumber}`);

    // Lấy trips đang active
    const trips: any[] = await Trip.find({
      status: { $in: ['scheduled', 'in_progress', 'active'] }
    })
    .populate('routeId')
    .populate('busId')
    .lean();

    console.log(`Found ${trips.length} active trips`);

    if (trips.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Xử lý từng trip
    const processedTrips = await Promise.all(
      trips.map(async (trip) => {
        try {
          const route: any = trip.routeId;
          const bus: any = trip.busId;

          if (!route || !bus) return null;

          // ===== FILTER THEO ROLE =====
          // Parent: Chỉ xem trips có con mình
          if (studentId) {
            const hasStudent = trip.studentIds.some((id: any) => 
              id.toString() === studentId
            );
            if (!hasStudent) {
              console.log(`  ⏭️  Skip trip ${trip._id}: student ${studentId} not in this trip`);
              return null;
            }
          }

          // Driver: Chỉ xem trips của xe mình
          if (plateNumber) {
            if (bus.plateNumber !== plateNumber) {
              console.log(`  ⏭️  Skip trip ${trip._id}: bus ${bus.plateNumber} !== ${plateNumber}`);
              return null;
            }
          }

          // Lấy stops
          if (!route.stops || route.stops.length < 2) return null;

          const stops = await Promise.all(
            route.stops.map(async (stopInfo: any) => {
              const stop: any = await Stop.findById(stopInfo.stopId).lean();
              if (!stop) return null;
              
              return {
                stopId: stop._id.toString(),
                name: stop.name,
                order: stopInfo.order,
                location: {
                  coordinates: stop.location.coordinates, // [lng, lat]
                },
                latitude: stop.location.coordinates[1],
                longitude: stop.location.coordinates[0],
                estimatedTime: stopInfo.estimatedArrivalTime, // "06:30"
              };
            })
          );

          const validStops = stops.filter(s => s !== null);
          if (validStops.length < 2) return null;

          // Sắp xếp stops theo order
          validStops.sort((a, b) => a.order - b.order);

          // ===== LẤY VỊ TRÍ XE THẬT TỪ BUSLOCATION =====
          const busLocation: any = await BusLocation.findOne({ busId: bus._id })
            .sort({ timestamp: -1 })
            .lean();

          let currentLat, currentLng, speed = 0, heading = 0;
          
          if (busLocation && busLocation.location && busLocation.location.coordinates) {
            // Có vị trí GPS thật từ tài xế
            currentLng = busLocation.location.coordinates[0];
            currentLat = busLocation.location.coordinates[1];
            speed = busLocation.speed || 0;
            heading = busLocation.heading || 0;
            console.log(`  📍 Bus ${bus.plateNumber}: Real GPS [${currentLat}, ${currentLng}] @ ${speed}km/h`);
          } else {
            // Không có dữ liệu GPS → mặc định ở trạm đầu
            currentLat = validStops[0].latitude;
            currentLng = validStops[0].longitude;
            speed = 0;
            heading = 0;
            console.log(`  ⚠️  Bus ${bus.plateNumber}: No GPS data, using first stop`);
          }

          // Tính tiến độ dựa trên vị trí (optional - có thể bỏ nếu không cần)
          let progress = 0;
          let currentStopIndex = 0;
          
          // Tìm trạm gần nhất với vị trí hiện tại
          let minDistance = Infinity;
          for (let i = 0; i < validStops.length; i++) {
            const distance = Math.sqrt(
              Math.pow(validStops[i].latitude - currentLat, 2) +
              Math.pow(validStops[i].longitude - currentLng, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              currentStopIndex = i;
            }
          }
          
          progress = (currentStopIndex / (validStops.length - 1)) * 100;

          const nextStopIndex = Math.min(currentStopIndex + 1, validStops.length - 1);

          return {
            tripId: trip._id.toString(),
            direction: trip.direction,
            status: trip.status,
            route: {
              name: route.name,
              from: route.department,
              to: route.arrival,
            },
            bus: {
              plateNumber: bus.plateNumber,
              capacity: bus.capacity,
            },
            position: {
              latitude: currentLat,
              longitude: currentLng,
              speed: speed,
              heading: heading,
            },
            progress: Math.round(progress * 10) / 10,
            currentStop: validStops[currentStopIndex],
            nextStop: validStops[nextStopIndex],
            stops: validStops,
            studentCount: trip.studentIds.length,
            departureTime: validStops[0].estimatedTime,
            arrivalTime: validStops[validStops.length - 1].estimatedTime,
            lastUpdate: busLocation?.timestamp || new Date(),
          };
        } catch (err) {
          console.error('Error processing trip:', err);
          return null;
        }
      })
    );

    const validTrips = processedTrips.filter(t => t !== null);

    console.log(`✅ Returning ${validTrips.length} valid trips`);

    return NextResponse.json({
      success: true,
      count: validTrips.length,
      currentTime: new Date().toLocaleTimeString('vi-VN'),
      data: validTrips,
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
