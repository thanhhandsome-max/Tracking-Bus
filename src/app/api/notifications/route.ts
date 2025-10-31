// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/notification.model';
import Parent from '@/models/parent.model';

/**
 * GET /api/notifications
 * Lấy danh sách thông báo của người dùng hiện tại
 * 
 * Query params:
 *  - userId: ID của user (bắt buộc)
 *  - limit: số lượng thông báo (mặc định: 20)
 *  - unreadOnly: chỉ lấy chưa đọc (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Tìm parent từ userId
    const parent: any = await Parent.findOne({ userId }).lean();
    
    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    // Build query
    const query: any = {
      recipientId: parent._id,
      recipientModel: 'Parent'
    };

    if (unreadOnly) {
      query.read = false;
    }

    // Lấy notifications
    const notifications: any[] = await Notification
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Đếm số lượng chưa đọc
    const unreadCount = await Notification.countDocuments({
      recipientId: parent._id,
      recipientModel: 'Parent',
      read: false
    });

    return NextResponse.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications.map(notif => ({
        id: (notif._id as any).toString(),
        message: notif.message,
        type: notif.type,
        read: notif.read,
        createdAt: notif.createdAt,
        updatedAt: notif.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Đánh dấu thông báo đã đọc
 * 
 * Body:
 *  - notificationId: ID của notification
 */
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
