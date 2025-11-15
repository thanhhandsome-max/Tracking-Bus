"use client";
import React, { useState, useEffect } from 'react';
import styles from './AdminParentManagement.module.css';

interface Parent {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

const AdminParentManagement: React.FC = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  });

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  });

  // Fetch parents
  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/parents');
      const data = await response.json();
      if (response.ok) {
        setParents(data.parents);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải danh sách phụ huynh');
    }
    setLoading(false);
  };

  const handleSelectParent = (parent: Parent) => {
    setSelectedParent(parent);
    setEditForm({
      firstName: parent.firstName,
      lastName: parent.lastName,
      phone: parent.phone,
      address: parent.address
    });
    setShowUpdateModal(true);
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName || !createForm.phone) {
      setError('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setShowCreateModal(false);
        setCreateForm({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          address: ''
        });
        await fetchParents();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tạo phụ huynh');
    }
    setLoading(false);
  };

  const handleUpdateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/parents/${selectedParent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setShowUpdateModal(false);
        setSelectedParent(null);
        await fetchParents();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi cập nhật phụ huynh');
    }
    setLoading(false);
  };

  const handleDeleteParent = async (id: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa phụ huynh này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/parents/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setError('');
        await fetchParents();
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xóa phụ huynh');
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý Phụ huynh</h1>
        <button 
          className={styles.addBtn}
          onClick={() => setShowCreateModal(true)}
        >
          + Thêm phụ huynh
        </button>
        <div className={styles.stats}>
          Tổng: <span>{parents.length}</span> phụ huynh
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Họ</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Địa chỉ</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && parents.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.loading}>Đang tải...</td>
              </tr>
            ) : parents.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>Không có phụ huynh nào</td>
              </tr>
            ) : (
              parents.map(parent => (
                <tr key={parent._id}>
                  <td>{parent.firstName}</td>
                  <td>{parent.lastName}</td>
                  <td>{parent.email}</td>
                  <td>{parent.phone}</td>
                  <td>{parent.address}</td>
                  <td className={styles.actions}>
                    <button 
                      className={styles.editBtn}
                      onClick={() => handleSelectParent(parent)}
                    >
                      Sửa
                    </button>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteParent(parent._id)}
                      disabled={loading}
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

      {/* Create Parent Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <h2>Tạo phụ huynh mới</h2>
            <form onSubmit={handleCreateParent}>
              <div className={styles.formGroup}>
                <label htmlFor="createEmail">Email:</label>
                <input
                  id="createEmail"
                  type="email"
                  name="email"
                  placeholder="Nhập email"
                  value={createForm.email}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createPassword">Mật khẩu:</label>
                <input
                  id="createPassword"
                  type="password"
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={createForm.password}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="createFirstName">Họ:</label>
                  <input
                    id="createFirstName"
                    type="text"
                    name="firstName"
                    placeholder="Nhập họ"
                    value={createForm.firstName}
                    onChange={handleCreateInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="createLastName">Tên:</label>
                  <input
                    id="createLastName"
                    type="text"
                    name="lastName"
                    placeholder="Nhập tên"
                    value={createForm.lastName}
                    onChange={handleCreateInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createPhone">Điện thoại:</label>
                <input
                  id="createPhone"
                  type="tel"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  value={createForm.phone}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createAddress">Địa chỉ:</label>
                <input
                  id="createAddress"
                  type="text"
                  name="address"
                  placeholder="Nhập địa chỉ"
                  value={createForm.address}
                  onChange={handleCreateInputChange}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo phụ huynh'}
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

      {/* Update Parent Modal */}
      {showUpdateModal && selectedParent && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowUpdateModal(false)}>&times;</span>
            <h2>Cập nhật thông tin phụ huynh</h2>
            <form onSubmit={handleUpdateParent}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">Họ:</label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    placeholder="Nhập họ"
                    value={editForm.firstName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Tên:</label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    placeholder="Nhập tên"
                    value={editForm.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Điện thoại:</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  value={editForm.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="address">Địa chỉ:</label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  placeholder="Nhập địa chỉ"
                  value={editForm.address}
                  onChange={handleInputChange}
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

export default AdminParentManagement;
