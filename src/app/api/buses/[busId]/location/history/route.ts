// src/app/api/buses/[busId]/location/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusLocation from '@/models/busLocation.model';
import Bus from '@/models/bus.model';

/**
 * GET /api/buses/[busId]/location/history
 * Lấy lịch sử vị trí của xe bus trong khoảng thời gian
 * Query params:
 *  - from: ISO timestamp (mặc định: 24h trước)
 *  - to: ISO timestamp (mặc định: hiện tại)
 *  - limit: số lượng bản ghi tối đa (mặc định: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { busId: string } }
) {
  try {
    await dbConnect();

    const { busId } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const limitParam = searchParams.get('limit');

    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = toParam ? new Date(toParam) : new Date();
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (must be 1-1000)' },
        { status: 400 }
      );
    }

    // Kiểm tra xe bus có tồn tại không
    const bus = await Bus.findById(busId);
    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    // Lấy lịch sử vị trí
    const locationHistory = await BusLocation.find({
      busId,
      timestamp: {
        $gte: from,
        $lte: to,
      },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('timestamp location speed')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        busId,
        bus: {
          plateNumber: bus.plateNumber,
          capacity: bus.capacity,
          status: bus.status,
        },
        from,
        to,
        count: locationHistory.length,
        locations: locationHistory,
      },
    });
  } catch (error) {
    console.error('Error fetching bus location history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
