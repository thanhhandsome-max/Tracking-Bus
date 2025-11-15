import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/route.model';

// GET single route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
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
  } catch (error) {
    console.error('Error fetching route:', error);
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
    const body = await request.json();
    const { name, department, arrival, time, busId } = body;

    const route = await Route.findByIdAndUpdate(
      id,
      {
        name,
        department,
        arrival,
        time,
        busId: busId || null
      },
      { new: true }
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
  } catch (error) {
    console.error('Error updating route:', error);
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
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
