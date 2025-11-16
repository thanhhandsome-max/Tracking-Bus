"use client";
import React, { useEffect, useState } from 'react';
import styles from './AdminStopManagement.module.css';

interface Stop {
  _id: string;
  name: string;
  address: string;
  location: { type: 'Point'; coordinates: [number, number] };
}

const AdminStopManagement: React.FC = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState<Stop | null>(null);

  const [createForm, setCreateForm] = useState({ name: '', address: '', lat: '', lng: '' });
  const [editForm, setEditForm] = useState({ name: '', address: '', lat: '', lng: '' });

  useEffect(() => {
    fetchStops();
  }, []);

  const fetchStops = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stops');
      const data = await res.json();
      if (res.ok) {
        setStops(data.stops || []);
        setError('');
      } else {
        setError(data.message || 'Lỗi khi tải trạm');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải trạm');
    }
    setLoading(false);
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(createForm.lat);
    const lng = parseFloat(createForm.lng);
    if (!createForm.name || !createForm.address || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Vui lòng điền đầy đủ tên, địa chỉ và tọa độ hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createForm.name, address: createForm.address, lat, lng })
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ name: '', address: '', lat: '', lng: '' });
        await fetchStops();
        setError('');
      } else {
        setError(data.message || 'Lỗi khi tạo trạm');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tạo trạm');
    }
    setLoading(false);
  };

  const openEdit = (stop: Stop) => {
    setSelected(stop);
    setEditForm({
      name: stop.name,
      address: stop.address,
      lat: String(stop.location.coordinates[1]),
      lng: String(stop.location.coordinates[0])
    });
    setShowEdit(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const lat = parseFloat(editForm.lat);
    const lng = parseFloat(editForm.lng);
    if (!editForm.name || !editForm.address || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Vui lòng điền đầy đủ tên, địa chỉ và tọa độ hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stops/${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name, address: editForm.address, lat, lng })
      });
      const data = await res.json();
      if (res.ok) {
        setShowEdit(false);
        setSelected(null);
        await fetchStops();
        setError('');
      } else {
        setError(data.message || 'Lỗi khi cập nhật trạm');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi cập nhật trạm');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa trạm này?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stops/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchStops();
        setError('');
      } else {
        const data = await res.json();
        setError(data.message || 'Lỗi khi xóa trạm');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi xóa trạm');
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý Trạm (Stops)</h1>
        <button className={styles.addBtn} onClick={() => setShowCreate(true)}>+ Thêm trạm</button>
        <div className={styles.stats}>Tổng: <span>{stops.length}</span> trạm</div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Địa chỉ</th>
              <th>Lat</th>
              <th>Lng</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && stops.length === 0 ? (
              <tr><td colSpan={5} className={styles.loading}>Đang tải...</td></tr>
            ) : stops.length === 0 ? (
              <tr><td colSpan={5} className={styles.empty}>Không có trạm</td></tr>
            ) : (
              stops.map(s => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.address}</td>
                  <td>{s.location.coordinates[1]}</td>
                  <td>{s.location.coordinates[0]}</td>
                  <td className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => openEdit(s)}>Sửa</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(s._id)} disabled={loading}>Xóa</button>
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
            <h2>Tạo trạm mới</h2>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label>Tên</label>
                <input name="name" placeholder="Nhập tên trạm" value={createForm.name} onChange={handleCreateChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Địa chỉ</label>
                <input name="address" placeholder="Nhập địa chỉ" value={createForm.address} onChange={handleCreateChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Latitude</label>
                <input name="lat" placeholder="VD: 10.762622" value={createForm.lat} onChange={handleCreateChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Longitude</label>
                <input name="lng" placeholder="VD: 106.660172" value={createForm.lng} onChange={handleCreateChange} />
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
            <h2>Cập nhật trạm</h2>
            <form onSubmit={handleUpdate}>
              <div className={styles.formGroup}>
                <label>Tên</label>
                <input name="name" placeholder="Nhập tên trạm" value={editForm.name} onChange={handleEditChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Địa chỉ</label>
                <input name="address" placeholder="Nhập địa chỉ" value={editForm.address} onChange={handleEditChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Latitude</label>
                <input name="lat" placeholder="VD: 10.762622" value={editForm.lat} onChange={handleEditChange} />
              </div>
              <div className={styles.formGroup}>
                <label>Longitude</label>
                <input name="lng" placeholder="VD: 106.660172" value={editForm.lng} onChange={handleEditChange} />
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

export default AdminStopManagement;
