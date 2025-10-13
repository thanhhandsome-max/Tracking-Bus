import React, { useState } from 'react';

const Routes = () => {
  const [routes] = useState([
    {
      id: 1,
      name: 'Tuyến 1 - Trường A',
      startPoint: 'Bến xe trung tâm',
      endPoint: 'THPT Nguyễn Du',
      distance: '15.5 km',
      duration: '45 phút',
      stops: 8,
      assignedBus: 'BUS-001',
      status: 'active',
      students: 25
    },
    {
      id: 2,
      name: 'Tuyến 2 - Trường B',
      startPoint: 'Bến xe trung tâm',
      endPoint: 'THCS Lê Lợi',
      distance: '12.3 km',
      duration: '35 phút',
      stops: 6,
      assignedBus: 'BUS-002',
      status: 'active',
      students: 18
    },
    {
      id: 3,
      name: 'Tuyến 3 - Trường C',
      startPoint: 'Bến xe trung tâm',
      endPoint: 'THPT Trần Hưng Đạo',
      distance: '18.7 km',
      duration: '55 phút',
      stops: 10,
      assignedBus: 'BUS-003',
      status: 'maintenance',
      students: 32
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'maintenance':
        return 'Bảo trì';
      case 'inactive':
        return 'Ngừng hoạt động';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tuyến đường</h1>
          <p className="text-gray-600">Danh sách và thông tin các tuyến đường xe bus</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Thêm tuyến đường mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🛣️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số tuyến
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{routes.length}</dd>
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
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang hoạt động
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {routes.filter(route => route.status === 'active').length}
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
                  <span className="text-white text-sm font-medium">👨‍🎓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng học sinh
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {routes.reduce((sum, route) => sum + route.students, 0)}
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
                  <span className="text-white text-sm font-medium">📍</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng điểm dừng
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {routes.reduce((sum, route) => sum + route.stops, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Route List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Danh sách tuyến đường
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Thông tin chi tiết về các tuyến đường xe bus
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {routes.map((route) => (
            <li key={route.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {route.id}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {route.name}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                        {getStatusText(route.status)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500">
                        {route.startPoint} → {route.endPoint}
                      </p>
                      <p className="text-sm text-gray-500">
                        Khoảng cách: {route.distance} • Thời gian: {route.duration} • Điểm dừng: {route.stops}
                      </p>
                      <p className="text-sm text-gray-500">
                        Xe phân công: {route.assignedBus} • Học sinh: {route.students}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Xem bản đồ
                  </button>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Chỉnh sửa
                  </button>
                  <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Routes;
