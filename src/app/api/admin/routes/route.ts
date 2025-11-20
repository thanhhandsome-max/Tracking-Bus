import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/route.model';
import mongoose from 'mongoose';

// 1. GET: Lấy danh sách tất cả tuyến đường
export async function GET() {
  try {
    await connectDB();

    const routes = await Route.find()
      .populate('busId', 'plateNumber capacity')
      .populate('stops.stopId', 'name address')
      .sort({ createdAt: -1 });

    return NextResponse.json({ routes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// 2. POST: Tạo tuyến đường mới
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { 
      name, department, arrival, time, 
      busId, status, distance, estimatedDuration, stopIds 
    } = body;

    // Validate cơ bản
    if (!name || !department || !arrival || !time) {
      return NextResponse.json(
        { message: 'Vui lòng nhập đủ thông tin: tên tuyến, phòng ban, nơi đến và giờ' },
        { status: 400 }
      );
    }

    // Kiểm tra trùng tên
    const existingRoute = await Route.findOne({ name, department });
    if (existingRoute) {
      return NextResponse.json(
        { message: 'Tuyến đường này đã tồn tại' },
        { status: 400 }
      );
    }

    // Xử lý busId (nếu rỗng thì là null)
    let busRef = null;
    if (busId && busId !== '') {
      if (!mongoose.Types.ObjectId.isValid(busId)) {
        return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
      }
      busRef = busId;
    }

    // Tạo mới
    const newRoute = await Route.create({
      name,
      department,
      arrival,
      time,
      busId: busRef,
      // Convert distance sang số, nếu lỗi hoặc rỗng thì undefined
      distance: (distance && !isNaN(Number(distance))) ? Number(distance) : undefined,
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
          ...newRoute.toObject(), // Convert document to object
          status: newRoute.status 
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating route:', error);
    if (error.code === 11000) {
       return NextResponse.json({ message: 'Dữ liệu bị trùng lặp' }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}