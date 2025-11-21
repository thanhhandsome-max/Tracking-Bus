import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/route.model';
import mongoose from 'mongoose';

// GET: Lấy chi tiết 1 tuyến đường
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID tuyến đường không hợp lệ' }, { status: 400 });
    }

    const route = await Route.findById(id)
      .populate('busId', 'plateNumber capacity')
      .populate('stops.stopId', 'name address');

    if (!route) {
      return NextResponse.json({ message: 'Không tìm thấy tuyến đường' }, { status: 404 });
    }

    return NextResponse.json({ route }, { status: 200 });
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// PUT: Cập nhật tuyến đường
export async function PUT(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID tuyến đường không hợp lệ' }, { status: 400 });
    }

    const body = await _request.json();
    const {
      name,
      department,
      arrival,
      time,
      busId,
      status,
      distance,
      estimatedDuration,
      stopIds
    } = body;

    // Xử lý busId
    let busRef: string | null = null;
    if (busId) {
      if (!mongoose.Types.ObjectId.isValid(busId)) {
        return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
      }
      busRef = busId;
    }

    // Xử lý distance
    const cleanDistance = distance !== undefined && distance !== null && distance !== ''
      ? Number(distance)
      : undefined;

    // Xử lý stops
    const stops = Array.isArray(stopIds)
      ? stopIds.map((stopId: string, index: number) => ({
          stopId,
          order: index + 1,
          estimatedArrivalTime: time || '00:00'
        }))
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
        stops
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

    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

// DELETE: Xóa tuyến đường
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID tuyến đường không hợp lệ' }, { status: 400 });
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
