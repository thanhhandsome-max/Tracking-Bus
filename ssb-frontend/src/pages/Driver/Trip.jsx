import React, { useState } from 'react';

const Trip = () => {
  const [currentTrip] = useState({
    id: 1,
    route: 'Tuyến 1 - Trường A',
    bus: 'BUS-001',
    startTime: '15:30',
    expectedEndTime: '16:15',
    currentLocation: 'Đường Nguyễn Huệ, Quận 1',
    nextStop: 'Trường THPT Nguyễn Du',
    students: [
      { id: 1, name: 'Nguyễn Văn An', grade: 'Lớp 10A1', status: 'onboard', stop: 'Điểm dừng 1' },
      { id: 2, name: 'Trần Thị Bình', grade: 'Lớp 9B2', status: 'onboard', stop: 'Điểm dừng 2' },
      { id: 3, name: 'Lê Văn Cường', grade: 'Lớp 11C3', status: 'waiting', stop: 'Điểm dừng 3' }
    ],
    status: 'in_progress',
    speed: '35 km/h',
    eta: '15 phút'
  });

  const [incident, setIncident] = useState({
    type: '',
    description: '',
    severity: 'low'
  });

  const getStudentStatusColor = (status) => {
    switch (status) {
      case 'onboard':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'picked_up':
        return 'bg-blue-100 text-blue-800';
      case 'dropped_off':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStudentStatusText = (status) => {
    switch (status) {
      case 'onboard':
        return 'Trên xe';
      case 'waiting':
        return 'Đang chờ';
      case 'picked_up':
        return 'Đã đón';
      case 'dropped_off':
        return 'Đã trả';
      default:
        return 'Không xác định';
    }
  };

  const handleStartTrip = () => {
    alert('Bắt đầu chuyến đi thành công!');
  };

  const handleEndTrip = () => {
    alert('Kết thúc chuyến đi thành công!');
  };

  const handleReportIncident = () => {
    if (incident.type && incident.description) {
      alert('Báo cáo sự cố đã được gửi!');
      setIncident({ type: '', description: '', severity: 'low' });
    } else {
      alert('Vui lòng điền đầy đủ thông tin sự cố!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chuyến đi hiện tại</h1>
        <p className="text-gray-600">Theo dõi và quản lý chuyến đi đang thực hiện</p>
      </div>

      {/* Trip Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {currentTrip.route}
              </h3>
              <p className="text-sm text-gray-500">
                Xe: {currentTrip.bus} • Bắt đầu: {currentTrip.startTime} • Dự kiến kết thúc: {currentTrip.expectedEndTime}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleStartTrip}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Bắt đầu
              </button>
              <button
                onClick={handleEndTrip}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Kết thúc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Thông tin chuyến đi
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Vị trí hiện tại:</span>
                <span className="text-sm font-medium text-gray-900">{currentTrip.currentLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Điểm dừng tiếp theo:</span>
                <span className="text-sm font-medium text-gray-900">{currentTrip.nextStop}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tốc độ:</span>
                <span className="text-sm font-medium text-gray-900">{currentTrip.speed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Thời gian đến:</span>
                <span className="text-sm font-medium text-gray-900">{currentTrip.eta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Trạng thái:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Đang thực hiện
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Thống kê học sinh
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tổng số học sinh:</span>
                <span className="text-sm font-medium text-gray-900">{currentTrip.students.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Trên xe:</span>
                <span className="text-sm font-medium text-gray-900">
                  {currentTrip.students.filter(s => s.status === 'onboard').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Đang chờ:</span>
                <span className="text-sm font-medium text-gray-900">
                  {currentTrip.students.filter(s => s.status === 'waiting').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Đã trả:</span>
                <span className="text-sm font-medium text-gray-900">
                  {currentTrip.students.filter(s => s.status === 'dropped_off').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Danh sách học sinh
          </h3>
          <div className="mt-4">
            <div className="space-y-3">
              {currentTrip.students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.grade} • {student.stop}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStudentStatusColor(student.status)}`}>
                    {getStudentStatusText(student.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Report */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Báo cáo sự cố
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Loại sự cố
              </label>
              <select
                value={incident.type}
                onChange={(e) => setIncident({ ...incident, type: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Mô tả sự cố
              </label>
              <textarea
                value={incident.description}
                onChange={(e) => setIncident({ ...incident, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mô tả chi tiết sự cố..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mức độ nghiêm trọng
              </label>
              <select
                value={incident.severity}
                onChange={(e) => setIncident({ ...incident, severity: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="critical">Nghiêm trọng</option>
              </select>
            </div>
            <button
              onClick={handleReportIncident}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Gửi báo cáo sự cố
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trip;
