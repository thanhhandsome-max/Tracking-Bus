import React, { useState } from 'react';

const History = () => {
  const [trips] = useState([
    {
      id: 1,
      date: '2024-01-15',
      route: 'Tuyến 1 - Trường A',
      bus: 'BUS-001',
      startTime: '06:30',
      endTime: '07:15',
      type: 'morning',
      status: 'completed',
      students: 25,
      distance: '15.5 km',
      duration: '45 phút',
      fuelConsumed: '8.5 L',
      incidents: 0
    },
    {
      id: 2,
      date: '2024-01-15',
      route: 'Tuyến 1 - Trường A',
      bus: 'BUS-001',
      startTime: '15:30',
      endTime: '16:15',
      type: 'afternoon',
      status: 'completed',
      students: 25,
      distance: '15.5 km',
      duration: '45 phút',
      fuelConsumed: '8.2 L',
      incidents: 0
    },
    {
      id: 3,
      date: '2024-01-14',
      route: 'Tuyến 1 - Trường A',
      bus: 'BUS-001',
      startTime: '06:30',
      endTime: '07:20',
      type: 'morning',
      status: 'completed',
      students: 24,
      distance: '15.5 km',
      duration: '50 phút',
      fuelConsumed: '8.8 L',
      incidents: 1
    },
    {
      id: 4,
      date: '2024-01-14',
      route: 'Tuyến 1 - Trường A',
      bus: 'BUS-001',
      startTime: '15:30',
      endTime: '16:10',
      type: 'afternoon',
      status: 'completed',
      students: 24,
      distance: '15.5 km',
      duration: '40 phút',
      fuelConsumed: '8.0 L',
      incidents: 0
    }
  ]);

  const [filter, setFilter] = useState({
    date: '',
    status: '',
    type: ''
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'delayed':
        return 'Trễ giờ';
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

  const filteredTrips = trips.filter(trip => {
    if (filter.date && trip.date !== filter.date) return false;
    if (filter.status && trip.status !== filter.status) return false;
    if (filter.type && trip.type !== filter.type) return false;
    return true;
  });

  const totalTrips = filteredTrips.length;
  const completedTrips = filteredTrips.filter(trip => trip.status === 'completed').length;
  const totalDistance = filteredTrips.reduce((sum, trip) => sum + parseFloat(trip.distance), 0);
  const totalFuel = filteredTrips.reduce((sum, trip) => sum + parseFloat(trip.fuelConsumed), 0);
  const totalIncidents = filteredTrips.reduce((sum, trip) => sum + trip.incidents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử chuyến đi</h1>
        <p className="text-gray-600">Xem và phân tích lịch sử các chuyến đi đã thực hiện</p>
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
                    Tổng chuyến đi
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{totalTrips}</dd>
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
                  <span className="text-white text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Hoàn thành
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{completedTrips}</dd>
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
                  <span className="text-white text-sm font-medium">🛣️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng quãng đường
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{totalDistance.toFixed(1)} km</dd>
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
                  <span className="text-white text-sm font-medium">⚠️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Sự cố
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{totalIncidents}</dd>
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày
              </label>
              <input
                type="date"
                value={filter.date}
                onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="delayed">Trễ giờ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Loại chuyến
              </label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="morning">Sáng (Đi học)</option>
                <option value="afternoon">Chiều (Về nhà)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Trips List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Danh sách chuyến đi
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Lịch sử các chuyến đi đã thực hiện
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tuyến đường
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Học sinh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quãng đường
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhiên liệu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sự cố
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrips.map((trip) => (
                <tr key={trip.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(trip.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.route}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.startTime} - {trip.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTypeText(trip.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {getStatusText(trip.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.distance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.fuelConsumed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.incidents > 0 ? (
                      <span className="text-red-600 font-medium">{trip.incidents}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Tổng kết
          </h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Thống kê chuyến đi</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>Tổng số chuyến: {totalTrips}</li>
                <li>Chuyến hoàn thành: {completedTrips}</li>
                <li>Tỷ lệ hoàn thành: {totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(1) : 0}%</li>
                <li>Tổng quãng đường: {totalDistance.toFixed(1)} km</li>
                <li>Tổng nhiên liệu: {totalFuel.toFixed(1)} L</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Hiệu suất</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>Quãng đường trung bình: {totalTrips > 0 ? (totalDistance / totalTrips).toFixed(1) : 0} km/chuyến</li>
                <li>Nhiên liệu trung bình: {totalTrips > 0 ? (totalFuel / totalTrips).toFixed(1) : 0} L/chuyến</li>
                <li>Tỷ lệ sự cố: {totalTrips > 0 ? ((totalIncidents / totalTrips) * 100).toFixed(1) : 0}%</li>
                <li>Học sinh trung bình: {totalTrips > 0 ? (filteredTrips.reduce((sum, trip) => sum + trip.students, 0) / totalTrips).toFixed(1) : 0} người/chuyến</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
