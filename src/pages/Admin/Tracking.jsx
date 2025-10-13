import React, { useState } from 'react';

const Tracking = () => {
  const [buses] = useState([
    {
      id: 1,
      busNumber: 'BUS-001',
      driver: 'Nguyễn Văn A',
      route: 'Tuyến 1 - Trường A',
      status: 'moving',
      currentLocation: 'Đường Nguyễn Huệ, Quận 1',
      speed: '35 km/h',
      students: 25,
      lastUpdate: '2 phút trước',
      eta: '15 phút'
    },
    {
      id: 2,
      busNumber: 'BUS-002',
      driver: 'Trần Văn B',
      route: 'Tuyến 2 - Trường B',
      status: 'stopped',
      currentLocation: 'Trường THCS Lê Lợi',
      speed: '0 km/h',
      students: 18,
      lastUpdate: '1 phút trước',
      eta: 'Đã đến'
    },
    {
      id: 3,
      busNumber: 'BUS-003',
      driver: 'Lê Văn C',
      route: 'Tuyến 3 - Trường C',
      status: 'moving',
      currentLocation: 'Đường Lê Lợi, Quận 3',
      speed: '28 km/h',
      students: 32,
      lastUpdate: '3 phút trước',
      eta: '25 phút'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'moving':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'moving':
        return 'Đang di chuyển';
      case 'stopped':
        return 'Đã dừng';
      case 'offline':
        return 'Mất kết nối';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theo dõi vị trí xe bus</h1>
          <p className="text-gray-600">Theo dõi vị trí và trạng thái thời gian thực của các xe bus</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Làm mới
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Xem bản đồ
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🚌</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số xe
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{buses.length}</dd>
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
                  <span className="text-white text-sm font-medium">▶️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang di chuyển
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {buses.filter(bus => bus.status === 'moving').length}
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
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⏸️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đã dừng
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {buses.filter(bus => bus.status === 'stopped').length}
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
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👨‍🎓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng học sinh
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {buses.reduce((sum, bus) => sum + bus.students, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bus Tracking List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Vị trí xe bus hiện tại
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Theo dõi vị trí và trạng thái thời gian thực
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {buses.map((bus) => (
            <li key={bus.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {bus.busNumber.split('-')[1]}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {bus.busNumber}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
                        {getStatusText(bus.status)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500">
                        Tài xế: {bus.driver} • Tuyến: {bus.route}
                      </p>
                      <p className="text-sm text-gray-500">
                        Vị trí: {bus.currentLocation}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tốc độ: {bus.speed} • Học sinh: {bus.students} • Cập nhật: {bus.lastUpdate}
                      </p>
                      <p className="text-sm text-gray-500">
                        ETA: {bus.eta}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Xem bản đồ
                  </button>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Chi tiết
                  </button>
                  <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                    Báo cáo sự cố
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Bản đồ theo dõi
          </h3>
          <div className="mt-4 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-500">Bản đồ sẽ được hiển thị ở đây</p>
              <p className="text-sm text-gray-400">Tích hợp Google Maps hoặc OpenStreetMap</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
