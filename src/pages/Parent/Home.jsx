import React, { useState } from 'react';

const Home = () => {
  const [children] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn An',
      studentId: 'HS001',
      grade: 'Lớp 10A1',
      school: 'THPT Nguyễn Du',
      busRoute: 'Tuyến 1 - Trường A',
      busNumber: 'BUS-001',
      driver: 'Nguyễn Văn Tài xế',
      status: 'on_bus',
      currentLocation: 'Đường Nguyễn Huệ, Quận 1',
      eta: '15 phút'
    },
    {
      id: 2,
      name: 'Nguyễn Thị Bình',
      studentId: 'HS002',
      grade: 'Lớp 8B2',
      school: 'THCS Lê Lợi',
      busRoute: 'Tuyến 2 - Trường B',
      busNumber: 'BUS-002',
      driver: 'Trần Văn Tài xế',
      status: 'at_school',
      currentLocation: 'Trường THCS Lê Lợi',
      eta: 'Đã đến trường'
    }
  ]);

  const [notifications] = useState([
    {
      id: 1,
      title: 'Xe bus đã đến điểm đón',
      message: 'Xe bus #001 đã đến điểm đón của con bạn Nguyễn Văn An',
      time: '5 phút trước',
      type: 'info'
    },
    {
      id: 2,
      title: 'Con bạn đã lên xe an toàn',
      message: 'Nguyễn Văn An đã lên xe bus #001 và đang trên đường đến trường',
      time: '10 phút trước',
      type: 'success'
    },
    {
      id: 3,
      title: 'Thông báo lịch trình thay đổi',
      message: 'Lịch trình xe bus #001 ngày mai sẽ thay đổi do bảo trì định kỳ',
      time: '1 giờ trước',
      type: 'warning'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_bus':
        return 'bg-green-100 text-green-800';
      case 'at_school':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'picked_up':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'on_bus':
        return 'Trên xe';
      case 'at_school':
        return 'Tại trường';
      case 'waiting':
        return 'Đang chờ';
      case 'picked_up':
        return 'Đã đón';
      default:
        return 'Không xác định';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📢';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trang chủ</h1>
        <p className="text-gray-600">Theo dõi vị trí và trạng thái của con bạn</p>
      </div>

      {/* Children Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {children.map((child) => (
          <div key={child.id} className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {child.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {child.studentId} • {child.grade} • {child.school}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(child.status)}`}>
                  {getStatusText(child.status)}
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tuyến xe:</span>
                  <span className="text-sm font-medium text-gray-900">{child.busRoute}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Xe bus:</span>
                  <span className="text-sm font-medium text-gray-900">{child.busNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tài xế:</span>
                  <span className="text-sm font-medium text-gray-900">{child.driver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Vị trí hiện tại:</span>
                  <span className="text-sm font-medium text-gray-900">{child.currentLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Thời gian đến:</span>
                  <span className="text-sm font-medium text-gray-900">{child.eta}</span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                  Xem bản đồ
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                  Theo dõi trực tiếp
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                  Liên hệ tài xế
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">👨‍🎓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số con
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{children.length}</dd>
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
                  <span className="text-white text-sm font-medium">🚌</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Trên xe
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {children.filter(child => child.status === 'on_bus').length}
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
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🏫</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tại trường
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {children.filter(child => child.status === 'at_school').length}
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
                  <span className="text-white text-sm font-medium">📢</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Thông báo mới
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{notifications.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Thông báo gần đây
          </h3>
          <div className="mt-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start p-3 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Vị trí xe bus
          </h3>
          <div className="mt-4 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-500">Bản đồ theo dõi xe bus</p>
              <p className="text-sm text-gray-400">Tích hợp Google Maps để hiển thị vị trí thời gian thực</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
