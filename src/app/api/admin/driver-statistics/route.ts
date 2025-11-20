import { NextRequest, NextResponse } from 'next/server';
import Trip from '@/models/trip.model';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp tháng và năm' },
        { status: 400 }
      );
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    // --- BẮT ĐẦU AGGREGATION PIPELINE ---
    const stats = await Trip.aggregate([
      // 1. Lọc các chuyến trong tháng
      {
        $match: {
          tripDate: {
            $gte: startDate,
            $lt: endDate
          },
          status: { $in: ['completed', 'in_progress'] }
        }
      },
      // 2. Nhóm theo driverId
      {
        $group: {
          _id: '$driverId', 
          tripCount: { $sum: 1 }, 
          busIds: { $addToSet: '$busId' }
        }
      },
      // 3. Tìm thông tin tài xế từ bảng 'users' (hoặc 'drivers' tùy schema của bạn)
      // Lưu ý: Seed data bạn dùng User ID làm driverId, nên ta lookup bảng 'users'
      {
        $lookup: {
          from: 'users', 
          localField: '_id',
          foreignField: '_id',
          as: 'driverInfo'
        }
      },
      // 4. Tìm thông tin xe
      {
        $lookup: {
          from: 'buses',
          localField: 'busIds',
          foreignField: '_id',
          as: 'busInfo'
        }
      },
      // 5. Unwind để lấy object từ mảng (giữ lại kể cả khi không tìm thấy user)
      {
        $unwind: {
          path: '$driverInfo',
          preserveNullAndEmptyArrays: true 
        }
      },
      // 6. Format dữ liệu đầu ra
      {
        $project: {
          _id: 0,
          driverId: '$_id',
          // Nếu không tìm thấy tên, hiển thị ID hoặc "Tài xế ẩn" để debug
          driverName: { $ifNull: ['$driverInfo.name', 'Tài xế ẩn/Đã xóa'] },
          phone: { $ifNull: ['$driverInfo.phone', '---'] },
          tripCount: 1,
          buses: {
            $map: {
              input: '$busInfo',
              as: 'bus',
              in: '$$bus.plateNumber'
            }
          }
        }
      },
      {
        $sort: { tripCount: -1 }
      }
    ]);

    // Xử lý mảng buses thành chuỗi
    const formattedStats = stats.map(item => ({
      ...item,
      buses: Array.isArray(item.buses) ? item.buses.join(', ') : ''
    }));

    return NextResponse.json({
      month: monthNum,
      year: yearNum,
      // Tính tổng dựa trên kết quả đã nhóm (đảm bảo khớp số liệu)
      totalTrips: formattedStats.reduce((acc, curr) => acc + curr.tripCount, 0),
      totalDrivers: formattedStats.length,
      statistics: formattedStats
    });

  } catch (error) {
    console.error('Error fetching driver statistics:', error);
    return NextResponse.json(
      { message: 'Lỗi khi lấy thống kê tài xế' },
      { status: 500 }
    );
  }
}