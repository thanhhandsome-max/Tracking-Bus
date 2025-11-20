import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/route.model';
import mongoose from 'mongoose';

// 1. GET: Lấy chi tiết 1 tuyến đường
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID không hợp lệ' }, { status: 400 });
    }

    const route = await Route.findById(id)
      .populate('busId', 'plateNumber capacity')
      .populate('stops.stopId', 'name address');

    if (!route) {
      return NextResponse.json({ message: 'Không tìm thấy tuyến đường' }, { status: 404 });
    }

    return NextResponse.json({ route }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// 2. PUT: Cập nhật tuyến đường
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      name, department, arrival, time, 
      busId, status, distance, estimatedDuration, stopIds 
    } = body;

    // Xử lý busId
    let busRef = null;
    if (busId && busId !== '') {
      if (!mongoose.Types.ObjectId.isValid(busId)) {
        return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
      }
      busRef = busId;
    }

    // Xử lý distance
    const cleanDistance = (distance !== '' && distance !== null && distance !== undefined) 
      ? Number(distance) 
      : undefined;

    const route = await Route.findByIdAndUpdate(
      id,
      {
        name,
        department,
        arrival,
        time,
        busId: busRef,
        distance: cleanDistance,
        estimatedDuration,
        status,
        // --- ĐOẠN ĐÃ SỬA LỖI ---
        stops: stopIds && Array.isArray(stopIds)
          ? stopIds.map((id: string, idx: number) => ({
              stopId: id,
              order: idx + 1,
              // Fix lỗi Validation: Dùng giờ khởi hành làm mặc định thay vì chuỗi rỗng
              estimatedArrivalTime: time || '00:00' 
            }))
          : undefined 
        // -----------------------
      },
      { new: true, runValidators: true }
    )
    .populate('busId', 'plateNumber capacity')
    .populate('stops.stopId', 'name address');

    if (!route) {
      return NextResponse.json({ message: 'Không tìm thấy tuyến đường để cập nhật' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Cập nhật thành công', route }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating route:', error);
    if (error.name === 'CastError') {
       return NextResponse.json({ message: `Dữ liệu không hợp lệ: ${error.path}` }, { status: 400 });
    }
    // Trả về lỗi chi tiết để dễ debug
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

// 3. DELETE: Xóa tuyến đường
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID không hợp lệ' }, { status: 400 });
    }

    const route = await Route.findByIdAndDelete(id);

    if (!route) {
      return NextResponse.json({ message: 'Không tìm thấy tuyến đường' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Xóa thành công' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}