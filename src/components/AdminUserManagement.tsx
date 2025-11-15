"use client";
import React, { useState, useEffect } from 'react';
import styles from './AdminUserManagement.module.css';

interface User {
  _id: string;
  email: string;
  role: 'admin' | 'parent' | 'driver';
  createdAt: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  role: 'parent' | 'driver';
  name: string;
  phone: string;
  address?: string;
}

interface UpdateUserForm {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  address?: string;
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    role: 'parent',
    name: '',
    phone: '',
    address: ''
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateUserForm>({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: ''
  });

  // Fetch users
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
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData)
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
          address: ''
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
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });

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
    // Fetch full user data with profile info
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/admin/users/${user._id}`);
        const data = await response.json();
        if (response.ok) {
          setUpdateFormData({
            email: data.user.email || '',
            password: '',
            name: data.user.name || '',
            phone: data.user.phone || '',
            address: data.user.address || ''
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
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý User</h1>
        <button 
          className={styles.addBtn}
          onClick={() => setShowCreateModal(true)}
        >
          + Thêm User
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
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
              <tr>
                <td colSpan={4} className={styles.loading}>Đang tải...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>Không có user nào</td>
              </tr>
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
                    >
                      Sửa
                    </button>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={loading || user.role === 'admin'}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal tạo user mới */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <h2>Tạo User Mới</h2>
            <form onSubmit={handleCreateUser}>
              <div className={styles.formGroup}>
                <label htmlFor="create-email">Email:</label>
                <input
                  id="create-email"
                  type="email"
                  name="email"
                  placeholder="Nhập email"
                  value={createFormData.email}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="create-password">Mật khẩu:</label>
                <input
                  id="create-password"
                  type="password"
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={createFormData.password}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="create-role">Vai trò:</label>
                <select
                  id="create-role"
                  name="role"
                  value={createFormData.role}
                  onChange={handleCreateInputChange}
                >
                  <option value="parent">Phụ huynh</option>
                  <option value="driver">Tài xế</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="create-name">Họ và tên:</label>
                <input
                  id="create-name"
                  type="text"
                  name="name"
                  placeholder="Nhập họ và tên"
                  value={createFormData.name}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="create-phone">Số điện thoại:</label>
                <input
                  id="create-phone"
                  type="tel"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  value={createFormData.phone}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              {createFormData.role === 'parent' && (
                <div className={styles.formGroup}>
                  <label htmlFor="create-address">Địa chỉ:</label>
                  <input
                    id="create-address"
                    type="text"
                    name="address"
                    placeholder="Nhập địa chỉ"
                    value={createFormData.address || ''}
                    onChange={handleCreateInputChange}
                  />
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo User'}
                </button>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cập nhật user */}
      {showUpdateModal && selectedUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowUpdateModal(false)}>&times;</span>
            <h2>Cập nhật User</h2>
            <form onSubmit={handleUpdateUser}>
              <div className={styles.formGroup}>
                <label htmlFor="update-email">Email:</label>
                <input
                  id="update-email"
                  type="email"
                  name="email"
                  placeholder="Nhập email mới (tùy chọn)"
                  value={updateFormData.email || ''}
                  onChange={handleUpdateInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="update-password">Mật khẩu mới:</label>
                <input
                  id="update-password"
                  type="password"
                  name="password"
                  placeholder="Nhập mật khẩu mới (nếu muốn thay đổi)"
                  value={updateFormData.password || ''}
                  onChange={handleUpdateInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="update-name">Họ và tên:</label>
                <input
                  id="update-name"
                  type="text"
                  name="name"
                  placeholder="Nhập họ và tên mới (tùy chọn)"
                  value={updateFormData.name || ''}
                  onChange={handleUpdateInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="update-phone">Số điện thoại:</label>
                <input
                  id="update-phone"
                  type="tel"
                  name="phone"
                  placeholder="Nhập số điện thoại mới (tùy chọn)"
                  value={updateFormData.phone || ''}
                  onChange={handleUpdateInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="update-address">Địa chỉ:</label>
                <input
                  id="update-address"
                  type="text"
                  name="address"
                  placeholder="Nhập địa chỉ mới (tùy chọn)"
                  value={updateFormData.address || ''}
                  onChange={handleUpdateInputChange}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setShowUpdateModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
