"use client";
import React, { useState, useEffect } from 'react';
import styles from './AdminRouteManagement.module.css';

interface Route {
  _id: string;
  name: string;
  department: string;
  arrival: string;
  time: string;
  busId?: { _id: string; plateNumber: string; capacity: number };
  stops: Array<{ stopId: { _id: string; name: string; address: string }; order: number; estimatedArrivalTime: string }>;
  createdAt: string;
}

const AdminRouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    department: '',
    arrival: '',
    time: '',
    busId: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    arrival: '',
    time: '',
    busId: ''
  });

  // Fetch routes
  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/routes');
      const data = await response.json();
      if (response.ok) {
        setRoutes(data.routes);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải danh sách tuyến đường');
    }
    setLoading(false);
  };

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    setEditForm({
      name: route.name,
      department: route.department,
      arrival: route.arrival,
      time: route.time,
      busId: route.busId?._id || ''
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

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!createForm.name || !createForm.department || !createForm.arrival || !createForm.time) {
      setError('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          department: '',
          arrival: '',
          time: '',
          busId: ''
        });
        await fetchRoutes();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tạo tuyến đường');
    }
    setLoading(false);
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/routes/${selectedRoute._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setShowUpdateModal(false);
        setSelectedRoute(null);
        await fetchRoutes();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi cập nhật tuyến đường');
    }
    setLoading(false);
  };

  const handleDeleteRoute = async (id: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa tuyến đường này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/routes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setError('');
        await fetchRoutes();
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xóa tuyến đường');
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
        <h1>Quản lý Tuyến đường</h1>
        <button 
          className={styles.addBtn}
          onClick={() => setShowCreateModal(true)}
        >
          + Thêm tuyến đường
        </button>
        <div className={styles.stats}>
          Tổng: <span>{routes.length}</span> tuyến
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên tuyến</th>
              <th>Phòng ban</th>
              <th>Nơi đến</th>
              <th>Giờ</th>
              <th>Xe</th>
              <th>Số dừng</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && routes.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.loading}>Đang tải...</td>
              </tr>
            ) : routes.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>Không có tuyến đường nào</td>
              </tr>
            ) : (
              routes.map(route => (
                <tr key={route._id}>
                  <td>{route.name}</td>
                  <td>{route.department}</td>
                  <td>{route.arrival}</td>
                  <td>{route.time}</td>
                  <td>{route.busId?.plateNumber || 'Chưa gán'}</td>
                  <td>{route.stops?.length || 0}</td>
                  <td className={styles.actions}>
                    <button 
                      className={styles.editBtn}
                      onClick={() => handleSelectRoute(route)}
                    >
                      Sửa
                    </button>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteRoute(route._id)}
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

      {/* Create Route Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <h2>Tạo tuyến đường mới</h2>
            <form onSubmit={handleCreateRoute}>
              <div className={styles.formGroup}>
                <label htmlFor="createName">Tên tuyến:</label>
                <input
                  id="createName"
                  type="text"
                  name="name"
                  placeholder="Nhập tên tuyến đường"
                  value={createForm.name}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createDepartment">Phòng ban:</label>
                <input
                  id="createDepartment"
                  type="text"
                  name="department"
                  placeholder="Nhập phòng ban"
                  value={createForm.department}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createArrival">Nơi đến:</label>
                <input
                  id="createArrival"
                  type="text"
                  name="arrival"
                  placeholder="Nhập nơi đến"
                  value={createForm.arrival}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createTime">Giờ:</label>
                <input
                  id="createTime"
                  type="text"
                  name="time"
                  placeholder="Nhập giờ (vd: 07:00)"
                  value={createForm.time}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createBusId">Mã xe (tùy chọn):</label>
                <input
                  id="createBusId"
                  type="text"
                  name="busId"
                  placeholder="Nhập mã xe"
                  value={createForm.busId}
                  onChange={handleCreateInputChange}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo tuyến đường'}
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

      {/* Update Route Modal */}
      {showUpdateModal && selectedRoute && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowUpdateModal(false)}>&times;</span>
            <h2>Cập nhật tuyến đường</h2>
            <form onSubmit={handleUpdateRoute}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Tên tuyến:</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Nhập tên tuyến đường"
                  value={editForm.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="department">Phòng ban:</label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  placeholder="Nhập phòng ban"
                  value={editForm.department}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="arrival">Nơi đến:</label>
                <input
                  id="arrival"
                  type="text"
                  name="arrival"
                  placeholder="Nhập nơi đến"
                  value={editForm.arrival}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="time">Giờ:</label>
                <input
                  id="time"
                  type="text"
                  name="time"
                  placeholder="Nhập giờ (vd: 07:00)"
                  value={editForm.time}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="busId">Mã xe (tùy chọn):</label>
                <input
                  id="busId"
                  type="text"
                  name="busId"
                  placeholder="Nhập mã xe"
                  value={editForm.busId}
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

export default AdminRouteManagement;
