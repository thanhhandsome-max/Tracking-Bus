import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stop from '@/models/stop.model';
import mongoose from 'mongoose';

// GET: Lấy chi tiết 1 trạm
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID trạm không hợp lệ' }, { status: 400 });
    }

    const stop = await Stop.findById(id);
    if (!stop) {
      return NextResponse.json({ message: 'Không tìm thấy trạm' }, { status: 404 });
    }

    return NextResponse.json({ stop }, { status: 200 });
  } catch (error) {
    console.error('Error fetching stop:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// PUT: Cập nhật trạm
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID trạm không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { name, address, lat, lng } = body;

    const stop = await Stop.findById(id);
    if (!stop) {
      return NextResponse.json({ message: 'Không tìm thấy trạm' }, { status: 404 });
    }

    if (name) stop.name = name;
    if (address) stop.address = address;

    // Xử lý tọa độ nếu hợp lệ
    if (typeof lat === 'number' && typeof lng === 'number') {
      stop.location = { type: 'Point', coordinates: [lng, lat] } as any;
    }

    await stop.save();

    return NextResponse.json({ message: 'Cập nhật trạm thành công', stop }, { status: 200 });
  } catch (error) {
    console.error('Error updating stop:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// DELETE: Xóa trạm
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID trạm không hợp lệ' }, { status: 400 });
    }

    const stop = await Stop.findByIdAndDelete(id);
    if (!stop) {
      return NextResponse.json({ message: 'Không tìm thấy trạm' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Xóa trạm thành công' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting stop:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
