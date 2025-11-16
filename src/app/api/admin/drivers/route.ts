import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/driver.model';

interface DriverData {
  userId?: { _id: unknown; email?: string; firstName?: string; lastName?: string; name?: string };
  busId?: { _id: unknown; plateNumber: string };
  [key: string]: unknown;
}

// GET all drivers
export async function GET() {
  try {
    await connectDB();

    const drivers = await Driver.find({}).populate('userId').populate('busId');
    
    const driversData = drivers.map((driver: DriverData) => ({
      _id: driver._id,
      userId: driver.userId?._id,
      name: driver.name,
      // Email lives on the referenced User document (userId)
      email: driver.userId?.email || '',
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      busId: driver.busId?._id,
      busPlateNumber: driver.busId?.plateNumber,
      status: driver.status || 'active',
      createdAt: driver.createdAt
    }));

    return NextResponse.json(
      { 
        message: 'Lấy danh sách tài xế thành công',
        drivers: driversData,
        total: driversData.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
