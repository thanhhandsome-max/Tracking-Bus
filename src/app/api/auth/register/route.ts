import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Parent from '@/models/parent.model';
import Student from '@/models/student.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      email, 
      password, 
      fullName, 
      phone, 
      studentName, 
      studentClass, 
      school 
    } = body;

    // Check if user already exists
    const existingParent = await Parent.findOne({ email });
    if (existingParent) {
      return NextResponse.json(
        { message: 'Email đã được đăng ký' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student first
    const student = await Student.create({
      studentId: `STD${Date.now()}`,
      name: studentName,
      class: studentClass,
      school: school,
      status: 'not_picked_up',
      pickupLocation: '',
      dropoffLocation: '',
      currentLocation: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });

    // Create parent with student reference
    const parent = await Parent.create({
      parentId: `PAR${Date.now()}`,
      name: fullName,
      email: email,
      password: hashedPassword,
      phone: phone,
      students: [student._id],
      notifications: [],
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        parentId: parent.parentId,
        email: parent.email,
        name: parent.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      parentId: parent.parentId,
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      students: [{
        studentId: student.studentId,
        name: student.name,
        class: student.class,
        school: student.school
      }]
    };

    return NextResponse.json(
      { 
        message: 'Đăng ký thành công',
        user: userData,
        token: token
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'Lỗi server, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}
