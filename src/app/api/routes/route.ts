// src/app/api/routes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Route from '@/models/route.model';
import Stop from '@/models/stop.model';

/**
 * GET /api/routes
 * Lấy danh sách tất cả tuyến đường
 * 
 * Query params:
 *  - includeStops: có populate chi tiết stops không (true/false, mặc định: true)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const includeStops = searchParams.get('includeStops') !== 'false';

    // Lấy tất cả routes
    const routes: any[] = await Route.find().lean();

    if (!includeStops) {
      return NextResponse.json({
        success: true,
        count: routes.length,
        data: routes.map(route => ({
          routeId: route._id.toString(),
          name: route.name,
          department: route.department,
          arrival: route.arrival,
          time: route.time,
          stopCount: route.stops?.length || 0
        }))
      });
    }

    // Populate stop details
    const routesWithStops = await Promise.all(
      routes.map(async (route) => {
        const stopsWithDetails = await Promise.all(
          (route.stops || []).map(async (stopInfo: any) => {
            const stop: any = await Stop.findById(stopInfo.stopId).lean();
            return {
              stopId: stop?._id.toString(),
              name: stop?.name || 'Unknown',
              address: stop?.address,
              type: stop?.type,
              location: stop?.location,
              order: stopInfo.order,
              estimatedArrivalTime: stopInfo.estimatedArrivalTime
            };
          })
        );

        // Sắp xếp stops theo order
        stopsWithDetails.sort((a, b) => a.order - b.order);

        return {
          routeId: route._id.toString(),
          name: route.name,
          department: route.department,
          arrival: route.arrival,
          time: route.time,
          stops: stopsWithDetails,
          totalStops: stopsWithDetails.length,
          // Tính tổng thời gian ước tính
          estimatedDuration: calculateEstimatedDuration(stopsWithDetails)
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: routesWithStops.length,
      data: routesWithStops
    });

  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Tính tổng thời gian ước tính của route
 */
function calculateEstimatedDuration(stops: any[]): number {
  if (stops.length < 2) return 0;

  const firstTime = stops[0].estimatedArrivalTime;
  const lastTime = stops[stops.length - 1].estimatedArrivalTime;

  // Parse time string (format: "HH:MM")
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const firstMinutes = parseTime(firstTime);
  const lastMinutes = parseTime(lastTime);

  return lastMinutes - firstMinutes; // Trả về số phút
}
