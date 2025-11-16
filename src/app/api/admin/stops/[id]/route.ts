import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stop from '@/models/stop.model';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, address, lat, lng } = body;

    const { id } = await params;
    const stop = await Stop.findById(id);
    if (!stop) {
      return NextResponse.json({ message: 'Không tìm thấy trạm' }, { status: 404 });
    }

    if (name) stop.name = name;
    if (address) stop.address = address;
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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await params;
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
