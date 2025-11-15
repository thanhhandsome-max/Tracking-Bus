import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/models/route.model';

interface RouteData {
  name?: string;
  department?: string;
  arrival?: string;
  time?: string;
  busId?: string;
  [key: string]: unknown;
}

// GET all routes
export async function GET() {
  try {
    await connectDB();

    const routes = await Route.find()
      .populate('busId', 'plateNumber capacity')
      .populate('stops.stopId', 'name address')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { routes },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// POST create new route
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, department, arrival, time, busId } = body;

    // Validate input
    if (!name || !department || !arrival || !time) {
      return NextResponse.json(
        { message: 'Vui lòng nhập đủ thông tin: tên tuyến, phòng ban, nơi đến và giờ' },
        { status: 400 }
      );
    }

    // Check if route exists
    const existingRoute = await Route.findOne({ name, department });
    if (existingRoute) {
      return NextResponse.json(
        { message: 'Tuyến đường này đã tồn tại' },
        { status: 400 }
      );
    }

    // Create route
    const newRoute = await Route.create({
      name,
      department,
      arrival,
      time,
      busId: busId || null,
      stops: []
    });

    return NextResponse.json(
      { 
        message: 'Tạo tuyến đường thành công',
        route: {
          _id: newRoute._id,
          name: newRoute.name,
          department: newRoute.department,
          arrival: newRoute.arrival,
          time: newRoute.time,
          busId: newRoute.busId
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
