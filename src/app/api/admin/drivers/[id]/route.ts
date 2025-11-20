import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/driver.model';
import Bus from '@/models/bus.model';
import mongoose from 'mongoose';

// 1. GET: Xem chi tiết 1 tài xế
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const driver = await Driver.findById(id).populate('userId').populate('busId');
    if (!driver) {
      return NextResponse.json({ message: 'Tài xế không tồn tại' }, { status: 404 });
    }

    return NextResponse.json(
      { 
        driver: {
          _id: driver._id,
          userId: driver.userId?._id,
          name: driver.name,
          email: driver.email, // Hoặc lấy từ driver.userId.email
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
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// 2. PUT: Cập nhật tài xế
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, phone, licenseNumber, busId, status } = body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json({ message: 'Tài xế không tồn tại' }, { status: 404 });
    }

    // Update thông tin cơ bản
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (typeof status !== 'undefined') driver.status = status;

    // --- LOGIC GÁN XE (QUAN TRỌNG) ---
    if (typeof busId !== 'undefined') {
      // Trường hợp 1: Có chọn xe mới
      if (busId && busId !== '') {
        if (!mongoose.Types.ObjectId.isValid(busId)) {
          return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
        }
        
        // Nếu tài xế đang lái xe khác -> Gỡ tài xế khỏi xe cũ
        if (driver.busId && String(driver.busId) !== String(busId)) {
          await Bus.findByIdAndUpdate(driver.busId, { $unset: { driverId: '' } });
        }

        // Gán xe mới cho tài xế
        driver.busId = busId;
        // Cập nhật xe mới: set driverId là User ID của tài xế
        await Bus.findByIdAndUpdate(busId, { driverId: driver.userId });
      
      } else {
        // Trường hợp 2: Hủy gán xe (busId = null hoặc "")
        if (driver.busId) {
          await Bus.findByIdAndUpdate(driver.busId, { $unset: { driverId: '' } });
        }
        driver.busId = null;
      }
    }

    await driver.save();

    return NextResponse.json({ 
      message: 'Cập nhật tài xế thành công',
      driver 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// 3. DELETE: Xóa tài xế
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Logic mở rộng: Trước khi xóa driver, nên gỡ driverId khỏi Bus đang lái (nếu có)
    const driver = await Driver.findById(id);
    if (driver && driver.busId) {
       await Bus.findByIdAndUpdate(driver.busId, { $unset: { driverId: '' } });
    }

    const deletedDriver = await Driver.findByIdAndDelete(id);
    if (!deletedDriver) {
      return NextResponse.json({ message: 'Tài xế không tồn tại' }, { status: 404 });
    }
    
    // Logic mở rộng: Xóa luôn User tương ứng? (Tùy nghiệp vụ)
    // await User.findByIdAndDelete(deletedDriver.userId);

    return NextResponse.json({ message: 'Xóa tài xế thành công' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}