// src/app/api/notifications/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { NotificationService } from '@/service/NotificationService';

/**
 * POST /api/notifications/check
 * Kiểm tra tất cả chuyến đi và gửi notification nếu cần
 * 
 * Body:
 *  - trips: danh sách trips từ /api/trips/active
 *  - schoolLocation: vị trí trường học
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { trips, schoolLocation } = body;

    if (!trips || !Array.isArray(trips)) {
      return NextResponse.json(
        { error: 'Invalid trips data' },
        { status: 400 }
      );
    }

    if (!schoolLocation || !schoolLocation.latitude || !schoolLocation.longitude) {
      return NextResponse.json(
        { error: 'Invalid school location' },
        { status: 400 }
      );
    }

    // Kiểm tra và gửi notifications
    const notificationsSent = await NotificationService.checkAllTripsAndNotify(
      trips,
      schoolLocation
    );

    return NextResponse.json({
      success: true,
      notificationsSent,
      message: `Checked ${trips.length} trips, sent ${notificationsSent} notifications`,
    });
  } catch (error) {
    console.error('Error checking notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
