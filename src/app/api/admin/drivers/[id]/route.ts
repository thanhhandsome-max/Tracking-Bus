import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/driver.model';
import Bus from '@/models/bus.model';
import mongoose from 'mongoose';

// GET: Lấy chi tiết 1 tài xế
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Mã tài xế không hợp lệ' }, { status: 400 });
    }

    const driver = await Driver.findById(id)
      .populate('userId')
      .populate('busId');

    if (!driver) {
      return NextResponse.json({ message: 'Tài xế không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({
      driver: {
        _id: driver._id,
        userId: driver.userId?._id,
        name: driver.name,
        email: driver.email || driver.userId?.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        busId: driver.busId?._id,
        busPlateNumber: driver.busId?.plateNumber,
        status: driver.status || 'active',
        createdAt: driver.createdAt
      }
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// PUT: Cập nhật tài xế
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Mã tài xế không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { name, phone, licenseNumber, busId, status } = body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json({ message: 'Tài xế không tồn tại' }, { status: 404 });
    }

    // Cập nhật thông tin cơ bản
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (typeof status !== 'undefined') driver.status = status;

    // Xử lý gán/hủy xe
    if (typeof busId !== 'undefined') {
      if (busId) {
        if (!mongoose.Types.ObjectId.isValid(busId)) {
          return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
        }
        // Gỡ khỏi xe cũ nếu đang lái
        if (driver.busId && String(driver.busId) !== String(busId)) {
          await Bus.findByIdAndUpdate(driver.busId, { $unset: { driverId: '' } });
        }
        // Gán xe mới
        driver.busId = busId;
        await Bus.findByIdAndUpdate(busId, { driverId: driver.userId });
      } else {
        // Hủy gán xe
        if (driver.busId) {
          await Bus.findByIdAndUpdate(driver.busId, { $unset: { driverId: '' } });
        }
        driver.busId = null;
      }
    }

    await driver.save();

    return NextResponse.json({ message: 'Cập nhật tài xế thành công', driver }, { status: 200 });
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// DELETE: Xóa tài xế
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Mã tài xế không hợp lệ' }, { status: 400 });
    }

    const driver = await Driver.findById(id);

    // Gỡ khỏi xe đang lái nếu có
    if (driver?.busId) {
      await Bus.findByIdAndUpdate(driver.busId, { $unset: { driverId: '' } });
    }

    const deletedDriver = await Driver.findByIdAndDelete(id);

    if (!deletedDriver) {
      return NextResponse.json({ message: 'Tài xế không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Xóa tài xế thành công' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
