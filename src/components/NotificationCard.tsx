import React from 'react';

interface NotificationCardProps {
  title: string;
  message: string;
  time: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  isRead?: boolean;
}

export default function NotificationCard({
  title,
  message,
  time,
  type = 'info',
  isRead = false
}: NotificationCardProps) {
  const typeConfig = {
    info: { icon: '🔵', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    warning: { icon: '⚠️', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    success: { icon: '✅', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    error: { icon: '🔴', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
  };

  return (
    <div className={`${typeConfig[type].bgColor} ${typeConfig[type].borderColor} border rounded-lg p-4 ${!isRead ? 'shadow-md' : 'opacity-75'}`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{typeConfig[type].icon}</span>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            {!isRead && (
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
          <p className="text-xs text-gray-500 mt-2">{time}</p>
        </div>
      </div>
    </div>
  );
}
