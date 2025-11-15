import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user.model';
import Parent from '@/models/parent.model';
import Driver from '@/models/driver.model';
import bcrypt from 'bcryptjs';

// GET all users
export async function GET() {
  try {
    await connectDB();

    const users = await User.find({}).select('-password');
    
    return NextResponse.json(
      { 
        message: 'Lấy danh sách user thành công',
        users: users,
        total: users.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, role, name, phone, address } = body;

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json(
        { message: 'Vui lòng nhập email, mật khẩu và vai trò' },
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
      role
    });

    // Create related profile based on role
    if (role === 'parent' && name && phone && address) {
      const nameParts = name.split(' ');
      const lastName = nameParts.pop() || '';
      const firstName = nameParts.join(' ') || 'User';

      await Parent.create({
        userId: newUser._id,
        firstName,
        lastName,
        name,
        email,
        phone,
        address
      });
    } else if (role === 'driver' && name && phone) {
      await Driver.create({
        userId: newUser._id,
        name,
        email,
        phone,
        licenseNumber: ''
      });
    }

    return NextResponse.json(
      { 
        message: 'Tạo user thành công',
        user: {
          _id: newUser._id,
          email: newUser.email,
          role: newUser.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
