import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user.model';
import Parent from '@/models/parent.model';

// GET single parent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const parent = await Parent.findById(id).populate('userId', 'email');

    if (!parent) {
      return NextResponse.json(
        { message: 'Không tìm thấy phụ huynh' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { parent },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching parent:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// PUT update parent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, phone, address } = body;

    const parent = await Parent.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone,
        address
      },
      { new: true }
    );

    if (!parent) {
      return NextResponse.json(
        { message: 'Không tìm thấy phụ huynh' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Cập nhật phụ huynh thành công', parent },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating parent:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}

// DELETE parent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const parent = await Parent.findByIdAndDelete(id);

    if (!parent) {
      return NextResponse.json(
        { message: 'Không tìm thấy phụ huynh' },
        { status: 404 }
      );
    }

    // Also delete associated user
    if (parent.userId) {
      await User.findByIdAndDelete(parent.userId);
    }

    return NextResponse.json(
      { message: 'Xóa phụ huynh thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting parent:', error);
    return NextResponse.json(
      { message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
