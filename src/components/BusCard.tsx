import React from 'react';

interface BusCardProps {
  busNumber: string;
  driverName: string;
  route: string;
  currentLocation?: string;
  studentCount?: number;
  status?: 'active' | 'inactive' | 'arriving';
  eta?: string;
}

export default function BusCard({
  busNumber,
  driverName,
  route,
  currentLocation,
  studentCount,
  status = 'active',
  eta
}: BusCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-700 border-green-300',
    inactive: 'bg-gray-100 text-gray-600 border-gray-300',
    arriving: 'bg-yellow-100 text-yellow-700 border-yellow-300'
  };

  const statusLabels = {
    active: 'Đang hoạt động',
    inactive: 'Không hoạt động',
    arriving: 'Sắp đến'
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Xe {busNumber}</h3>
          <p className="text-sm text-gray-600">Tài xế: {driverName}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-gray-700">Tuyến: <span className="font-medium">{route}</span></span>
        </div>

        {currentLocation && (
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-700">{currentLocation}</span>
          </div>
        )}

        {studentCount !== undefined && (
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-gray-700">Học sinh: <span className="font-medium">{studentCount}</span></span>
          </div>
        )}
      </div>

      {eta && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">Thời gian dự kiến đến: <span className="font-semibold text-blue-600">{eta}</span></p>
        </div>
      )}

      <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
        Xem chi tiết
      </button>
    </div>
  );
}
