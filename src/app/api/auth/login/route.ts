import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user.model';
import Parent from '@/models/parent.model';
import Driver from '@/models/driver.model';
import Student from '@/models/student.model';
import Bus from '@/models/bus.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Ensure models are registered
    const _bus = Bus;
    const _student = Student;
    const _parent = Parent;
    const _driver = Driver;

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Vui lòng nhập email và mật khẩu' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Handle different user roles
    let userData: any = {};
    let token: string = '';

    if (user.role === 'parent') {
      // Find parent info
      const parent = await Parent.findOne({ userId: user._id });
      
      if (!parent) {
        return NextResponse.json(
          { message: 'Không tìm thấy thông tin phụ huynh' },
          { status: 404 }
        );
      }

      // Find students of this parent
      const students = await Student.find({ parentId: parent._id });

      // Prepare student data
      const studentsData = students.map((student: any) => ({
        _id: student._id,
        name: student.name,
        class: student.classstudent,
        school: 'Tiểu học ABC',
        age: student.old
      }));

      // Student IDs for filtering
      const studentIds = students.map((s: any) => s._id.toString());

      // Generate JWT token for parent
      token = jwt.sign(
        { 
          userId: user._id,
          profileId: parent._id,
          email: user.email,
          name: parent.name,
          role: 'parent'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      userData = {
        _id: parent._id,
        userId: user._id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        address: parent.address,
        role: 'parent',
        students: studentsData,
        studentIds: studentIds // Thêm studentIds để filter trips
      };
    } 
    else if (user.role === 'driver') {
      // Find driver info
      const driver = await Driver.findOne({ userId: user._id }).populate('busId');
      
      if (!driver) {
        return NextResponse.json(
          { message: 'Không tìm thấy thông tin tài xế' },
          { status: 404 }
        );
      }

      // Generate JWT token for driver
      token = jwt.sign(
        { 
          userId: user._id,
          profileId: driver._id,
          email: user.email,
          name: driver.name,
          role: 'driver'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      userData = {
        _id: driver._id,
        userId: user._id,
        name: driver.name,
        email: user.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        role: 'driver',
        bus: driver.busId ? {
          _id: driver.busId._id,
          plateNumber: driver.busId.plateNumber,
          capacity: driver.busId.capacity
        } : null
      };
    }
    else if (user.role === 'admin') {
      // Generate JWT token for admin
      token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      userData = {
        _id: user._id,
        userId: user._id,
        email: user.email,
        role: 'admin'
      };
    }

    return NextResponse.json(
      { 
        message: 'Đăng nhập thành công',
        user: userData,
        token: token
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Lỗi server, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}
