import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusLocation from '@/models/busLocation.model';
import Trip from '@/models/trip.model';
import Route from '@/models/route.model';
import Stop from '@/models/stop.model';
import Bus from '@/models/bus.model';

const MAPBOX_TOKEN = 'pk.eyJ1IjoidGhhbmhoYW5kc29tZTA1MTIiLCJhIjoiY21oYzE1ajJlMTB4aDJpcHp4bGJqY2praiJ9.uxt5rLnd30BuQxh_9kEaqQ';

// Cache cho route geometries
const routeGeometryCache = new Map<string, any>();

/**
 * API giả lập GPS cho TẤT CẢ buses đang active
 * POST /api/buses/simulate-all
 * 
 * Xe sẽ chạy THEO ĐƯỜNG THỰC TẾ từ Mapbox Directions API
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Lấy TẤT CẢ trips đang active
    const trips: any[] = await Trip.find({
      status: { $in: ['in_progress', 'scheduled'] }
    })
    .populate('busId')
    .populate('routeId')
    .lean();

    if (trips.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active trips to simulate',
        updated: 0
      });
    }

    const results = [];

    for (const trip of trips) {
      try {
        const bus: any = trip.busId;
        const route: any = trip.routeId;

        if (!route || !route.stops || route.stops.length < 2) {
          console.log(`⚠️  Skipping trip ${trip._id}: Invalid route`);
          continue;
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

        const validStops = stops.filter(s => s !== null && s.location?.coordinates);
        validStops.sort((a, b) => a.order - b.order);

        if (validStops.length < 2) continue;

        // Lấy hoặc fetch route geometry từ Mapbox
        const routeKey = validStops.map(s => s._id).join('-');
        let routeGeometry = routeGeometryCache.get(routeKey);

        if (!routeGeometry) {
          // Gọi Mapbox Directions API
          const coordinates = validStops.map(s => 
            `${s.location.coordinates[0]},${s.location.coordinates[1]}`
          ).join(';');
          
          const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
          
          const response = await fetch(directionsUrl);
          const data = await response.json();

          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            routeGeometry = data.routes[0].geometry.coordinates; // Array of [lng, lat]
            routeGeometryCache.set(routeKey, routeGeometry);
            console.log(`📍 Fetched route geometry: ${routeGeometry.length} points`);
          } else {
            console.error(`❌ Mapbox API error for trip ${trip._id}`);
            continue;
          }
        }

        // ===== TÍNH TOÁN VỊ TRÍ DỰA TRÊN TỐC ĐỘ THỰC TẾ =====
        
        const AVERAGE_SPEED_KMH = 30; // Tốc độ trung bình 30 km/h
        const now = new Date();

        // Nếu trip chưa có actualStartTime, set nó = bây giờ (xe bắt đầu ngay)
        let tripStartTime: Date;
        if (!trip.actualStartTime) {
          tripStartTime = now;
          await Trip.findByIdAndUpdate(trip._id, { 
            actualStartTime: now,
            status: 'in_progress'
          });
          console.log(`🚀 Trip ${trip._id} started at ${now.toLocaleTimeString()}`);
        } else {
          tripStartTime = new Date(trip.actualStartTime);
        }

        // Tính tổng khoảng cách từ Mapbox API (đã có trong response)
        const totalDistanceKm = routeGeometry.length > 0 ? 
          calculateRouteDistance(routeGeometry) : 10; // fallback 10km
        
        // Tính tổng thời gian cần thiết (giờ)
        const totalTravelTimeHours = totalDistanceKm / AVERAGE_SPEED_KMH;
        const totalTravelTimeMs = totalTravelTimeHours * 60 * 60 * 1000; // milliseconds

        // Thời gian đã trôi qua kể từ khi bắt đầu
        const elapsedMs = now.getTime() - tripStartTime.getTime();
        
        let lat, lng, speed, heading;

        if (elapsedMs < 0) {
          // Chưa đến giờ khởi hành
          [lng, lat] = routeGeometry[0];
          speed = 0;
          heading = 0;
        } else if (elapsedMs > totalTravelTimeMs) {
          // Đã hoàn thành chuyến đi
          [lng, lat] = routeGeometry[routeGeometry.length - 1];
          speed = 0;
          heading = 0;
          
          // Cập nhật status = completed
          if (trip.status !== 'completed') {
            await Trip.findByIdAndUpdate(trip._id, {
              status: 'completed',
              actualEndTime: now
            });
            console.log(`✅ Trip ${trip._id} completed`);
          }
        } else {
          // Đang di chuyển
          const progressRatio = elapsedMs / totalTravelTimeMs;

          // Tìm điểm trên route geometry
          const targetIndex = Math.floor(progressRatio * (routeGeometry.length - 1));
          const nextIndex = Math.min(targetIndex + 1, routeGeometry.length - 1);

          // Interpolate giữa 2 điểm
          const [lng1, lat1] = routeGeometry[targetIndex];
          const [lng2, lat2] = routeGeometry[nextIndex];

          const segmentRatio = (progressRatio * (routeGeometry.length - 1)) % 1;
          lng = lng1 + (lng2 - lng1) * segmentRatio;
          lat = lat1 + (lat2 - lat1) * segmentRatio;

          // Tính speed và heading
          const distance = calculateDistance(lat1, lng1, lat2, lng2);
          const timeInHours = 1 / 60; // 1 phút = 1/60 giờ
          speed = distance > 0 ? Math.round(distance / timeInHours) : AVERAGE_SPEED_KMH;
          heading = calculateHeading(lat1, lng1, lat2, lng2);
          
          console.log(`🚌 Bus ${bus.plateNumber}: ${(progressRatio * 100).toFixed(1)}% complete, ${speed}km/h`);
        }

        // Update BusLocation
        await BusLocation.findOneAndUpdate(
          { busId: bus._id },
          {
            $set: {
              location: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              speed,
              heading,
              timestamp: new Date()
            }
          },
          { upsert: true }
        );

        results.push({
          plateNumber: bus.plateNumber,
          position: { latitude: lat, longitude: lng },
          speed,
          heading
        });

      } catch (error) {
        console.error(`Error simulating bus ${trip.busId}:`, error);
      }
    }

    console.log(`📍 Updated GPS for ${results.length} buses (following real roads)`);

    return NextResponse.json({
      success: true,
      updated: results.length,
      buses: results
    });

  } catch (error) {
    console.error('❌ Simulate all error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Tính tổng khoảng cách của một route geometry
function calculateRouteDistance(routeGeometry: number[][]): number {
  let totalDistance = 0;
  for (let i = 0; i < routeGeometry.length - 1; i++) {
    const [lng1, lat1] = routeGeometry[i];
    const [lng2, lat2] = routeGeometry[i + 1];
    totalDistance += calculateDistance(lat1, lng1, lat2, lng2);
  }
  return totalDistance;
}

// Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function calculateHeading(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const brng = Math.atan2(y, x);
  return ((brng * 180) / Math.PI + 360) % 360;
}
