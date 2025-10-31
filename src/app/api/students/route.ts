import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/student.model';

// GET - Lấy danh sách học sinh của phụ huynh
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const parentId = request.nextUrl.searchParams.get('parentId');
    
    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    const students = await Student.find({ parentId });

    return NextResponse.json({
      students: students.map(student => ({
        _id: student._id,
        name: student.name,
        parentId: student.parentId,
        old: student.old,
        classstudent: student.classstudent,
      }))
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Thêm học sinh mới
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, parentId, old, classstudent } = body;

    if (!name || !parentId) {
      return NextResponse.json({ error: 'Name and Parent ID are required' }, { status: 400 });
    }

    const newStudent = await Student.create({
      name,
      parentId,
      old,
      classstudent
    });

    return NextResponse.json({
      success: true,
      student: {
        _id: newStudent._id,
        name: newStudent.name,
        parentId: newStudent.parentId,
        old: newStudent.old,
        classstudent: newStudent.classstudent,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Cập nhật thông tin học sinh
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { studentId, name, old, classstudent } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { name, old, classstudent },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student: {
        _id: updatedStudent._id,
        name: updatedStudent.name,
        parentId: updatedStudent.parentId,
        old: updatedStudent.old,
        classstudent: updatedStudent.classstudent,
      }
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Xóa học sinh
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const studentId = request.nextUrl.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const deletedStudent = await Student.findByIdAndDelete(studentId);

    if (!deletedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
