import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Parent from '@/models/parent.model';
import Student from '@/models/student.model';

// GET - Lấy thông tin phụ huynh và danh sách con
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // TODO: Lấy parentId từ session/token
    const parentId = request.nextUrl.searchParams.get('parentId');
    
    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    // Lấy thông tin phụ huynh
    const parent = await Parent.findById(parentId).populate('userId');
    
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // Lấy danh sách học sinh của phụ huynh này
    const students = await Student.find({ parentId });

    return NextResponse.json({
      parent: {
        id: parent._id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        address: parent.address,
        dateOfBirth: parent.dateOfBirth,
        gender: parent.gender,
        occupation: parent.occupation,
        passportNumber: parent.passportNumber,
      },
      students: students.map(student => ({
        id: student._id,
        name: student.name,
        old: student.old,
        classstudent: student.classstudent,
      }))
    });
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Cập nhật thông tin phụ huynh
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const parentId = request.nextUrl.searchParams.get('parentId');
    const body = await request.json();
    const { firstName, lastName, email, phone, address, dateOfBirth, gender, occupation, passportNumber } = body;

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    // Tạo name từ firstName và lastName
    const name = `${lastName} ${firstName}`.trim();

    const updatedParent = await Parent.findByIdAndUpdate(
      parentId,
      { 
        firstName, 
        lastName, 
        name, 
        email, 
        phone, 
        address, 
        dateOfBirth, 
        gender, 
        occupation, 
        passportNumber 
      },
      { new: true, runValidators: true }
    );

    if (!updatedParent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      parent: {
        id: updatedParent._id,
        firstName: updatedParent.firstName,
        lastName: updatedParent.lastName,
        name: updatedParent.name,
        email: updatedParent.email,
        phone: updatedParent.phone,
        address: updatedParent.address,
        dateOfBirth: updatedParent.dateOfBirth,
        gender: updatedParent.gender,
        occupation: updatedParent.occupation,
        passportNumber: updatedParent.passportNumber,
      }
    });
  } catch (error) {
    console.error('Error updating parent profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
