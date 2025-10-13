import React, { useState } from 'react';

const Notifications = () => {
  const [notifications] = useState([
    {
      id: 1,
      title: 'Xe bus #001 gặp sự cố',
      message: 'Tài xế Nguyễn Văn A báo cáo xe bus #001 gặp sự cố động cơ tại vị trí Đường Nguyễn Huệ',
      type: 'incident',
      priority: 'high',
      timestamp: '2024-01-15 14:30',
      status: 'unread',
      sender: 'Nguyễn Văn A (Tài xế)'
    },
    {
      id: 2,
      title: 'Xe bus #002 đã hoàn thành tuyến',
      message: 'Xe bus #002 đã hoàn thành tuyến đường Tuyến 2 - Trường B và đưa 18 học sinh về nhà an toàn',
      type: 'success',
      priority: 'medium',
      timestamp: '2024-01-15 16:45',
      status: 'read',
      sender: 'Hệ thống'
    },
    {
      id: 3,
      title: 'Thông báo lịch trình thay đổi',
      message: 'Lịch trình xe bus #003 ngày mai sẽ thay đổi do bảo trì định kỳ. Vui lòng thông báo cho phụ huynh',
      type: 'schedule',
      priority: 'medium',
      timestamp: '2024-01-15 18:00',
      status: 'unread',
      sender: 'Quản trị viên'
    },
    {
      id: 4,
      title: 'Cảnh báo nhiên liệu thấp',
      message: 'Xe bus #004 có mức nhiên liệu thấp (15%). Vui lòng sắp xếp tiếp nhiên liệu',
      type: 'warning',
      priority: 'high',
      timestamp: '2024-01-15 19:15',
      status: 'unread',
      sender: 'Hệ thống'
    }
  ]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'incident':
        return 'bg-red-100 text-red-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'schedule':
        return 'bg-blue-100 text-blue-800';
      case 'info':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'incident':
        return 'Sự cố';
      case 'success':
        return 'Thành công';
      case 'warning':
        return 'Cảnh báo';
      case 'schedule':
        return 'Lịch trình';
      case 'info':
        return 'Thông tin';
      default:
        return 'Không xác định';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-600">Quản lý và theo dõi các thông báo trong hệ thống</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Đánh dấu tất cả đã đọc
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Gửi thông báo mới
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
                  <span className="text-white text-sm font-medium">📢</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng thông báo
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{notifications.length}</dd>
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
                  <span className="text-white text-sm font-medium">🔴</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Chưa đọc
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {notifications.filter(notif => notif.status === 'unread').length}
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
                  <span className="text-white text-sm font-medium">⚠️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ưu tiên cao
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {notifications.filter(notif => notif.priority === 'high').length}
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
                  <span className="text-white text-sm font-medium">🚨</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Sự cố
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {notifications.filter(notif => notif.type === 'incident').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Danh sách thông báo
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tất cả thông báo và cảnh báo trong hệ thống
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <li key={notification.id} className={`px-4 py-4 ${notification.status === 'unread' ? 'bg-blue-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">
                        {notification.type === 'incident' ? '🚨' : 
                         notification.type === 'success' ? '✅' :
                         notification.type === 'warning' ? '⚠️' :
                         notification.type === 'schedule' ? '📅' : 'ℹ️'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className={`text-sm font-medium ${notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {getTypeText(notification.type)}
                      </span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {getPriorityText(notification.priority)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className={`text-sm ${notification.status === 'unread' ? 'text-gray-800' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Từ: {notification.sender} • {notification.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {notification.status === 'unread' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Mới
                    </span>
                  )}
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Chi tiết
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

export default Notifications;
