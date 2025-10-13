import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">🚌</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">Smart School Bus</h1>
                <p className="text-sm text-gray-600">Hệ thống quản lý xe bus trường học</p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Chưa có tài khoản?</p>
                  <a href="/register" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Đăng ký ngay
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                © 2024 Smart School Bus Tracking System. Tất cả quyền được bảo lưu.
              </p>
              <div className="mt-2 flex justify-center space-x-6">
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Điều khoản sử dụng
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Chính sách bảo mật
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Liên hệ hỗ trợ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-indigo-200 rounded-full opacity-20"></div>
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-purple-200 rounded-full opacity-20"></div>
      <div className="absolute bottom-40 right-10 w-24 h-24 bg-pink-200 rounded-full opacity-20"></div>
    </div>
  );
};

export default AuthLayout;
