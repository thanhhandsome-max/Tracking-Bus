import React, { useState } from 'react';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [reports] = useState([
    {
      id: 1,
      title: 'Báo cáo hoạt động xe bus',
      description: 'Tổng hợp hoạt động của tất cả xe bus trong tuần',
      type: 'bus_activity',
      period: 'week',
      generatedAt: '2024-01-15 09:00',
      status: 'completed',
      fileSize: '2.3 MB'
    },
    {
      id: 2,
      title: 'Báo cáo sự cố và bảo trì',
      description: 'Danh sách các sự cố và hoạt động bảo trì xe bus',
      type: 'incidents',
      period: 'month',
      generatedAt: '2024-01-14 16:30',
      status: 'completed',
      fileSize: '1.8 MB'
    },
    {
      id: 3,
      title: 'Báo cáo tài xế',
      description: 'Hiệu suất và đánh giá hoạt động của các tài xế',
      type: 'drivers',
      period: 'month',
      generatedAt: '2024-01-13 14:15',
      status: 'completed',
      fileSize: '1.2 MB'
    },
    {
      id: 4,
      title: 'Báo cáo học sinh',
      description: 'Thống kê số lượng và thông tin học sinh sử dụng dịch vụ',
      type: 'students',
      period: 'month',
      generatedAt: '2024-01-12 11:45',
      status: 'completed',
      fileSize: '3.1 MB'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'processing':
        return 'Đang xử lý';
      case 'failed':
        return 'Lỗi';
      default:
        return 'Không xác định';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'bus_activity':
        return 'Hoạt động xe bus';
      case 'incidents':
        return 'Sự cố & Bảo trì';
      case 'drivers':
        return 'Tài xế';
      case 'students':
        return 'Học sinh';
      default:
        return 'Không xác định';
    }
  };

  const getPeriodText = (period) => {
    switch (period) {
      case 'day':
        return 'Hôm nay';
      case 'week':
        return 'Tuần này';
      case 'month':
        return 'Tháng này';
      case 'year':
        return 'Năm nay';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
          <p className="text-gray-600">Tạo và quản lý các báo cáo thống kê hệ thống</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Tạo báo cáo mới
        </button>
      </div>

      {/* Filter and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ lọc báo cáo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại báo cáo
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tất cả</option>
                  <option value="bus_activity">Hoạt động xe bus</option>
                  <option value="incidents">Sự cố & Bảo trì</option>
                  <option value="drivers">Tài xế</option>
                  <option value="students">Học sinh</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoảng thời gian
                </label>
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">Hôm nay</option>
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                  <option value="year">Năm nay</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tất cả</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="failed">Lỗi</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng báo cáo
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{reports.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    Hoàn thành
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reports.filter(report => report.status === 'completed').length}
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
                  <span className="text-white text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang xử lý
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reports.filter(report => report.status === 'processing').length}
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
                  <span className="text-white text-sm font-medium">📁</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng dung lượng
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reports.reduce((sum, report) => sum + parseFloat(report.fileSize), 0).toFixed(1)} MB
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Danh sách báo cáo
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tất cả báo cáo đã được tạo trong hệ thống
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {reports.map((report) => (
            <li key={report.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        📊
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {report.title}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusText(report.status)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500">
                        {report.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        Loại: {getTypeText(report.type)} • Khoảng thời gian: {getPeriodText(report.period)} • Dung lượng: {report.fileSize}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tạo lúc: {report.generatedAt}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Tải xuống
                  </button>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Xem trước
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

      {/* Chart Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Biểu đồ thống kê
          </h3>
          <div className="mt-4 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
              <p className="text-sm text-gray-400">Tích hợp Chart.js hoặc Recharts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
