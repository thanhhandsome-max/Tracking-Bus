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

    const startDate = new Date(yearNum, monthNum - 1, 1);  // Ngày 1 của tháng (Lưu ý: tháng trong JS bắt đầu từ 0 nên phải -1)
    const endDate = new Date(yearNum, monthNum, 1);

    // --- BẮT ĐẦU AGGREGATION PIPELINE ---
    const stats = await Trip.aggregate([
      // 1. Lọc các chuyến trong tháng
      {
        $match: {
          tripDate: {
            $gte: startDate, // Lớn hơn hoặc bằng ngày đầu tháng
            $lt: endDate  // Nhỏ hơn ngày đầu tháng sau
          },
          status: { $in: ['completed', 'in_progress'] }  // Chỉ lấy chuyến đã xong hoặc đang chạy
        }
      },
      // 2. Nhóm theo driverId
      {
        $group: {
          _id: '$driverId',   // Gom các chuyến có cùng driverId lại với nhau
          tripCount: { $sum: 1 },   // Cứ mỗi chuyến tìm thấy, cộng thêm 1 vào tổng
          busIds: { $addToSet: '$busId' }  // Tạo mảng chứa các ID xe mà tài xế này đã lái ($addToSet giúp không bị trùng lặp)
        }
      },
      // 3. Tìm thông tin tài xế từ bảng 'users' (hoặc 'drivers' tùy schema của bạn)
      // Lưu ý: Seed data bạn dùng User ID làm driverId, nên ta lookup bảng 'users'
      {
        $lookup: {  // kết nối bảng
          from: 'users',   // Tên collection muốn kết nối (trong DB thường là số nhiều)
          localField: '_id',   // Trường ở bảng hiện tại (chính là driverId từ bước group)
          foreignField: '_id', // Trường ở bảng 'users' để so sánh
          as: 'driverInfo' // Kết quả sẽ được lưu vào mảng driverInfo
        }
      },
      // 4. Tìm thông tin xe
      {
        $lookup: {  // kết nối bảng
          from: 'buses',
          localField: 'busIds',  // Mảng các ID xe từ bước group
          foreignField: '_id', // Trường ID ở bảng buses
          as: 'busInfo'    // Trả về mảng thông tin chi tiết các xe
        }
      },
      // 5. Unwind để lấy object từ mảng (giữ lại kể cả khi không tìm thấy user)
      {
        $unwind: {
          path: '$driverInfo',
          preserveNullAndEmptyArrays: true  // Giữ lại cả khi không có tài xế (tránh mất dữ liệu)
        }
      },
      // 6. Format dữ liệu đầu ra
      {
        $project: {
          _id: 0, // Không hiện trường _id mặc định
          driverId: '$_id',
          // Nếu không tìm thấy tên, hiển thị ID hoặc "Tài xế ẩn" để debug
          driverName: { $ifNull: ['$driverInfo.name', 'Tài xế ẩn/Đã xóa'] },
          phone: { $ifNull: ['$driverInfo.phone', '---'] },
          tripCount: 1,
          buses: {
            $map: {
              input: '$busInfo',
              as: 'bus',
              in: '$$bus.plateNumber' //$$ dùng để tham chiếu tới biến tạm (bus)
            }
          }
        }
      },
      {
        $sort: { tripCount: -1 }
      }
    ]);

    // Xử lý mảng buses thành chuỗi cho dễ đọc ở frontend
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