import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user.model';
import Driver from '@/models/driver.model';
import Bus from '@/models/bus.model';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// POST create new driver
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, name, phone, licenseNumber, busId } = body;

    // Validate input
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { message: 'Vui lòng nhập đủ thông tin: email, mật khẩu, tên và số điện thoại' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email đã tồn tại' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: 'driver'
    });

    // Create driver
    const driverData: any = {
      userId: newUser._id,
      name,
      email,
      phone,
      licenseNumber: licenseNumber || ''
    };

    // If a busId was provided, validate and assign
    if (busId) {
      if (!mongoose.Types.ObjectId.isValid(busId)) {
        return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
      }
      const bus = await Bus.findById(busId);
      if (!bus) {
        return NextResponse.json({ message: 'Xe không tồn tại' }, { status: 400 });
      }
      driverData.busId = busId;
    }

    const newDriver = await Driver.create(driverData);

    // If bus assigned, update bus.driverId to reference the created user's id
    if (busId) {
      await Bus.findByIdAndUpdate(busId, { driverId: newUser._id });
    }

    return NextResponse.json(
      { 
        message: 'Tạo tài xế thành công',
        driver: {
          _id: newDriver._id,
          name: newDriver.name,
          email: newDriver.email,
          phone: newDriver.phone,
          licenseNumber: newDriver.licenseNumber
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
