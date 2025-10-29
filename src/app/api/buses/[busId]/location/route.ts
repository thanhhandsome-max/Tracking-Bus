// src/app/api/buses/[busId]/location/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusLocation from '@/models/busLocation.model';
import Bus from '@/models/bus.model';

/**
 * GET /api/buses/[busId]/location
 * Lấy vị trí hiện tại (mới nhất) của xe bus
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { busId: string } }
) {
  try {
    await dbConnect();

    const { busId } = params;

    // Kiểm tra xe bus có tồn tại không
    const bus = await Bus.findById(busId);
    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    // Lấy vị trí mới nhất của xe bus
    const latestLocation = await BusLocation.findOne({ busId })
      .sort({ timestamp: -1 })
      .lean();

    if (!latestLocation) {
      return NextResponse.json(
        { error: 'No location data found for this bus' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        busId: bus._id,
        bus: {
          plateNumber: bus.plateNumber,
          capacity: bus.capacity,
          status: bus.status,
        },
        timestamp: (latestLocation as any).timestamp,
        location: (latestLocation as any).location,
        speed: (latestLocation as any).speed,
      },
    });
  } catch (error) {
    console.error('Error fetching bus location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/buses/[busId]/location
 * Cập nhật vị trí mới cho xe bus (dùng cho GPS tracker)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { busId: string } }
) {
  try {
    await dbConnect();

    const { busId } = params;
    const body = await request.json();

    const { longitude, latitude, speed } = body;

    // Validate input
    if (
      typeof longitude !== 'number' ||
      typeof latitude !== 'number' ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Kiểm tra xe bus có tồn tại không
    const bus = await Bus.findById(busId);
    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    // Tạo bản ghi vị trí mới
    const newLocation = await BusLocation.create({
      busId,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      speed: speed || 0,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newLocation._id,
        busId: newLocation.busId,
        timestamp: newLocation.timestamp,
        location: newLocation.location,
        speed: newLocation.speed,
      },
    });
  } catch (error) {
    console.error('Error updating bus location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
