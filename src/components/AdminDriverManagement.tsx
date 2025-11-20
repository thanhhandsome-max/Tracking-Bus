"use client";
import React, { useState, useEffect } from 'react';
import styles from './AdminDriverManagement.module.css';

interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  busPlateNumber?: string;
  busId?: string | null;
  status: string;
  createdAt: string;
}

const AdminDriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [driverStats, setDriverStats] = useState<{
    totalTrips: number;
    totalDrivers: number;
    statistics: Array<{ driverId: string; driverName: string; tripCount: number }>;
  } | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    licenseNumber: '',
    busId: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    status: 'active'
  });
  
  // include busId in editForm
  useEffect(() => {
    // ensure editForm has busId when selectedDriver changes
    if (selectedDriver) {
      setEditForm(prev => ({ ...prev, busId: selectedDriver.busId || '' } as any));
    }
  }, [selectedDriver]);

  const [buses, setBuses] = useState<Array<{ _id: string; plateNumber?: string; capacity?: number }>>([]);

  // Fetch drivers
  useEffect(() => {
    fetchDrivers();
    fetchBuses();
    fetchDriverStatistics();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/drivers');
      const data = await response.json();
      if (response.ok) {
        setDrivers(data.drivers);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải danh sách tài xế');
    }
    setLoading(false);
  };

  const fetchDriverStatistics = async (month?: number, year?: number) => {
    setStatsLoading(true);
    try {
      const now = new Date();
      const m = month ?? now.getMonth() + 1;
      const y = year ?? now.getFullYear();
      const res = await fetch(`/api/admin/driver-statistics?month=${m}&year=${y}`);
      const data = await res.json();
      if (res.ok) {
        setDriverStats({
          totalTrips: data.totalTrips || 0,
          totalDrivers: data.totalDrivers || 0,
          statistics: (data.statistics || []).map((s: any) => ({
            driverId: s.driverId,
            driverName: s.driverName,
            tripCount: s.tripCount
          }))
        });
      } else {
        console.warn('Failed to load driver statistics', data.message);
      }
    } catch (err) {
      console.error('Error fetching driver statistics', err);
    }
    setStatsLoading(false);
  };

  const fetchBuses = async () => {
    try {
      const res = await fetch('/api/admin/buses');
      const data = await res.json();
      if (res.ok) setBuses(data.buses || []);
    } catch (err) {
      console.error('Error fetching buses', err);
    }
  };

  const handleSelectDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setEditForm({
      name: driver.name,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      status: driver.status
    });
    setShowUpdateModal(true);
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!createForm.email || !createForm.password || !createForm.name || !createForm.phone || !createForm.licenseNumber) {
      setError('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { ...createForm };
      // send null if no bus selected
      if (payload.busId === '') payload.busId = null;

      const response = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setShowCreateModal(false);
        setCreateForm({
          email: '',
          password: '',
          name: '',
          phone: '',
          licenseNumber: '',
          busId: ''
        });
        await fetchDrivers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tạo tài xế');
    }
    setLoading(false);
  };

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/drivers/${selectedDriver._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setShowUpdateModal(false);
        setSelectedDriver(null);
        await fetchDrivers();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi cập nhật tài xế');
    }
    setLoading(false);
  };

  const handleDeleteDriver = async (id: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa tài xế này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/drivers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setError('');
        await fetchDrivers();
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xóa tài xế');
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý Tài xế</h1>
        <button 
          className={styles.addBtn}
          onClick={() => setShowCreateModal(true)}
        >
          + Thêm tài xế
        </button>
        <div className={styles.stats}>
          Tổng: <span>{drivers.length}</span> tài xế
        </div>

        <div className={styles.statsExtra}>
          {statsLoading ? (
            <div className={styles.smallLoading}>Đang tải thống kê...</div>
          ) : driverStats ? (
            <>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Tổng chuyến</div>
                <div className={styles.statValue}>{driverStats.totalTrips}</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statLabel}>Trung bình/tài xế</div>
                <div className={styles.statValue}>
                  {driverStats.totalDrivers > 0 ? (driverStats.totalTrips / driverStats.totalDrivers).toFixed(2) : '0'}
                </div>
              </div>

              <div className={styles.topList}>
                {driverStats.statistics.slice(0, 3).map((d, i) => (
                  <div key={d.driverId} className={styles.topItem}>
                    <span className={styles.topRank}>{i + 1}.</span>
                    <span className={styles.topName}>{d.driverName}</span>
                    <span className={styles.topCount}>{d.tripCount} chuyến</span>
                  </div>
                ))}
              </div>

              <button className={styles.refreshBtn} onClick={() => fetchDriverStatistics()}>
                Làm mới thống kê
              </button>
            </>
          ) : (
            <div className={styles.smallLoading}>Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Giấy phép</th>
              <th>Xe</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && drivers.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.loading}>Đang tải...</td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>Không có tài xế nào</td>
              </tr>
            ) : (
              drivers.map(driver => (
                <tr key={driver._id}>
                  <td>{driver.name}</td>
                  <td>{driver.email}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.licenseNumber}</td>
                  <td>{driver.busPlateNumber || 'Chưa gán'}</td>
                  <td>
                    <span className={`${styles.status} ${styles[`status-${driver.status}`]}`}>
                      {driver.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button 
                      className={styles.editBtn}
                      onClick={() => handleSelectDriver(driver)}
                    >
                      Sửa
                    </button>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteDriver(driver._id)}
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

      {/* Create Driver Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <h2>Tạo tài xế mới</h2>
            <form onSubmit={handleCreateDriver}>
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

              <div className={styles.formGroup}>
                <label htmlFor="createName">Tên:</label>
                <input
                  id="createName"
                  type="text"
                  name="name"
                  placeholder="Nhập tên tài xế"
                  value={createForm.name}
                  onChange={handleCreateInputChange}
                  required
                />
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
                <label htmlFor="createLicenseNumber">Giấy phép lái xe:</label>
                <input
                  id="createLicenseNumber"
                  type="text"
                  name="licenseNumber"
                  placeholder="Nhập số giấy phép"
                  value={createForm.licenseNumber}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createBus">Gán xe (tùy chọn):</label>
                <select
                  id="createBus"
                  name="busId"
                  value={createForm.busId}
                  onChange={(e) => handleCreateInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                >
                  <option value="">-- Chưa gán --</option>
                  {buses.map(b => (
                    <option key={b._id} value={b._id}>{b.plateNumber} (S:{b.capacity})</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo tài xế'}
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

      {/* Update Driver Modal */}
      {showUpdateModal && selectedDriver && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowUpdateModal(false)}>&times;</span>
            <h2>Cập nhật thông tin tài xế</h2>
            <form onSubmit={handleUpdateDriver}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Tên:</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Nhập tên tài xế"
                  value={editForm.name}
                  onChange={handleInputChange}
                />
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
                <label htmlFor="licenseNumber">Giấy phép lái xe:</label>
                <input
                  id="licenseNumber"
                  type="text"
                  name="licenseNumber"
                  placeholder="Nhập số giấy phép"
                  value={editForm.licenseNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="editBus">Gán xe</label>
                <select
                  id="editBus"
                  name="busId"
                  value={(editForm as any).busId || ''}
                  onChange={handleInputChange}
                >
                  <option value="">-- Chưa gán --</option>
                  {buses.map(b => (
                    <option key={b._id} value={b._id}>{b.plateNumber} (S:{b.capacity})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="status">Trạng thái:</label>
                <select
                  id="status"
                  name="status"
                  value={editForm.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
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

export default AdminDriverManagement;
