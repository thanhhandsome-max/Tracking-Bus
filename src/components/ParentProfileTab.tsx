'use client';

import React, { useState, useEffect } from 'react';

interface ParentProfile {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  occupation: string;
}

interface Student {
  _id: string;
  name: string;
  class: string;
  school: string;
  age?: number;
}

interface ParentProfileTabProps {
  parentId: string;
}

export default function ParentProfileTab({ parentId }: ParentProfileTabProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [profile, setProfile] = useState<ParentProfile>({
    id: parentId,
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Nam',
    address: '',
    occupation: '',
  });

  useEffect(() => {
    loadParentProfile();
  }, [parentId]);

  const loadParentProfile = async () => {
    setLoading(true);
    try {
      // Lấy thông tin từ localStorage trước
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        
        // Parse name thành firstName và lastName
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts.pop() || '';
        const lastName = nameParts.join(' ') || '';
        
        setProfile({
          id: user._id || parentId,
          firstName: firstName,
          lastName: lastName,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          dateOfBirth: '',
          gender: 'Nam',
          address: user.address || '',
          occupation: '',
        });

        // Set students nếu có
        if (user.students && user.students.length > 0) {
          setStudents(user.students);
        }
      }
      
      // Nếu cần load từ API (optional)
      // const response = await fetch(`/api/parent/profile?parentId=${parentId}`);
      // if (response.ok) {
      //   const data = await response.json();
      //   if (data.parent) {
      //     setProfile(data.parent);
      //   }
      // }
    } catch (error) {
      console.error('Error loading parent profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/parent/profile?parentId=${parentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (response.ok) {
        alert('Cập nhật thông tin thành công!');
        loadParentProfile();
      } else {
        alert('Cập nhật thất bại!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
        Thông tin phụ huynh
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Họ
            </label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Tên
            </label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
            Số điện thoại
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Ngày sinh
            </label>
            <input
              type="text"
              value={profile.dateOfBirth}
              onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
              placeholder="DD/MM/YYYY"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Giới tính
            </label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
            Địa chỉ
          </label>
          <textarea
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
            Nghề nghiệp
          </label>
          <input
            type="text"
            value={profile.occupation}
            onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Danh sách con */}
        {students.length > 0 && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '1rem', 
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>👨‍👩‍👧‍👦</span>
              Danh sách con ({students.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {students.map((student, index) => (
                <div 
                  key={student._id || index}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#dbeafe',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    👶
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '0.875rem',
                      color: '#1f2937',
                      marginBottom: '0.25rem'
                    }}>
                      {student.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <span>📚 Lớp {student.class}</span>
                      <span>•</span>
                      <span>🏫 {student.school}</span>
                      {student.age && (
                        <>
                          <span>•</span>
                          <span>🎂 {student.age} tuổi</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
