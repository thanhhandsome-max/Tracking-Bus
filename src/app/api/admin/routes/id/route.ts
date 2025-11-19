import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/route.model';
import mongoose, { MongooseError } from 'mongoose'; // <-- Import MongooseError

// GET single route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // 1. Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID tuyến đường không hợp lệ' },
        { status: 400 }
      );
    }

    const route = await Route.findById(id)
      .populate('busId', 'plateNumber capacity')
      .populate('stops.stopId', 'name address');

    if (!route) {
      return NextResponse.json(
        { message: 'Không tìm thấy tuyến đường' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { route },
      { status: 200 }
    );
  } catch (error: any) { // 3. Catch lỗi chi tiết
    console.error('Error fetching route:', error);
    if (error.name === 'CastError') {
      return NextResponse.json({ message: 'ID tuyến đường không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// PUT update route
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    
    // 1. Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID tuyến đường không hợp lệ' },
        { status: 400 }
      );
    }

    const body = await request.json();
    // 2. Lấy thêm 'status', 'distance', 'estimatedDuration', 'stopIds'
    const { name, department, arrival, time, busId, status, distance, estimatedDuration, stopIds } = body;

    // Validate busId when provided (Logic cũ của bạn đã tốt)
    let busRef = null;
    if (typeof busId !== 'undefined' && busId !== null && busId !== '') {
      if (!mongoose.Types.ObjectId.isValid(busId)) {
        return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
      }
      busRef = busId;
    }
    // (Nếu busId là "" hoặc null, busRef sẽ là null, rất tốt)

    const route = await Route.findByIdAndUpdate(
      id,
      {
        name,
        department,
        arrival,
        time,
        busId: busRef,
        distance: distance !== undefined ? distance : undefined,
        estimatedDuration: estimatedDuration !== undefined ? estimatedDuration : undefined,
        status: status,
        stops: stopIds && Array.isArray(stopIds)
          ? stopIds.map((id: string, idx: number) => ({
              stopId: id,
              order: idx + 1,
              estimatedArrivalTime: ''
            }))
          : undefined
      },
      { new: true, runValidators: true }
    ).populate('busId', 'plateNumber capacity')
     .populate('stops.stopId', 'name address');

    if (!route) {
      return NextResponse.json(
        { message: 'Không tìm thấy tuyến đường' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Cập nhật tuyến đường thành công', route },
      { status: 200 }
    );
  } catch (error: any) { // 3. Catch lỗi chi tiết
    console.error('Error updating route:', error);
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0] as mongoose.Error.ValidatorError;
      return NextResponse.json({ message: firstError.message }, { status: 400 });
    }
    if (error.code === 11000) {
       return NextResponse.json({ message: 'Lỗi trùng lặp dữ liệu, tên tuyến đã tồn tại' }, { status: 400 });
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

// DELETE route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // 1. Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID tuyến đường không hợp lệ' },
        { status: 400 }
      );
    }

    const route = await Route.findByIdAndDelete(id);

    if (!route) {
      return NextResponse.json(
        { message: 'Không tìm thấy tuyến đường' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Xóa tuyến đường thành công' },
      { status: 200 }
    );
  } catch (error: any) { // 3. Catch lỗi chi tiết
    console.error('Error deleting route:', error);
    if (error.name === 'CastError') {
      return NextResponse.json({ message: 'ID tuyến đường không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}