"use client";
import React, { useState, useEffect } from 'react';
import styles from './AdminRouteManagement.module.css';

// Interface cho Xe bus (để lấy danh sách)
interface Bus {
  _id: string;
  plateNumber: string;
  capacity: number;
}

// Interface cho một Trạm dừng
interface Stop {
  _id: string;
  name: string;
  address: string;
}

// Interface cho một trạm dừng (bên trong mảng stops)
interface StopInRoute {
  stopId: { _id: string; name: string; address: string };
  order: number;
  estimatedArrivalTime: string;
  distance?: number;
  estimatedDuration?: number;
}

// Interface cho Tuyến đường (Dựa theo ảnh bạn gửi)
interface Route {
  _id: string;
  name: string;
  department: string;
  arrival: string;
  time: string;
  busId?: { _id: string; plateNumber: string; capacity: number };
  stops: StopInRoute[];
  createdAt: string;
  updatedAt?: string;
  distance?: number;
  estimatedDuration?: number;
  status?: string;
}

const AdminRouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- SỬA ĐỔI: Thêm 'status' vào state mặc định ---
  const [createForm, setCreateForm] = useState({
    name: '',
    department: '',
    arrival: '',
    time: '',
    busId: '',
    distance: '',
    estimatedDuration: '',
    status: 'active',
    stopIds: [] as string[]
  });

  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    arrival: '',
    time: '',
    busId: '',
    distance: '',
    estimatedDuration: '',
    status: 'active',
    stopIds: [] as string[]
  });

  // Fetch routes, buses, and stops khi component được load
  useEffect(() => {
    fetchRoutes();
    fetchBuses();
    fetchStops();
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

  // Tải danh sách xe bus để hiển thị trong dropdown
  const fetchBuses = async () => {
    try {
      const response = await fetch('/api/admin/buses'); 
      const data = await response.json();
      if (response.ok) {
        setBuses(data.buses || []);
      } else {
        console.warn('Không thể tải danh sách xe bus:', data.message);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách xe bus:', err);
    }
  };

  // Tải danh sách trạm dừng
  const fetchStops = async () => {
    try {
      const response = await fetch('/api/admin/stops');
      const data = await response.json();
      if (response.ok) {
        setAllStops(data.stops || []);
      } else {
        console.warn('Không thể tải danh sách trạm dừng:', data.message);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách trạm dừng:', err);
    }
  };

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    setEditForm({
      name: route.name,
      department: route.department,
      arrival: route.arrival,
      time: route.time,
      busId: route.busId?._id || '',
      distance: String(route.distance || ''),
      estimatedDuration: String(route.estimatedDuration || ''),
      status: route.status || 'active',
      stopIds: route.stops?.map(s => (typeof s.stopId === 'string' ? s.stopId : s.stopId._id)) || []
    });
    setShowUpdateModal(true);
  };

  // Cập nhật hàm này để nhận cả Input và Select
  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'stopIds') {
      // Handle multi-select
      const select = e.target as HTMLSelectElement;
      const selected = Array.from(select.selectedOptions, option => option.value);
      setCreateForm(prev => ({
        ...prev,
        stopIds: selected
      }));
    } else {
      setCreateForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Cập nhật hàm này để nhận cả Input và Select
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'stopIds') {
      // Handle multi-select
      const select = e.target as HTMLSelectElement;
      const selected = Array.from(select.selectedOptions, option => option.value);
      setEditForm(prev => ({
        ...prev,
        stopIds: selected
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.name || !createForm.department || !createForm.arrival || !createForm.time) {
      setError('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    setLoading(true);
    
    // Payload bây giờ sẽ tự động bao gồm 'status'
    const payload = {
      ...createForm,
      busId: createForm.busId === '' ? null : createForm.busId
    };

    try {
      const response = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setShowCreateModal(false);
        // --- SỬA ĐỔI: Reset cả 'status' ---
        setCreateForm({
          name: '',
          department: '',
          arrival: '',
          time: '',
          busId: '',
          distance: '',
          estimatedDuration: '',
          status: 'active',
          stopIds: []
        });
        await fetchRoutes();
      } else {
        setError(data.message || 'Lỗi không xác định');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tạo tuyến đường');
    }
    setLoading(false);
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    // (Giữ nguyên hàm update vì modal update chưa có trường status)
    e.preventDefault();
    if (!selectedRoute) return;

    setLoading(true);
    
    const payload = {
      ...editForm,
      busId: editForm.busId === '' ? null : editForm.busId
    };

    try {
      const response = await fetch(`/api/admin/routes/${selectedRoute._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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


  return (
    <div className={styles.container}>
      {/* ... (Phần header, table, v.v. giữ nguyên) ... */}
      
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
              {/* ... (Các trường name, department, arrival, time giữ nguyên) ... */}
              <div className={styles.formGroup}>
                <label htmlFor="createName">Tên tuyến:</label>
                <input
                  id="createName"
                  type="text"
                  name="name"
                  placeholder="Nhập tên tuyến đường"
                  value={createForm.name}
                  onChange={handleCreateFormChange}
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
                  onChange={handleCreateFormChange}
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
                  onChange={handleCreateFormChange}
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
                  onChange={handleCreateFormChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createBusId">Chọn xe (tùy chọn):</label>
                <select
                  id="createBusId"
                  name="busId"
                  value={createForm.busId}
                  onChange={handleCreateFormChange}
                >
                  <option value="">-- Chưa gán --</option>
                  {buses.map(bus => (
                    <option key={bus._id} value={bus._id}>
                      {bus.plateNumber} (Sức chứa: {bus.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createDistance">Khoảng cách (km):</label>
                <input
                  id="createDistance"
                  type="number"
                  name="distance"
                  placeholder="VD: 25.5"
                  value={createForm.distance}
                  onChange={handleCreateFormChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createEstimatedDuration">Thời gian dự kiến:</label>
                <input
                  id="createEstimatedDuration"
                  type="text"
                  name="estimatedDuration"
                  placeholder="VD: 45 phút hoặc 1h 30m"
                  value={createForm.estimatedDuration}
                  onChange={handleCreateFormChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="createStatus">Trạng thái:</label>
                <select
                  id="createStatus"
                  name="status"
                  value={createForm.status}
                  onChange={handleCreateFormChange}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngưng hoạt động</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Chọn trạm dừng:</label>
                <div className={styles.checkboxGroup}>
                  {allStops.map(stop => (
                    <div key={stop._id} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        id={`createStop_${stop._id}`}
                        value={stop._id}
                        checked={createForm.stopIds.includes(stop._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateForm(prev => ({
                              ...prev,
                              stopIds: [...prev.stopIds, stop._id]
                            }));
                          } else {
                            setCreateForm(prev => ({
                              ...prev,
                              stopIds: prev.stopIds.filter(id => id !== stop._id)
                            }));
                          }
                        }}
                      />
                      <label htmlFor={`createStop_${stop._id}`} className={styles.checkboxLabel}>
                        {stop.name} - {stop.address}
                      </label>
                    </div>
                  ))}
                </div>
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
      {/* (Modal update giữ nguyên, không thay đổi) */}
      {showUpdateModal && selectedRoute && (
        <div className={styles.modal}>
          {/* ... (Nội dung modal update y hệt) ... */}
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
                   onChange={handleEditFormChange}
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
                   onChange={handleEditFormChange}
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
                   onChange={handleEditFormChange}
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
                   onChange={handleEditFormChange}
                 />
               </div>

               <div className={styles.formGroup}>
                 <label htmlFor="busId">Chọn xe (tùy chọn):</label>
                 <select
                   id="busId"
                   name="busId"
                   value={editForm.busId}
                   onChange={handleEditFormChange}
                 >
                   <option value="">-- Chưa gán --</option>
                   {buses.map(bus => (
                     <option key={bus._id} value={bus._id}>
                       {bus.plateNumber} (Sức chứa: {bus.capacity})
                     </option>
                   ))}
                 </select>
               </div>

               <div className={styles.formGroup}>
                 <label htmlFor="editDistance">Khoảng cách (km):</label>
                 <input
                   id="editDistance"
                   type="number"
                   name="distance"
                   placeholder="VD: 25.5"
                   value={editForm.distance}
                   onChange={handleEditFormChange}
                   min="0"
                   step="0.1"
                 />
               </div>

               <div className={styles.formGroup}>
                 <label htmlFor="editEstimatedDuration">Thời gian dự kiến:</label>
                 <input
                   id="editEstimatedDuration"
                   type="text"
                   name="estimatedDuration"
                   placeholder="VD: 45 phút hoặc 1h 30m"
                   value={editForm.estimatedDuration}
                   onChange={handleEditFormChange}
                 />
               </div>

               <div className={styles.formGroup}>
                 <label htmlFor="editStatus">Trạng thái:</label>
                 <select
                   id="editStatus"
                   name="status"
                   value={editForm.status}
                   onChange={handleEditFormChange}
                 >
                   <option value="active">Hoạt động</option>
                   <option value="inactive">Ngưng hoạt động</option>
                   <option value="maintenance">Bảo trì</option>
                 </select>
               </div>

               <div className={styles.formGroup}>
                 <label>Chọn trạm dừng:</label>
                 <div className={styles.checkboxGroup}>
                   {allStops.map(stop => (
                     <div key={stop._id} className={styles.checkboxItem}>
                       <input
                         type="checkbox"
                         id={`editStop_${stop._id}`}
                         value={stop._id}
                         checked={editForm.stopIds.includes(stop._id)}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setEditForm(prev => ({
                               ...prev,
                               stopIds: [...prev.stopIds, stop._id]
                             }));
                           } else {
                             setEditForm(prev => ({
                               ...prev,
                               stopIds: prev.stopIds.filter(id => id !== stop._id)
                             }));
                           }
                         }}
                       />
                       <label htmlFor={`editStop_${stop._id}`} className={styles.checkboxLabel}>
                         {stop.name} - {stop.address}
                       </label>
                     </div>
                   ))}
                 </div>
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