"use client";
import React, { useEffect, useState } from 'react';
import styles from './AdminBusManagement.module.css';

interface Bus {
  _id: string;
  plateNumber: string;
  capacity: number;
  status: 'active' | 'maintenance';
  // driverId may be populated or just an id; keep flexible
  driverId?: any | null;
}

const AdminBusManagement: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState<Bus | null>(null);

  const [drivers, setDrivers] = useState<Array<{ _id: string; name?: string; email?: string }>>([]);

  const [createForm, setCreateForm] = useState({ plateNumber: '', capacity: '', status: 'active', driverId: '' });
  const [editForm, setEditForm] = useState({ plateNumber: '', capacity: '', status: 'active', driverId: '' });

  useEffect(() => { fetchBuses(); }, []);

  useEffect(() => { fetchDrivers(); }, []);

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/buses');
      const data = await res.json();
      if (res.ok) {
        setBuses(data.buses || []);
        setError('');
      } else {
        setError(data.message || 'Lỗi khi tải danh sách xe');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải danh sách xe');
    }
    setLoading(false);
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/admin/drivers');
      const data = await res.json();
      if (res.ok) {
        setDrivers(data.drivers || []);
      }
    } catch (err) {
      console.error('Error fetching drivers', err);
    }
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const capacity = parseInt(createForm.capacity, 10);
    if (!createForm.plateNumber || Number.isNaN(capacity)) {
      setError('Vui lòng nhập biển số và sức chứa (số)');
      return;
    }
    setLoading(true);
    try {
      const body: any = { plateNumber: createForm.plateNumber, capacity, status: createForm.status };
      if (createForm.driverId) body.driverId = createForm.driverId;

      const res = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ plateNumber: '', capacity: '', status: 'active', driverId: '' });
        await fetchBuses();
        setError('');
      } else setError(data.message || 'Lỗi khi tạo xe');
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tạo xe');
    }
    setLoading(false);
  };

  const openEdit = (bus: Bus) => {
    setSelected(bus);
    // try to pick a sensible driverId value from the bus object
    const driverIdVal = bus.driverId && (typeof bus.driverId === 'string' ? bus.driverId : (bus.driverId._id || bus.driverId.id || ''));
    setEditForm({ plateNumber: bus.plateNumber, capacity: String(bus.capacity), status: bus.status || 'active', driverId: driverIdVal || '' });
    setShowEdit(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const capacity = parseInt(editForm.capacity, 10);
    if (!editForm.plateNumber || Number.isNaN(capacity)) {
      setError('Vui lòng nhập biển số và sức chứa (số)');
      return;
    }
    setLoading(true);
    try {
      const body: any = { plateNumber: editForm.plateNumber, capacity, status: editForm.status };
      // include driverId explicitly (null to unassign)
      if (typeof editForm.driverId !== 'undefined') body.driverId = editForm.driverId === '' ? null : editForm.driverId;

      const res = await fetch(`/api/admin/buses/${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setShowEdit(false);
        setSelected(null);
        await fetchBuses();
        setError('');
      } else setError(data.message || 'Lỗi khi cập nhật xe');
    } catch (err) {
      console.error(err);
      setError('Lỗi khi cập nhật xe');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa xe này?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/buses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchBuses();
        setError('');
      } else {
        const data = await res.json();
        setError(data.message || 'Lỗi khi xóa xe');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xóa xe');
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý Xe Bus</h1>
        <button className={styles.addBtn} onClick={() => setShowCreate(true)}>+ Thêm xe</button>
        <div className={styles.stats}>Tổng: <span>{buses.length}</span> xe</div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Biển số</th>
              <th>Sức chứa</th>
              <th>Trạng thái</th>
              <th>Driver</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && buses.length === 0 ? (
              <tr><td colSpan={5} className={styles.loading}>Đang tải...</td></tr>
            ) : buses.length === 0 ? (
              <tr><td colSpan={5} className={styles.empty}>Không có xe</td></tr>
            ) : (
              buses.map(b => (
                <tr key={b._id}>
                  <td>{b.plateNumber}</td>
                  <td>{b.capacity}</td>
                  <td>{b.status}</td>
                  <td>{b.driverId ? ((b.driverId.firstName || b.driverId.lastName) ? `${b.driverId.firstName || ''} ${b.driverId.lastName || ''}` : (b.driverId.name || b.driverId.email || String(b.driverId))) : 'Chưa gán'}</td>
                  <td className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => openEdit(b)}>Sửa</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(b._id)} disabled={loading}>Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowCreate(false)}>&times;</span>
            <h2>Tạo xe mới</h2>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label>Biển số</label>
                <input name="plateNumber" placeholder="VD: 59A-12345" value={createForm.plateNumber} onChange={handleCreateChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Sức chứa</label>
                <input name="capacity" placeholder="Số học sinh" value={createForm.capacity} onChange={handleCreateChange} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="createDriver">Gán tài xế</label>
                <select id="createDriver" name="driverId" value={createForm.driverId} onChange={handleCreateChange}>
                  <option value="">Chưa gán</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name || d.email || d._id}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="createStatus">Trạng thái</label>
                <select id="createStatus" name="status" aria-label="Trạng thái" value={createForm.status} onChange={handleCreateChange}>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.submitBtn} type="submit" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo'}</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowCreate(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selected && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={() => setShowEdit(false)}>&times;</span>
            <h2>Cập nhật xe</h2>
            <form onSubmit={handleUpdate}>
              <div className={styles.formGroup}>
                <label>Biển số</label>
                <input name="plateNumber" placeholder="VD: 59A-12345" value={editForm.plateNumber} onChange={handleEditChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Sức chứa</label>
                <input name="capacity" placeholder="Số học sinh" value={editForm.capacity} onChange={handleEditChange} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editDriver">Gán tài xế</label>
                <select id="editDriver" name="driverId" value={editForm.driverId} onChange={handleEditChange}>
                  <option value="">Chưa gán</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name || d.email || d._id}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="editStatus">Trạng thái</label>
                <select id="editStatus" name="status" aria-label="Trạng thái" value={editForm.status} onChange={handleEditChange}>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.submitBtn} type="submit" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Cập nhật'}</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowEdit(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBusManagement;
