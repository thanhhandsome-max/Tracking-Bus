// src/app/api/trips/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Trip from '@/models/trip.model';
import Route from '@/models/route.model';
import Bus from '@/models/bus.model';
import Driver from '@/models/driver.model';
import Parent from '@/models/parent.model';
import Student from '@/models/student.model';

/**
 * GET /api/trips/history
 * Lấy lịch sử các chuyến đi đã hoàn thành
 * 
 * Query params:
 *  - userId: ID của user (bắt buộc)
 *  - startDate: ngày bắt đầu (YYYY-MM-DD, optional)
 *  - endDate: ngày kết thúc (YYYY-MM-DD, optional)
 *  - limit: số lượng chuyến đi (mặc định: 30)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Tìm parent và students
    const parent: any = await Parent.findOne({ userId }).lean();
    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    const students: any[] = await Student.find({ parentId: parent._id }).lean();
    const studentIds = students.map(s => s._id);

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Build query
    const query: any = {
      studentIds: { $in: studentIds },
      status: { $in: ['completed', 'cancelled'] }
    };

    // Thêm filter theo ngày nếu có
    if (startDate || endDate) {
      query.tripDate = {};
      if (startDate) {
        query.tripDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.tripDate.$lte = end;
      }
    }

    // Lấy trips
    const trips: any[] = await Trip
      .find(query)
      .sort({ tripDate: -1, createdAt: -1 })
      .limit(limit)
      .populate('routeId')
      .populate('busId')
      .populate('driverId')
      .populate({
        path: 'stopDetails.stopId',
        model: 'Stop'
      })
      .lean();

    // Format dữ liệu
    const formattedTrips = trips.map(trip => {
      const route: any = trip.routeId;
      const bus: any = trip.busId;
      const driver: any = trip.driverId;

      // Tính thời gian thực tế của chuyến đi
      let actualDuration = null;
      if (trip.actualStartTime && trip.actualEndTime) {
        const durationMs = new Date(trip.actualEndTime).getTime() - new Date(trip.actualStartTime).getTime();
        actualDuration = Math.round(durationMs / 60000); // Chuyển sang phút
      }

      // Chi tiết các điểm dừng
      const stops = trip.stopDetails.map((sd: any) => {
        const stop = sd.stopId;
        return {
          name: stop?.name || 'Unknown',
          order: sd.order,
          estimatedArrivalTime: sd.estimatedArrivalTime,
          actualArrivalTime: sd.actualArrivalTime,
          actualDepartureTime: sd.actualDepartureTime,
          studentsPickedUp: sd.studentsPickedUp?.length || 0,
          studentsDroppedOff: sd.studentsDroppedOff?.length || 0
        };
      });

      return {
        tripId: (trip._id as any).toString(),
        tripDate: trip.tripDate,
        direction: trip.direction,
        status: trip.status,
        route: {
          name: route.name,
          department: route.department,
          arrival: route.arrival
        },
        bus: {
          plateNumber: bus.plateNumber,
          capacity: bus.capacity
        },
        driver: {
          name: driver.name,
          phone: driver.phone
        },
        actualStartTime: trip.actualStartTime,
        actualEndTime: trip.actualEndTime,
        actualDuration, // Thời gian thực tế (phút)
        stops
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedTrips.length,
      data: formattedTrips
    });

  } catch (error) {
    console.error('Error fetching trip history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
