import { NextRequest, NextResponse } from 'next/server';
import Trip from '@/models/trip.model';
import Driver from '@/models/driver.model';
import User from '@/models/user.model';

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

    // Xác định ngày bắt đầu và kết thúc của tháng
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 1);

    // Lấy các chuyến trong tháng đó
    const trips = await Trip.find({
      tripDate: {
        $gte: startDate,
        $lt: endDate
      },
      status: { $in: ['completed', 'in_progress'] } // Chỉ tính các chuyến hoàn thành hoặc đang thực hiện
    })
      .populate('driverId', 'name phone')
      .populate('busId', 'plateNumber')
      .lean();

    // Nhóm theo tài xế và đếm số chuyến
    const driverStats: {
      [key: string]: {
        driverId: string;
        driverName: string;
        phone: string;
        tripCount: number;
        buses: Set<string>;
      }
    } = {};

    trips.forEach((trip: any) => {
      const driverId = trip.driverId?._id?.toString();
      const driverName = trip.driverId?.name || 'Không rõ';
      const phone = trip.driverId?.phone || '';
      const busPlate = trip.busId?.plateNumber || '';

      if (driverId) {
        if (!driverStats[driverId]) {
          driverStats[driverId] = {
            driverId,
            driverName,
            phone,
            tripCount: 0,
            buses: new Set()
          };
        }
        driverStats[driverId].tripCount += 1;
        if (busPlate) {
          driverStats[driverId].buses.add(busPlate);
        }
      }
    });

    // Chuyển đổi sang array và sắp xếp theo số chuyến giảm dần
    const statistics = Object.values(driverStats)
      .map(stat => ({
        driverId: stat.driverId,
        driverName: stat.driverName,
        phone: stat.phone,
        tripCount: stat.tripCount,
        buses: Array.from(stat.buses).join(', ')
      }))
      .sort((a, b) => b.tripCount - a.tripCount);

    return NextResponse.json({
      month: monthNum,
      year: yearNum,
      totalTrips: trips.length,
      totalDrivers: statistics.length,
      statistics
    });
  } catch (error) {
    console.error('Error fetching driver statistics:', error);
    return NextResponse.json(
      { message: 'Lỗi khi lấy thống kê tài xế' },
      { status: 500 }
    );
  }
}
