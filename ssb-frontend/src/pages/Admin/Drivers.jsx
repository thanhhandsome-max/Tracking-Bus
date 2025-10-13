import React, { useState } from 'react';

const Drivers = () => {
  const [drivers] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      email: 'nguyenvana@email.com',
      licenseNumber: 'A123456789',
      status: 'active',
      assignedBus: 'BUS-001',
      experience: '5 năm',
      rating: 4.8
    },
    {
      id: 2,
      name: 'Trần Văn B',
      phone: '0123456790',
      email: 'tranvanb@email.com',
      licenseNumber: 'A123456790',
      status: 'active',
      assignedBus: 'BUS-002',
      experience: '3 năm',
      rating: 4.5
    },
    {
      id: 3,
      name: 'Lê Văn C',
      phone: '0123456791',
      email: 'levanc@email.com',
      licenseNumber: 'A123456791',
      status: 'inactive',
      assignedBus: 'BUS-003',
      experience: '7 năm',
      rating: 4.9
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Ngừng hoạt động';
      case 'on_leave':
        return 'Nghỉ phép';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài xế</h1>
          <p className="text-gray-600">Danh sách và thông tin các tài xế trong hệ thống</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Thêm tài xế mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👨‍💼</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số tài xế
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{drivers.length}</dd>
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
                    {drivers.filter(driver => driver.status === 'active').length}
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
                  <span className="text-white text-sm font-medium">⭐</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đánh giá trung bình
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(drivers.reduce((sum, driver) => sum + driver.rating, 0) / drivers.length).toFixed(1)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Danh sách tài xế
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Thông tin chi tiết về các tài xế trong hệ thống
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {drivers.map((driver) => (
            <li key={driver.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {driver.name}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                        {getStatusText(driver.status)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500">
                        {driver.phone} • {driver.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        Bằng lái: {driver.licenseNumber} • Kinh nghiệm: {driver.experience} • Đánh giá: {driver.rating}/5
                      </p>
                      <p className="text-sm text-gray-500">
                        Xe được phân công: {driver.assignedBus}
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

export default Drivers;
