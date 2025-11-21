"use client";
import React, { useState, useEffect } from 'react';
import styles from './AdminUserManagement.module.css';

interface User {
  _id: string;
  email: string;
  role: 'admin' | 'parent' | 'driver';
  createdAt: string;
}

// 1. Thêm licenseNumber vào interface
interface CreateUserForm {
  email: string;
  password: string;
  role: 'parent' | 'driver';
  name: string;
  phone: string;
  address?: string;       // Chỉ cho Parent
  licenseNumber?: string; // Chỉ cho Driver
}

interface UpdateUserForm {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  address?: string;       // Chỉ cho Parent
  licenseNumber?: string; // Chỉ cho Driver
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 2. Cập nhật state mặc định
  const [createFormData, setCreateFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    role: 'parent',
    name: '',
    phone: '',
    address: '',
    licenseNumber: '' 
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateUserForm>({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    licenseNumber: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải danh sách user');
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Lọc bỏ trường thừa trước khi gửi
      const payload = { ...createFormData };
      if (payload.role === 'parent') delete payload.licenseNumber;
      if (payload.role === 'driver') delete payload.address;

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setShowCreateModal(false);
        setCreateFormData({
          email: '',
          password: '',
          role: 'parent',
          name: '',
          phone: '',
          address: '',
          licenseNumber: ''
        });
        await fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tạo user');
    }
    setLoading(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateFormData)
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setShowUpdateModal(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi cập nhật user');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa user này?')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setError('');
        await fetchUsers();
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xóa user');
    }
    setLoading(false);
  };

  const handleSelectUserForUpdate = (user: User) => {
    setSelectedUser(user);
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/admin/users/${user._id}`); // Gọi API GET detail bạn đã viết
        const data = await response.json();
        if (response.ok) {
          // 3. Map dữ liệu từ API vào form update
          setUpdateFormData({
            email: data.user.email || '',
            password: '',
            name: data.user.name || '', // Backend bạn trả về user.name (đã gộp từ profile)
            phone: data.user.phone || '',
            address: data.user.address || '',             // Có nếu là Parent
            licenseNumber: data.user.licenseNumber || ''  // Có nếu là Driver
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserData();
    setShowUpdateModal(true);
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý User</h1>
        <button className={styles.addBtn} onClick={() => setShowCreateModal(true)}>+ Thêm User</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
        {/* ... Phần bảng giữ nguyên ... */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan={4} className={styles.loading}>Đang tải...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className={styles.empty}>Không có user nào</td></tr>
            ) : (
              users.map(user => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge-${user.role}`]}`}>
                      {user.role === 'admin' ? 'Admin' : user.role === 'parent' ? 'Phụ huynh' : 'Tài xế'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className={styles.actions}>
                    <button 
                      className={styles.editBtn} 
                      onClick={() => handleSelectUserForUpdate(user)}
                      disabled={loading || user.role === 'admin'}
                    >Sửa</button>
                    <button 
                      className={styles.deleteBtn} 
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={loading || user.role === 'admin'}
                    >Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- Modal Tạo User Mới --- */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <h2>Tạo User Mới</h2>
            <form onSubmit={handleCreateUser}>
              {/* Email, Password, Role, Name, Phone giữ nguyên */}
              <div className={styles.formGroup}>
                <label htmlFor="create-email">Email:</label>
                <input id="create-email" type="email" name="email" placeholder="Nhập email" value={createFormData.email} onChange={handleCreateInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-password">Mật khẩu:</label>
                <input id="create-password" type="password" name="password" placeholder="Nhập mật khẩu" value={createFormData.password} onChange={handleCreateInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-role">Vai trò:</label>
                <select id="create-role" name="role" value={createFormData.role} onChange={handleCreateInputChange}>
                  <option value="parent">Phụ huynh</option>
                  <option value="driver">Tài xế</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-name">Họ và tên:</label>
                <input id="create-name" type="text" name="name" placeholder="Nhập họ và tên" value={createFormData.name} onChange={handleCreateInputChange} required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="create-phone">Số điện thoại:</label>
                <input id="create-phone" type="tel" name="phone" placeholder="Nhập số điện thoại" value={createFormData.phone} onChange={handleCreateInputChange} required />
              </div>

              {/* 4. Logic hiển thị ô nhập dựa trên Role khi TẠO */}
              {createFormData.role === 'parent' && (
                <div className={styles.formGroup}>
                  <label htmlFor="create-address">Địa chỉ:</label>
                  <input id="create-address" type="text" name="address" placeholder="Nhập địa chỉ" value={createFormData.address || ''} onChange={handleCreateInputChange} />
                </div>
              )}

              {createFormData.role === 'driver' && (
                <div className={styles.formGroup}>
                  <label htmlFor="create-license">Số bằng lái:</label>
                  <input id="create-license" type="text" name="licenseNumber" placeholder="Nhập số bằng lái" value={createFormData.licenseNumber || ''} onChange={handleCreateInputChange} required />
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo User'}</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal Cập Nhật User --- */}
      {showUpdateModal && selectedUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowUpdateModal(false)}>&times;</span>
            <h2>Cập nhật User ({selectedUser.role === 'parent' ? 'Phụ huynh' : 'Tài xế'})</h2>
            <form onSubmit={handleUpdateUser}>
              {/* Email, Password, Name, Phone giữ nguyên */}
              <div className={styles.formGroup}>
                <label htmlFor="update-email">Email:</label>
                <input id="update-email" type="email" name="email" placeholder="Email mới" value={updateFormData.email || ''} onChange={handleUpdateInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="update-password">Mật khẩu mới:</label>
                <input id="update-password" type="password" name="password" placeholder="Mật khẩu mới (nếu đổi)" value={updateFormData.password || ''} onChange={handleUpdateInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="update-name">Họ và tên:</label>
                <input id="update-name" type="text" name="name" placeholder="Họ tên mới" value={updateFormData.name || ''} onChange={handleUpdateInputChange} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="update-phone">Số điện thoại:</label>
                <input id="update-phone" type="tel" name="phone" placeholder="SĐT mới" value={updateFormData.phone || ''} onChange={handleUpdateInputChange} />
              </div>

              {/* 5. Logic hiển thị ô nhập dựa trên Role khi UPDATE */}
              {selectedUser.role === 'parent' && (
                <div className={styles.formGroup}>
                  <label htmlFor="update-address">Địa chỉ:</label>
                  <input id="update-address" type="text" name="address" placeholder="Địa chỉ mới" value={updateFormData.address || ''} onChange={handleUpdateInputChange} />
                </div>
              )}

              {selectedUser.role === 'driver' && (
                <div className={styles.formGroup}>
                  <label htmlFor="update-license">Số bằng lái:</label>
                  <input id="update-license" type="text" name="licenseNumber" placeholder="Số bằng lái mới" value={updateFormData.licenseNumber || ''} onChange={handleUpdateInputChange} />
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Đang cập nhật...' : 'Cập nhật'}</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowUpdateModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;