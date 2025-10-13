import React, { useState } from 'react';

const Notifications = () => {
  const [notifications] = useState([
    {
      id: 1,
      title: 'Xe bus đã đến điểm đón',
      message: 'Xe bus #001 đã đến điểm đón của con bạn Nguyễn Văn An. Vui lòng đưa con ra điểm đón.',
      childName: 'Nguyễn Văn An',
      type: 'pickup',
      priority: 'high',
      timestamp: '2024-01-15 06:25',
      status: 'unread',
      actionRequired: true
    },
    {
      id: 2,
      title: 'Con bạn đã lên xe an toàn',
      message: 'Nguyễn Văn An đã lên xe bus #001 và đang trên đường đến trường. Dự kiến đến trường lúc 7:15.',
      childName: 'Nguyễn Văn An',
      type: 'onboard',
      priority: 'medium',
      timestamp: '2024-01-15 06:30',
      status: 'read',
      actionRequired: false
    },
    {
      id: 3,
      title: 'Thông báo lịch trình thay đổi',
      message: 'Lịch trình xe bus #001 ngày mai (16/01) sẽ thay đổi do bảo trì định kỳ. Giờ đón sẽ muộn 15 phút.',
      childName: 'Nguyễn Văn An',
      type: 'schedule',
      priority: 'medium',
      timestamp: '2024-01-15 18:00',
      status: 'unread',
      actionRequired: false
    },
    {
      id: 4,
      title: 'Con bạn đã đến trường',
      message: 'Nguyễn Văn An đã đến trường THPT Nguyễn Du an toàn lúc 7:15.',
      childName: 'Nguyễn Văn An',
      type: 'arrival',
      priority: 'low',
      timestamp: '2024-01-15 07:15',
      status: 'read',
      actionRequired: false
    },
    {
      id: 5,
      title: 'Xe bus đang trên đường về',
      message: 'Xe bus #001 đang trên đường về điểm trả. Dự kiến đến điểm trả lúc 16:10.',
      childName: 'Nguyễn Văn An',
      type: 'return',
      priority: 'medium',
      timestamp: '2024-01-15 15:45',
      status: 'unread',
      actionRequired: false
    },
    {
      id: 6,
      title: 'Cảnh báo thời tiết',
      message: 'Dự báo có mưa to vào chiều nay. Vui lòng chuẩn bị áo mưa cho con khi đón về.',
      childName: 'Nguyễn Thị Bình',
      type: 'weather',
      priority: 'high',
      timestamp: '2024-01-15 14:30',
      status: 'unread',
      actionRequired: true
    }
  ]);

  const [filter, setFilter] = useState({
    type: '',
    priority: '',
    status: '',
    child: ''
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'pickup':
        return 'bg-blue-100 text-blue-800';
      case 'onboard':
        return 'bg-green-100 text-green-800';
      case 'arrival':
        return 'bg-green-100 text-green-800';
      case 'return':
        return 'bg-yellow-100 text-yellow-800';
      case 'schedule':
        return 'bg-purple-100 text-purple-800';
      case 'weather':
        return 'bg-orange-100 text-orange-800';
      case 'incident':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'pickup':
        return 'Đón xe';
      case 'onboard':
        return 'Trên xe';
      case 'arrival':
        return 'Đến trường';
      case 'return':
        return 'Về nhà';
      case 'schedule':
        return 'Lịch trình';
      case 'weather':
        return 'Thời tiết';
      case 'incident':
        return 'Sự cố';
      default:
        return 'Thông báo';
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pickup':
        return '🚌';
      case 'onboard':
        return '✅';
      case 'arrival':
        return '🏫';
      case 'return':
        return '🏠';
      case 'schedule':
        return '📅';
      case 'weather':
        return '🌧️';
      case 'incident':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter.type && notification.type !== filter.type) return false;
    if (filter.priority && notification.priority !== filter.priority) return false;
    if (filter.status && notification.status !== filter.status) return false;
    if (filter.child && notification.childName !== filter.child) return false;
    return true;
  });

  const children = [...new Set(notifications.map(notif => notif.childName))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-600">Theo dõi các thông báo về con bạn</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Đánh dấu tất cả đã đọc
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Cài đặt thông báo
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
                    Cần hành động
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {notifications.filter(notif => notif.actionRequired).length}
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
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Bộ lọc
          </h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Loại thông báo
              </label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="pickup">Đón xe</option>
                <option value="onboard">Trên xe</option>
                <option value="arrival">Đến trường</option>
                <option value="return">Về nhà</option>
                <option value="schedule">Lịch trình</option>
                <option value="weather">Thời tiết</option>
                <option value="incident">Sự cố</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mức độ ưu tiên
              </label>
              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Trạng thái
              </label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="unread">Chưa đọc</option>
                <option value="read">Đã đọc</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Con
              </label>
              <select
                value={filter.child}
                onChange={(e) => setFilter({ ...filter, child: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                {children.map(child => (
                  <option key={child} value={child}>{child}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Danh sách thông báo
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tất cả thông báo về con bạn
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {filteredNotifications.map((notification) => (
            <li key={notification.id} className={`px-4 py-4 ${notification.status === 'unread' ? 'bg-blue-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">
                        {getTypeIcon(notification.type)}
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
                      {notification.actionRequired && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Cần hành động
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <p className={`text-sm ${notification.status === 'unread' ? 'text-gray-800' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Con: {notification.childName} • {notification.timestamp}
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
