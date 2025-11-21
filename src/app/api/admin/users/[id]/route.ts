import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user.model';
import Parent from '@/models/parent.model';
import Driver from '@/models/driver.model';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

interface ProfileInfo {
  name?: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
}

// ======================= GET USER BY ID =======================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID user không hợp lệ' }, { status: 400 });
    }

    const user = await User.findById(id).select('-password');
    if (!user) return NextResponse.json({ message: 'User không tồn tại' }, { status: 404 });

    let profileInfo: ProfileInfo = {};

    if (user.role === 'parent') {
      const parent = await Parent.findOne({ userId: user._id });
      if (parent) 
        profileInfo = { name: parent.name, phone: parent.phone, address: parent.address };
    } else if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      if (driver) 
        profileInfo = { name: driver.name, phone: driver.phone, licenseNumber: driver.licenseNumber };
    }

    return NextResponse.json({
      user: { _id: user._id, email: user.email, role: user.role, ...profileInfo }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// ======================= PUT UPDATE USER =======================
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID user không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { email, password, name, phone, address, licenseNumber } = body;

    const user = await User.findById(id);
    if (!user) return NextResponse.json({ message: 'User không tồn tại' }, { status: 404 });

    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();

    if (user.role === 'parent') {
      const parent = await Parent.findOne({ userId: user._id });
      if (parent) {
        if (name) {
          const parts = name.split(' ');
          parent.lastName = parts.pop() || '';
          parent.firstName = parts.join(' ') || 'User';
          parent.name = name;
        }
        if (phone) parent.phone = phone;
        if (address) parent.address = address;
        await parent.save();
      }
    } else if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      if (driver) {
        if (name) driver.name = name;
        if (phone) driver.phone = phone;
        if (licenseNumber) driver.licenseNumber = licenseNumber;
        await driver.save();
      }
    }

    return NextResponse.json({
      message: 'Cập nhật user thành công',
      user: { _id: user._id, email: user.email, role: user.role }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// ======================= DELETE USER =======================
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID user không hợp lệ' }, { status: 400 });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return NextResponse.json({ message: 'User không tồn tại' }, { status: 404 });

    if (user.role === 'parent') await Parent.deleteOne({ userId: user._id });
    if (user.role === 'driver') await Driver.deleteOne({ userId: user._id });

    return NextResponse.json({ message: 'Xóa user thành công' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
