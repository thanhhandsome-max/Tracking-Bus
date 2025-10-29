import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusLocation from '@/models/busLocation.model';
import Bus from '@/models/bus.model';
import Route from '@/models/route.model';

/**
 * API đơn giản - Lấy vị trí xe bus theo thời gian thực
 * Không phụ thuộc vào ngày tháng, chỉ lấy vị trí hiện tại từ BusLocation
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    console.log('🚌 Fetching real-time bus locations...');

    // Lấy vị trí mới nhất của tất cả xe bus
    const busLocations = await BusLocation.find({})
      .sort({ timestamp: -1 })
      .populate('busId')
      .limit(10)
      .lean();

    console.log(`Found ${busLocations.length} bus locations`);

    if (busLocations.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
        message: 'Không có xe bus nào đang hoạt động'
      });
    }

    // Group by busId to get latest location for each bus
    const latestLocations = new Map();
    for (const loc of busLocations) {
      const busId = loc.busId._id.toString();
      if (!latestLocations.has(busId)) {
        latestLocations.set(busId, loc);
      }
    }

    // Convert to trips format
    const trips = Array.from(latestLocations.values()).map((loc: any, index: number) => {
      const bus = loc.busId;
      
      return {
        tripId: `trip-${bus._id}`,
        tripDate: loc.timestamp,
        direction: index % 2 === 0 ? 'departure' : 'arrival',
        status: 'in_progress',
        route: {
          routeId: `route-${index + 1}`,
          name: `Tuyến ${index + 1}`,
          department: 'Điểm đón',
          arrival: 'Trường học',
        },
        bus: {
          busId: bus._id.toString(),
          plateNumber: bus.plateNumber,
          capacity: bus.capacity,
          status: bus.status,
        },
        position: {
          latitude: loc.location.coordinates[1],
          longitude: loc.location.coordinates[0],
          speed: loc.speed || 30,
          heading: loc.heading || 0,
        },
        nextStop: {
          stopId: 'next-stop',
          name: 'Trạm kế tiếp',
          distance: Math.random() * 3 + 0.5,
          estimatedTime: Math.floor(Math.random() * 10) + 5,
        },
        progress: 30 + Math.random() * 40,
        departureTime: new Date(loc.timestamp).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };
    });

    console.log(`✅ Returning ${trips.length} active trips`);

    return NextResponse.json({
      success: true,
      count: trips.length,
      currentTime: new Date().toISOString(),
      data: trips,
    });
  } catch (error) {
    console.error('❌ Error fetching bus locations:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Không thể lấy dữ liệu xe bus',
        message: error instanceof Error ? error.message : 'Lỗi không xác định'
      },
      { status: 500 }
    );
  }
}
