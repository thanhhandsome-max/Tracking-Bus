import React, { useState } from 'react';

const Schedule = () => {
  const [schedules] = useState([
    {
      id: 1,
      route: 'Tuyến 1 - Trường A',
      bus: 'BUS-001',
      driver: 'Nguyễn Văn A',
      time: '06:30 - 07:15',
      type: 'morning',
      status: 'scheduled',
      students: 25
    },
    {
      id: 2,
      route: 'Tuyến 2 - Trường B',
      bus: 'BUS-002',
      driver: 'Trần Văn B',
      time: '06:45 - 07:30',
      type: 'morning',
      status: 'in_progress',
      students: 18
    },
    {
      id: 3,
      route: 'Tuyến 1 - Trường A',
      bus: 'BUS-001',
      driver: 'Nguyễn Văn A',
      time: '15:30 - 16:15',
      type: 'afternoon',
      status: 'scheduled',
      students: 25
    },
    {
      id: 4,
      route: 'Tuyến 3 - Trường C',
      bus: 'BUS-003',
      driver: 'Lê Văn C',
      time: '07:00 - 07:55',
      type: 'morning',
      status: 'completed',
      students: 32
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Đã lên lịch';
      case 'in_progress':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'morning':
        return 'Sáng (Đi học)';
      case 'afternoon':
        return 'Chiều (Về nhà)';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch trình</h1>
          <p className="text-gray-600">Lịch trình và thời gian hoạt động của các tuyến xe bus</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Thêm lịch trình mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng lịch trình
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{schedules.length}</dd>
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
                    Đang thực hiện
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {schedules.filter(schedule => schedule.status === 'in_progress').length}
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
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Hoàn thành
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {schedules.filter(schedule => schedule.status === 'completed').length}
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
                  <span className="text-white text-sm font-medium">👨‍🎓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng học sinh
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {schedules.reduce((sum, schedule) => sum + schedule.students, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Lịch trình hôm nay
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Danh sách lịch trình xe bus trong ngày
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {schedules.map((schedule) => (
            <li key={schedule.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {schedule.type === 'morning' ? '🌅' : '🌇'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {schedule.route}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                        {getStatusText(schedule.status)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500">
                        {schedule.bus} • {schedule.driver} • {getTypeText(schedule.type)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Thời gian: {schedule.time} • Học sinh: {schedule.students}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Chi tiết
                  </button>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Chỉnh sửa
                  </button>
                  <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                    Hủy
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

export default Schedule;
