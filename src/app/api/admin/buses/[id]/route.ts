import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bus from '@/models/bus.model';
import mongoose from 'mongoose';

// GET: Lấy thông tin 1 xe theo id
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
    }

    const bus = await Bus.findById(id).populate('driverId', 'firstName lastName');

    if (!bus) {
      return NextResponse.json({ message: 'Không tìm thấy xe' }, { status: 404 });
    }

    return NextResponse.json({ bus }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching bus:', error);
    return NextResponse.json({ message: error?.message || 'Lỗi server' }, { status: 500 });
  }
}

// PUT: Cập nhật thông tin xe
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { plateNumber, capacity, status, driverId } = body;

    const update: any = {};
    if (plateNumber) update.plateNumber = plateNumber;
    if (typeof capacity === 'number') update.capacity = capacity;
    if (status) update.status = status;

    if (typeof driverId !== 'undefined') {
      if (driverId && !mongoose.Types.ObjectId.isValid(driverId)) {
        return NextResponse.json({ message: 'Mã tài xế không hợp lệ' }, { status: 400 });
      }
      update.driverId = driverId || null;
    }

    const updatedBus = await Bus.findByIdAndUpdate(id, update, { new: true });

    if (!updatedBus) {
      return NextResponse.json({ message: 'Không tìm thấy xe' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Cập nhật xe thành công', bus: updatedBus }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating bus:', error);
    return NextResponse.json({ message: error?.message || 'Lỗi server' }, { status: 500 });
  }
}

// DELETE: Xóa xe
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
    }

    const deletedBus = await Bus.findByIdAndDelete(id);

    if (!deletedBus) {
      return NextResponse.json({ message: 'Không tìm thấy xe' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Xóa xe thành công' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting bus:', error);
    return NextResponse.json({ message: error?.message || 'Lỗi server' }, { status: 500 });
  }
}
