import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/route.model';
import mongoose from 'mongoose';


// GET all routes (Không đổi)
export async function GET() {
  try {
    await connectDB();

    const routes = await Route.find()
      .populate('busId', 'plateNumber capacity')
      .populate('stops.stopId', 'name address')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { routes },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// POST create new route (Đã cập nhật)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    // 1. Lấy thêm 'status', 'distance', 'estimatedDuration', 'stopIds' từ body
    const { name, department, arrival, time, busId, status, distance, estimatedDuration, stopIds } = body;

    // Validate input (Không đổi)
    if (!name || !department || !arrival || !time) {
      return NextResponse.json(
        { message: 'Vui lòng nhập đủ thông tin: tên tuyến, phòng ban, nơi đến và giờ' },
        { status: 400 }
      );
    }

    // Check if route exists (Không đổi)
    const existingRoute = await Route.findOne({ name, department });
    if (existingRoute) {
      return NextResponse.json(
        { message: 'Tuyến đường này đã tồn tại' },
        { status: 400 }
      );
    }

    // 4. Validate busId an toàn hơn
    let busRef = null;
    if (busId && busId !== '') { // Chỉ check khi busId có giá trị
      if (!mongoose.Types.ObjectId.isValid(busId)) {
        return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
      }
      busRef = busId;
    }
    // (Nếu busId là "" hoặc null, busRef sẽ là null, rất tốt)

    // Create route
    const newRoute = await Route.create({
      name,
      department,
      arrival,
      time,
      busId: busRef,
      distance: distance || undefined,
      estimatedDuration: estimatedDuration || undefined,
      status: status || 'active',
      stops: stopIds && Array.isArray(stopIds) 
        ? stopIds.map((id: string, idx: number) => ({
            stopId: id,
            order: idx + 1,
            estimatedArrivalTime: ''
          }))
        : []
    });

    return NextResponse.json(
      { 
        message: 'Tạo tuyến đường thành công',
        route: {
          _id: newRoute._id,
          name: newRoute.name,
          department: newRoute.department,
          arrival: newRoute.arrival,
          time: newRoute.time,
          busId: newRoute.busId,
          distance: newRoute.distance,
          estimatedDuration: newRoute.estimatedDuration,
          status: newRoute.status // <-- 3. Trả status về
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating route:', error);
    
    // 5. Khối catch chi tiết hơn
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0] as mongoose.Error.ValidatorError;
      return NextResponse.json({ message: firstError.message }, { status: 400 });
    }
    if (error.code === 11000) {
       return NextResponse.json({ message: 'Lỗi trùng lặp dữ liệu, vui lòng kiểm tra lại' }, { status: 400 });
    }
    if (error.name === 'CastError') {
       return NextResponse.json({ message: `Dữ liệu không hợp lệ cho trường: ${error.path}` }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}