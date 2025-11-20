import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/driver.model';
import User from '@/models/user.model';
import Bus from '@/models/bus.model';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// 1. GET: Lấy danh sách tài xế
export async function GET() {
  try {
    await connectDB();

    const drivers = await Driver.find({}).populate('userId').populate('busId');
    
    // Format dữ liệu trả về cho gọn
    const driversData = drivers.map((driver: any) => ({
      _id: driver._id,
      userId: driver.userId?._id,
      name: driver.name,
      // Email nằm trong bảng User
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
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// 2. POST: Tạo tài xế mới
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password, name, phone, licenseNumber, busId } = body;

    // Validation cơ bản
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { message: 'Vui lòng nhập đủ: email, mật khẩu, tên và số điện thoại' }, 
        { status: 400 }
      );
    }

    // 1. Kiểm tra Email trùng trong bảng User
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Email đã tồn tại' }, { status: 400 });
    }

    // 2. Tạo User mới (Role driver)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ 
      email, 
      password: hashedPassword, 
      role: 'driver',
      name, // Lưu tên vào User luôn nếu schema User có trường name
      phone 
    });

    // 3. Chuẩn bị dữ liệu Driver
    const driverData: any = { 
      userId: newUser._id, 
      name, 
      email, // Lưu email dư thừa (redundant) để dễ query nếu cần
      phone, 
      licenseNumber: licenseNumber || '' 
    };

    // 4. Xử lý gán xe (nếu có)
    if (busId && busId !== '') {
      if (!mongoose.Types.ObjectId.isValid(busId)) {
        return NextResponse.json({ message: 'Mã xe không hợp lệ' }, { status: 400 });
      }
      const bus = await Bus.findById(busId);
      if (!bus) return NextResponse.json({ message: 'Xe không tồn tại' }, { status: 400 });
      
      driverData.busId = busId;
    }

    // 5. Tạo Driver
    const newDriver = await Driver.create(driverData);

    // 6. Cập nhật ngược lại vào bảng Bus (gán driverId cho xe)
    if (busId && busId !== '') {
      await Bus.findByIdAndUpdate(busId, { driverId: newUser._id });
    }

    return NextResponse.json({ 
      message: 'Tạo tài xế thành công', 
      driver: newDriver 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating driver:', error);
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}