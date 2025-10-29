// src/app/api/buses/active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusLocation from '@/models/busLocation.model';
import Bus from '@/models/bus.model';
import Trip from '@/models/trip.model';

/**
 * GET /api/buses/active
 * Lấy danh sách tất cả xe bus đang hoạt động với vị trí hiện tại
 * Optional query params:
 *  - tripId: lọc theo chuyến đi cụ thể
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    let busIds: string[] = [];

    if (tripId) {
      // Lấy xe bus từ chuyến đi cụ thể
      const trip: any = await Trip.findById(tripId).select('busId').lean();
      if (!trip) {
        return NextResponse.json(
          { error: 'Trip not found' },
          { status: 404 }
        );
      }
      busIds = [trip.busId.toString()];
    } else {
      // Lấy tất cả xe bus đang active
      const activeBuses = await Bus.find({ status: 'active' }).select('_id').lean();
      busIds = activeBuses.map((bus: any) => bus._id.toString());
    }

    if (busIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Lấy vị trí mới nhất của mỗi xe bus
    // Sử dụng aggregation để tối ưu hiệu suất
    const latestLocations = await BusLocation.aggregate([
      {
        $match: {
          busId: { $in: busIds.map((id) => id) },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: '$busId',
          latestLocation: { $first: '$$ROOT' },
        },
      },
    ]);

    // Populate bus information
    const busesWithLocations = await Promise.all(
      latestLocations.map(async (item: any) => {
        const bus: any = await Bus.findById(item._id).lean();
        return {
          busId: item._id,
          bus: {
            plateNumber: bus?.plateNumber,
            capacity: bus?.capacity,
            status: bus?.status,
          },
          location: item.latestLocation.location,
          speed: item.latestLocation.speed,
          timestamp: item.latestLocation.timestamp,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: busesWithLocations.length,
      data: busesWithLocations,
    });
  } catch (error) {
    console.error('Error fetching active buses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
