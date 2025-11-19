import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/driver.model';
import Bus from '@/models/bus.model';
import mongoose from 'mongoose';

// GET driver by id
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const driver = await Driver.findById(id).populate('userId').populate('busId');
    if (!driver) {
      return NextResponse.json(
        { message: 'Tài xế không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        driver: {
          _id: driver._id,
          userId: driver.userId?._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          busId: driver.busId?._id,
          busPlateNumber: driver.busId?.plateNumber,
          status: driver.status || 'active',
          createdAt: driver.createdAt
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching driver:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// PUT update driver
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, phone, licenseNumber, busId, status } = body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json(
        { message: 'Tài xế không tồn tại' },
        { status: 404 }
      );
    }

    // Update driver info
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (typeof status !== 'undefined') driver.status = status;

    // Handle bus assignment changes: if busId provided (including null), synchronize Bus.driverId
    if (typeof busId !== 'undefined') {
      // Validate busId if not null/empty
      if (busId) {
        if (!mongoose.Types.ObjectId.isValid(busId)) {
          return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
        }
        const newBus = await Bus.findById(busId);
        if (!newBus) return NextResponse.json({ message: 'Xe không tồn tại' }, { status: 400 });

        // If driver was previously assigned to another bus, remove that link
        if (driver.busId && String(driver.busId) !== String(busId)) {
          await Bus.findByIdAndUpdate(driver.busId, { $unset: { driverId: '' } });
        }

        // Assign new bus -> set driver's busId and set bus.driverId
        driver.busId = busId;
        await Bus.findByIdAndUpdate(busId, { driverId: driver.userId || driver._id });
      } else {
        // Unassign bus
        if (driver.busId) {
          await Bus.findByIdAndUpdate(driver.busId, { $unset: { driverId: '' } });
        }
        driver.busId = null as any;
      }
    }

    await driver.save();

    return NextResponse.json(
      { 
        message: 'Cập nhật tài xế thành công',
        driver: {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          busId: driver.busId,
          status: driver.status
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// DELETE driver
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const driver = await Driver.findByIdAndDelete(id);
    if (!driver) {
      return NextResponse.json(
        { message: 'Tài xế không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Xóa tài xế thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
