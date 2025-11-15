import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user.model';
import Parent from '@/models/parent.model';
import bcrypt from 'bcryptjs';

// GET all parents
export async function GET() {
  try {
    await connectDB();

    const parents = await Parent.find()
      .populate('userId', 'email')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { parents },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// POST create new parent
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, firstName, lastName, phone, address } = body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !phone) {
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
      role: 'parent'
    });

    // Create parent
    const newParent = await Parent.create({
      userId: newUser._id,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      address: address || ''
    });

    return NextResponse.json(
      { 
        message: 'Tạo phụ huynh thành công',
        parent: {
          _id: newParent._id,
          firstName: newParent.firstName,
          lastName: newParent.lastName,
          name: newParent.name,
          email: newParent.email,
          phone: newParent.phone,
          address: newParent.address
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating parent:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
