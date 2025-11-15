import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user.model';
import Driver from '@/models/driver.model';
import bcrypt from 'bcryptjs';

// POST create new driver
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, name, phone, licenseNumber } = body;

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
    const newDriver = await Driver.create({
      userId: newUser._id,
      name,
      email,
      phone,
      licenseNumber: licenseNumber || ''
    });

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
