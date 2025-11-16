import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stop from '@/models/stop.model';

// GET all stops
export async function GET() {
  try {
    await connectDB();

    const stops = await Stop.find().sort({ _id: -1 });

    return NextResponse.json({ stops }, { status: 200 });
  } catch (error) {
    console.error('Error fetching stops:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// POST create new stop
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, address, lat, lng } = body;

    if (!name || !address || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp tên, địa chỉ và tọa độ (lat, lng)' },
        { status: 400 }
      );
    }

    const existing = await Stop.findOne({ name, address });
    if (existing) {
      return NextResponse.json({ message: 'Trạm đã tồn tại' }, { status: 400 });
    }

    const newStop = await Stop.create({
      name,
      address,
      location: { type: 'Point', coordinates: [lng, lat] }
    });

    return NextResponse.json(
      { message: 'Tạo trạm thành công', stop: newStop },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating stop:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
