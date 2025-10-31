// src/app/api/trips/active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Trip from '@/models/trip.model';
import Route from '@/models/route.model';
import Stop from '@/models/stop.model';
import Bus from '@/models/bus.model';
import Driver from '@/models/driver.model';
import { BusSimulationService } from '@/service/BusSimulationService';

/**
 * GET /api/trips/active
 * Lấy danh sách tất cả chuyến đi đang hoạt động với vị trí xe bus được tính toán
 * 
 * Query params:
 *  - date: ngày (YYYY-MM-DD, mặc định: hôm nay)
 *  - direction: 'departure' | 'arrival' (optional)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Ensure all models are registered
    const RouteModel = Route;
    const StopModel = Stop;
    const BusModel = Bus;
    const DriverModel = Driver;

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const direction = searchParams.get('direction') as 'departure' | 'arrival' | null;

    // Parse ngày
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Tìm các chuyến đi đang hoạt động
    const query: any = {
      tripDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['scheduled', 'in_progress'] },
    };

    if (direction) {
      query.direction = direction;
    }

    console.log('Fetching trips with query:', query);

    const trips: any[] = await Trip.find(query)
      .populate('routeId')
      .populate('busId')
      .lean();

    console.log(`Found ${trips.length} trips`);

    if (trips.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Tính vị trí cho từng chuyến đi
    const tripsWithPositions = await Promise.all(
      trips.map(async (trip, tripIndex) => {
        try {
          console.log(`Processing trip ${tripIndex + 1}/${trips.length}:`, trip._id);

          // Lấy thông tin route và stops
          const route: any = trip.routeId;
          if (!route) {
            console.error(`Trip ${trip._id} has no route`);
            return null;
          }

          if (!route.stops || route.stops.length < 2) {
            console.error(`Route ${route._id} has insufficient stops:`, route.stops?.length);
            return null;
          }

          // Populate stop details
          const stopsWithDetails = await Promise.all(
            route.stops.map(async (stopInfo: any) => {
              const stop: any = await Stop.findById(stopInfo.stopId).lean();
              if (!stop) {
                console.error(`Stop ${stopInfo.stopId} not found`);
                return null;
              }
              return {
                stopId: stop._id.toString(),
                name: stop.name,
                order: stopInfo.order,
                location: stop.location,
                estimatedArrivalTime: stopInfo.estimatedArrivalTime,
                dwellTime: 2, // 2 phút dừng mặc định
              };
            })
          );

          // Filter out null stops
          const validStops = stopsWithDetails.filter(s => s !== null);
          if (validStops.length < 2) {
            console.error(`Not enough valid stops for trip ${trip._id}`);
            return null;
          }

          // Tạo route object cho simulation
          const simulationRoute = {
            routeId: route._id.toString(),
            name: route.name,
            stops: validStops,
            averageSpeed: 30, // 30 km/h tốc độ trung bình (có thể lưu trong DB)
          };

          // Lấy thời gian khởi hành (thời gian của trạm đầu tiên)
          const departureTime = validStops[0].estimatedArrivalTime;

          // Tính vị trí hiện tại
          const currentPosition = BusSimulationService.calculateCurrentPosition(
            simulationRoute,
            departureTime,
            new Date()
          );

          if (!currentPosition) {
            console.error(`Could not calculate position for trip ${trip._id}`);
            return null;
          }

          const bus: any = trip.busId;
          if (!bus) {
            console.error(`Trip ${trip._id} has no bus`);
            return null;
          }

          return {
            tripId: trip._id.toString(),
            tripDate: trip.tripDate,
            direction: trip.direction,
            status: trip.status,
            route: {
              routeId: route._id.toString(),
              name: route.name,
              department: route.department,
              arrival: route.arrival,
            },
            bus: {
              busId: bus._id.toString(),
              plateNumber: bus.plateNumber,
              capacity: bus.capacity,
              status: bus.status,
            },
            position: {
              latitude: currentPosition.latitude,
              longitude: currentPosition.longitude,
              speed: currentPosition.currentSpeed,
              heading: currentPosition.heading,
            },
            nextStop: {
              stopId: currentPosition.nextStopId,
              name: currentPosition.nextStopName,
              distance: currentPosition.distanceToNextStop,
              estimatedTime: currentPosition.estimatedTimeToNextStop,
            },
            progress: currentPosition.progress,
            departureTime,
            stops: validStops.map((s: any) => ({
              stopId: s.stopId,
              name: s.name,
              order: s.order,
              location: s.location,
              estimatedArrivalTime: s.estimatedArrivalTime,
            })),
          };
        } catch (error) {
          console.error(`Error calculating position for trip ${trip._id}:`, error);
          return null;
        }
      })
    );

    // Filter out null values
    const validTrips = tripsWithPositions.filter((t) => t !== null);

    console.log(`Returning ${validTrips.length} valid trips`);

    return NextResponse.json({
      success: true,
      count: validTrips.length,
      currentTime: new Date().toISOString(),
      data: validTrips,
    });
  } catch (error) {
    console.error('Error fetching active trips:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
