import React, { useState } from 'react';

const Incident = () => {
  const [incidents] = useState([
    {
      id: 1,
      type: 'mechanical',
      title: 'Xe bus gặp sự cố động cơ',
      description: 'Động cơ xe bus #001 phát ra tiếng kêu lạ và rung lắc khi chạy',
      severity: 'high',
      status: 'reported',
      reportedAt: '2024-01-15 14:30',
      location: 'Đường Nguyễn Huệ, Quận 1',
      students: 25,
      actionTaken: 'Đã dừng xe và gọi cứu hộ',
      resolvedAt: null
    },
    {
      id: 2,
      type: 'traffic',
      title: 'Tắc đường do tai nạn',
      description: 'Tuyến đường bị tắc do tai nạn giao thông, dự kiến chậm 30 phút',
      severity: 'medium',
      status: 'resolved',
      reportedAt: '2024-01-14 16:45',
      location: 'Đường Lê Lợi, Quận 3',
      students: 18,
      actionTaken: 'Thông báo cho phụ huynh và tìm tuyến đường khác',
      resolvedAt: '2024-01-14 17:15'
    },
    {
      id: 3,
      type: 'student',
      title: 'Học sinh bị ốm trên xe',
      description: 'Học sinh Nguyễn Văn An bị say xe và nôn mửa',
      severity: 'low',
      status: 'resolved',
      reportedAt: '2024-01-13 15:20',
      location: 'Trên xe bus #002',
      students: 1,
      actionTaken: 'Dừng xe và gọi phụ huynh đến đón',
      resolvedAt: '2024-01-13 15:45'
    }
  ]);

  const [newIncident, setNewIncident] = useState({
    type: '',
    title: '',
    description: '',
    severity: 'low',
    location: '',
    students: 0
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'mechanical':
        return 'bg-red-100 text-red-800';
      case 'traffic':
        return 'bg-yellow-100 text-yellow-800';
      case 'weather':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'mechanical':
        return 'Sự cố cơ khí';
      case 'traffic':
        return 'Tắc đường';
      case 'weather':
        return 'Thời tiết';
      case 'student':
        return 'Sự cố học sinh';
      case 'other':
        return 'Khác';
      default:
        return 'Không xác định';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'low':
        return 'Thấp';
      case 'medium':
        return 'Trung bình';
      case 'high':
        return 'Cao';
      case 'critical':
        return 'Nghiêm trọng';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'reported':
        return 'Đã báo cáo';
      case 'in_progress':
        return 'Đang xử lý';
      case 'resolved':
        return 'Đã giải quyết';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const handleSubmitIncident = (e) => {
    e.preventDefault();
    if (newIncident.type && newIncident.title && newIncident.description) {
      alert('Báo cáo sự cố đã được gửi thành công!');
      setNewIncident({
        type: '',
        title: '',
        description: '',
        severity: 'low',
        location: '',
        students: 0
      });
    } else {
      alert('Vui lòng điền đầy đủ thông tin báo cáo!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo sự cố</h1>
        <p className="text-gray-600">Quản lý và theo dõi các sự cố trong quá trình vận hành</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🚨</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng sự cố
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{incidents.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang xử lý
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {incidents.filter(incident => incident.status === 'reported' || incident.status === 'in_progress').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đã giải quyết
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {incidents.filter(incident => incident.status === 'resolved').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⚠️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ưu tiên cao
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {incidents.filter(incident => incident.severity === 'high' || incident.severity === 'critical').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Incident Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Báo cáo sự cố mới
          </h3>
          <form onSubmit={handleSubmitIncident} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Loại sự cố
                </label>
                <select
                  value={newIncident.type}
                  onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn loại sự cố</option>
                  <option value="mechanical">Sự cố cơ khí</option>
                  <option value="traffic">Tắc đường</option>
                  <option value="weather">Thời tiết</option>
                  <option value="student">Sự cố học sinh</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mức độ nghiêm trọng
                </label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="critical">Nghiêm trọng</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tiêu đề sự cố
              </label>
              <input
                type="text"
                value={newIncident.title}
                onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tiêu đề sự cố"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mô tả chi tiết
              </label>
              <textarea
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mô tả chi tiết sự cố..."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vị trí xảy ra sự cố
                </label>
                <input
                  type="text"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập vị trí xảy ra sự cố"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số học sinh bị ảnh hưởng
                </label>
                <input
                  type="number"
                  value={newIncident.students}
                  onChange={(e) => setNewIncident({ ...newIncident, students: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Gửi báo cáo sự cố
            </button>
          </form>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Lịch sử sự cố
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tất cả sự cố đã được báo cáo
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {incidents.map((incident) => (
            <li key={incident.id}>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 font-medium text-sm">
                          🚨
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {incident.title}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(incident.type)}`}>
                          {getTypeText(incident.type)}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {getSeverityText(incident.severity)}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {getStatusText(incident.status)}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">
                          {incident.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          Vị trí: {incident.location} • Học sinh bị ảnh hưởng: {incident.students}
                        </p>
                        <p className="text-sm text-gray-500">
                          Báo cáo lúc: {incident.reportedAt}
                          {incident.resolvedAt && ` • Giải quyết lúc: ${incident.resolvedAt}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          Hành động đã thực hiện: {incident.actionTaken}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                      Chi tiết
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                      Cập nhật
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Incident;
