import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user.model';
import Parent from '@/models/parent.model';
import mongoose from 'mongoose';

// GET: Lấy chi tiết 1 phụ huynh
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID phụ huynh không hợp lệ' }, { status: 400 });
    }

    const parent = await Parent.findById(id).populate('userId', 'email');

    if (!parent) {
      return NextResponse.json({ message: 'Không tìm thấy phụ huynh' }, { status: 404 });
    }

    return NextResponse.json({ parent }, { status: 200 });
  } catch (error) {
    console.error('Error fetching parent:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// PUT: Cập nhật phụ huynh
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID phụ huynh không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, address } = body;

    const parent = await Parent.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        name: `${firstName || ''} ${lastName || ''}`.trim(),
        phone,
        address
      },
      { new: true, runValidators: true }
    );

    if (!parent) {
      return NextResponse.json({ message: 'Không tìm thấy phụ huynh' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Cập nhật phụ huynh thành công', parent }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating parent:', error);
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

// DELETE: Xóa phụ huynh
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID phụ huynh không hợp lệ' }, { status: 400 });
    }

    const parent = await Parent.findByIdAndDelete(id);

    if (!parent) {
      return NextResponse.json({ message: 'Không tìm thấy phụ huynh' }, { status: 404 });
    }

    // Xóa luôn User liên kết nếu có
    if (parent.userId) {
      await User.findByIdAndDelete(parent.userId);
    }

    return NextResponse.json({ message: 'Xóa phụ huynh thành công' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting parent:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}
