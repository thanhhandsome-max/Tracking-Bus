'use client';

import React, { useState, useEffect } from 'react';

interface Student {
  _id: string;
  name: string;
  old: number;
  age?: number;
  classstudent?: string;
  class?: string;
  school?: string;
  parentId: string;
}

interface StudentManagementTabProps {
  parentId: string;
}

export default function StudentManagementTab({ parentId }: StudentManagementTabProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', old: 6, classstudent: '' });

  useEffect(() => {
    loadStudents();
  }, [parentId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Lấy students từ localStorage trước
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.students && user.students.length > 0) {
          setStudents(user.students);
          setLoading(false);
          return;
        }
      }

      // Nếu không có trong localStorage, gọi API
      const response = await fetch(`/api/students?parentId=${parentId}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) {
      alert('Vui lòng nhập tên học sinh');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStudent.name,
          parentId: parentId,
          old: newStudent.old,
          classstudent: newStudent.classstudent,
        }),
      });
      
      if (response.ok) {
        alert('Thêm học sinh thành công!');
        setShowAddStudent(false);
        setNewStudent({ name: '', old: 6, classstudent: '' });
        loadStudents();
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/students?studentId=${studentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('Xóa học sinh thành công!');
        loadStudents();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          Quản lý học sinh
        </h2>
        <button
          onClick={() => setShowAddStudent(true)}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          + Thêm học sinh
        </button>
      </div>

      {showAddStudent && (
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Thêm học sinh mới</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Tên học sinh"
              value={newStudent.name}
              onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            <select
              value={newStudent.old}
              onChange={(e) => setNewStudent({...newStudent, old: Number(e.target.value)})}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value={6}>6 tuổi</option>
              <option value={7}>7 tuổi</option>
              <option value={8}>8 tuổi</option>
              <option value={9}>9 tuổi</option>
              <option value={10}>10 tuổi</option>
              <option value={11}>11 tuổi</option>
              <option value={12}>12 tuổi</option>
              <option value={13}>13 tuổi</option>
              <option value={14}>14 tuổi</option>
              <option value={15}>15 tuổi</option>
              <option value={16}>16 tuổi</option>
              <option value={17}>17 tuổi</option>
              <option value={18}>18 tuổi</option>
            </select>
            <input
              type="text"
              placeholder="Lớp"
              value={newStudent.classstudent}
              onChange={(e) => setNewStudent({...newStudent, classstudent: e.target.value})}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleAddStudent}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {loading ? 'Đang thêm...' : 'Thêm'}
              </button>
              <button
                onClick={() => {
                  setShowAddStudent(false);
                  setNewStudent({ name: '', old: 6, classstudent: '' });
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Đang tải...
        </div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Chưa có học sinh nào
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem' 
        }}>
          {students.map((student, index) => (
            <div
              key={student._id}
              style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                position: 'relative'
              }}
            >
              {/* Avatar bên trái */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#f3f4f6',
                flexShrink: 0
              }}>
                <img
                  src={`/avt${(index % 2) + 1}.svg`}
                  alt={student.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>

              {/* Thông tin học sinh ở giữa */}
              <div style={{ flex: 1 }}>
                <p style={{ 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: 0,
                  fontSize: '1.125rem',
                  marginBottom: '0.5rem'
                }}>
                  {student.name}
                </p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Mã học sinh: HS{String(index + 1).padStart(4, '0')}
                </p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Tuổi: {student.age || student.old}
                </p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Lớp: {student.class || student.classstudent || 'Chưa cập nhật'}
                </p>
                {student.school && (
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    margin: 0
                  }}>
                    Trường: {student.school}
                  </p>
                )}
              </div>

              {/* QR Code bên phải */}
              <div style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="110" height="110" viewBox="0 0 70 70">
                  <rect width="70" height="70" fill="white"/>
                  <rect x="5" y="5" width="25" height="25" fill="black"/>
                  <rect x="40" y="5" width="25" height="25" fill="black"/>
                  <rect x="5" y="40" width="25" height="25" fill="black"/>
                  <rect x="10" y="10" width="15" height="15" fill="white"/>
                  <rect x="45" y="10" width="15" height="15" fill="white"/>
                  <rect x="10" y="45" width="15" height="15" fill="white"/>
                  <rect x="35" y="35" width="5" height="5" fill="black"/>
                  <rect x="45" y="40" width="5" height="5" fill="black"/>
                  <rect x="55" y="35" width="5" height="5" fill="black"/>
                  <rect x="40" y="50" width="5" height="5" fill="black"/>
                  <rect x="50" y="55" width="5" height="5" fill="black"/>
                  <rect x="60" y="45" width="5" height="5" fill="black"/>
                </svg>
              </div>

              {/* Nút xóa (có thể ẩn hoặc hiển thị khi hover) */}
              <button
                onClick={() => handleDeleteStudent(student._id)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  opacity: 0.7,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
