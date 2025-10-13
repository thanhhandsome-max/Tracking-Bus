import React, { useState } from 'react';

const Buses = () => {
  const [buses] = useState([
    {
      id: 1,
      busNumber: 'BUS-001',
      licensePlate: '51A-12345',
      capacity: 50,
      status: 'active',
      driver: 'Nguyễn Văn A',
      route: 'Tuyến 1 - Trường A',
      lastMaintenance: '2024-01-15'
    },
    {
      id: 2,
      busNumber: 'BUS-002',
      licensePlate: '51A-12346',
      capacity: 45,
      status: 'maintenance',
      driver: 'Trần Văn B',
      route: 'Tuyến 2 - Trường B',
      lastMaintenance: '2024-01-10'
    },
    {
      id: 3,
      busNumber: 'BUS-003',
      licensePlate: '51A-12347',
      capacity: 50,
      status: 'active',
      driver: 'Lê Văn C',
      route: 'Tuyến 3 - Trường C',
      lastMaintenance: '2024-01-12'
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý xe bus</h1>
          <p className="text-gray-600">Danh sách và thông tin các xe bus trong hệ thống</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Thêm xe bus mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang hoạt động
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {buses.filter(bus => bus.status === 'active').length}
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
                  <span className="text-white text-sm font-medium">🔧</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang bảo trì
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {buses.filter(bus => bus.status === 'maintenance').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bus List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Danh sách xe bus
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Thông tin chi tiết về các xe bus trong hệ thống
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
                        Biển số: {bus.licensePlate} • Sức chứa: {bus.capacity} chỗ
                      </p>
                      <p className="text-sm text-gray-500">
                        Tài xế: {bus.driver} • Tuyến: {bus.route}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
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

export default Buses;
