import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bus from '@/models/bus.model';
import mongoose from 'mongoose';

// GET all buses
export async function GET() {
  try {
    await connectDB();
    const buses = await Bus.find().sort({ createdAt: -1 });
    return NextResponse.json({ buses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching buses:', error);
    return NextResponse.json({ message: error?.message || 'Lỗi server' }, { status: 500 });
  }
}

// POST create new bus
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { plateNumber, capacity, status, driverId } = body;

    if (!plateNumber || typeof capacity !== 'number') {
      return NextResponse.json({ message: 'Vui lòng cung cấp biển số và sức chứa (số)' }, { status: 400 });
    }

    // Unique plateNumber check
    const exists = await Bus.findOne({ plateNumber });
    if (exists) {
      return NextResponse.json({ message: 'Biển số xe đã tồn tại' }, { status: 400 });
    }

    const busData: any = { plateNumber, capacity, status: status || 'active' };
    if (driverId) {
      if (!mongoose.Types.ObjectId.isValid(driverId)) {
        return NextResponse.json({ message: 'Mã tài xế không hợp lệ' }, { status: 400 });
      }
      busData.driverId = driverId;
    }

    const newBus = await Bus.create(busData);
    return NextResponse.json({ message: 'Tạo xe thành công', bus: newBus }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bus:', error);
    return NextResponse.json({ message: error?.message || 'Lỗi server' }, { status: 500 });
  }
}
