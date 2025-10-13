import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const DriverLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Menu items cho sidebar
  const menuItems = [
    { name: 'Lịch trình', path: '/driver/schedule', icon: '📅' },
    { name: 'Chuyến đi', path: '/driver/trip', icon: '🚌' },
    { name: 'Báo cáo sự cố', path: '/driver/incident', icon: '⚠️' },
    { name: 'Lịch sử', path: '/driver/history', icon: '📋' }
  ];

  const handleLogout = () => {
    // TODO: Implement logout logic
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-green-600">
          <h1 className="text-xl font-bold text-white">SSB Driver</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white lg:hidden"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-5 px-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActiveRoute(item.path)
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">D</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Driver User</p>
              <p className="text-xs text-gray-500">Tài xế</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
          >
            <span className="mr-2">🚪</span>
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-600 lg:hidden"
            >
              <span className="text-xl">☰</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {menuItems.find(item => isActiveRoute(item.path))?.name || 'Lịch trình'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Current Status */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Đang hoạt động</span>
              </div>
              
              {/* Notification Bell */}
              <button className="text-gray-500 hover:text-gray-600">
                <div className="relative">
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="text-xl">🔔</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DriverLayout;
