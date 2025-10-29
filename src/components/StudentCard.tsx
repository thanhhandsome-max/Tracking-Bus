import React from 'react';

interface StudentCardProps {
  name: string;
  className: string;
  busNumber?: string;
  route?: string;
  pickupTime?: string;
  dropoffTime?: string;
  status?: 'on-bus' | 'picked-up' | 'dropped-off' | 'waiting';
}

export default function StudentCard({
  name,
  className,
  busNumber,
  route,
  pickupTime,
  dropoffTime,
  status = 'waiting'
}: StudentCardProps) {
  const statusConfig = {
    'on-bus': { label: 'Đang trên xe', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    'picked-up': { label: 'Đã đón', color: 'bg-green-100 text-green-700 border-green-300' },
    'dropped-off': { label: 'Đã trả', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    'waiting': { label: 'Chờ đón', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{name.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">{name}</h3>
            <p className="text-sm text-gray-500">{className}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[status].color}`}>
          {statusConfig[status].label}
        </span>
      </div>

      {(busNumber || route) && (
        <div className="space-y-2 pt-3 border-t border-gray-100">
          {busNumber && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
              <span className="text-gray-700">Xe: <span className="font-medium">{busNumber}</span></span>
            </div>
          )}
          {route && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-gray-700">Tuyến: <span className="font-medium">{route}</span></span>
            </div>
          )}
        </div>
      )}

      {(pickupTime || dropoffTime) && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
          {pickupTime && (
            <div className="text-xs">
              <p className="text-gray-500">Giờ đón</p>
              <p className="font-semibold text-gray-800">{pickupTime}</p>
            </div>
          )}
          {dropoffTime && (
            <div className="text-xs">
              <p className="text-gray-500">Giờ trả</p>
              <p className="font-semibold text-gray-800">{dropoffTime}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
