import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusLocation from '@/models/busLocation.model';
import Trip from '@/models/trip.model';
import Route from '@/models/route.model';
import Stop from '@/models/stop.model';

/**
 * API giả lập GPS cho tài xế
 * POST /api/buses/simulate-gps
 * 
 * Tự động di chuyển xe bus dựa trên routes
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { busId } = body;

    if (!busId) {
      return NextResponse.json(
        { success: false, error: 'Missing busId' },
        { status: 400 }
      );
    }

    // Tìm trip đang active của bus này
    const trip: any = await Trip.findOne({
      busId,
      status: { $in: ['in_progress', 'scheduled'] }
    })
    .populate('routeId')
    .lean();

    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'No active trip found for this bus' },
        { status: 404 }
      );
    }

    const route: any = trip.routeId;
    if (!route || !route.stops || route.stops.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid route' },
        { status: 404 }
      );
    }

    // Lấy stops details
    const stops = await Promise.all(
      route.stops.map(async (stopInfo: any) => {
        const stop: any = await Stop.findById(stopInfo.stopId).lean();
        return {
          ...stop,
          estimatedTime: stopInfo.estimatedArrivalTime,
          order: stopInfo.order
        };
      })
    );

    const validStops = stops.filter(s => s !== null).sort((a, b) => a.order - b.order);

    // Tính vị trí dựa trên thời gian
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = validStops[0].estimatedTime.split(':').map(Number);
    const [endHour, endMin] = validStops[validStops.length - 1].estimatedTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    let currentLat, currentLng, speed = 0, heading = 0;

    if (currentMinutes < startMinutes) {
      // Chưa khởi hành - đứng ở điểm đầu
      currentLat = validStops[0].location.coordinates[1];
      currentLng = validStops[0].location.coordinates[0];
      speed = 0;
      heading = 0;
    } else if (currentMinutes >= endMinutes) {
      // Đã đến nơi - đứng ở điểm cuối
      currentLat = validStops[validStops.length - 1].location.coordinates[1];
      currentLng = validStops[validStops.length - 1].location.coordinates[0];
      speed = 0;
      heading = 0;
    } else {
      // Đang di chuyển - tìm segment hiện tại
      for (let i = 0; i < validStops.length - 1; i++) {
        const [h1, m1] = validStops[i].estimatedTime.split(':').map(Number);
        const [h2, m2] = validStops[i + 1].estimatedTime.split(':').map(Number);
        const t1 = h1 * 60 + m1;
        const t2 = h2 * 60 + m2;

        if (currentMinutes >= t1 && currentMinutes < t2) {
          const ratio = (currentMinutes - t1) / (t2 - t1);
          
          const lat1 = validStops[i].location.coordinates[1];
          const lng1 = validStops[i].location.coordinates[0];
          const lat2 = validStops[i + 1].location.coordinates[1];
          const lng2 = validStops[i + 1].location.coordinates[0];

          // Nội suy vị trí
          currentLat = lat1 + (lat2 - lat1) * ratio;
          currentLng = lng1 + (lng2 - lng1) * ratio;

          // Tính tốc độ (30-50 km/h)
          const distance = calculateDistance(lat1, lng1, lat2, lng2);
          const segmentTime = (t2 - t1) / 60; // hours
          speed = Math.round((distance / segmentTime) * (0.8 + Math.random() * 0.4));
          speed = Math.min(speed, 60);

          // Tính heading
          heading = calculateHeading(lat1, lng1, lat2, lng2);
          break;
        }
      }
    }

    // Cập nhật BusLocation
    await BusLocation.findOneAndUpdate(
      { busId },
      {
        busId,
        location: {
          type: 'Point',
          coordinates: [currentLng, currentLat]
        },
        speed: Math.max(0, speed),
        heading: heading % 360,
        timestamp: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'GPS simulated successfully',
      data: {
        latitude: currentLat,
        longitude: currentLng,
        speed,
        heading,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error simulating GPS:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Tính khoảng cách (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Tính heading
function calculateHeading(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let heading = Math.atan2(y, x) * 180 / Math.PI;
  heading = (heading + 360) % 360;
  
  return Math.round(heading);
}
