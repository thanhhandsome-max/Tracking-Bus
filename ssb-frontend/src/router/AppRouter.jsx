import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import Layouts
import AdminLayout from '../components/layout/AdminLayout';
import DriverLayout from '../components/layout/DriverLayout';
import ParentLayout from '../components/layout/ParentLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Import Auth Pages
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';

// Import Admin Pages
import AdminDashboard from '../pages/Admin/Dashboard';
import Buses from '../pages/Admin/Buses';
import Drivers from '../pages/Admin/Drivers';
import Students from '../pages/Admin/Students';
import RoutesPage from '../pages/Admin/Routes';
import Schedule from '../pages/Admin/Schedule';
import Tracking from '../pages/Admin/Tracking';
import Notifications from '../pages/Admin/Notifications';
import Reports from '../pages/Admin/Reports';

// Import Driver Pages
import DriverSchedule from '../pages/Driver/Schedule';
import Trip from '../pages/Driver/Trip';
import Incident from '../pages/Driver/Incident';
import DriverHistory from '../pages/Driver/History';

// Import Parent Pages
import ParentHome from '../pages/Parent/Home';
import ParentHistory from '../pages/Parent/History';
import ParentNotifications from '../pages/Parent/Notifications';
import ParentProfile from '../pages/Parent/Profile';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Unauthorized Page Component
const Unauthorized = () => {
  const { logout, user } = useAuth();
  
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h1>
        <p className="text-gray-600 mb-4">
          Bạn không có quyền truy cập vào trang này.
        </p>
        {user && (
          <p className="text-sm text-gray-500 mb-4">
            Vai trò hiện tại: <span className="font-medium">{user.role}</span>
          </p>
        )}
        <div className="space-y-2">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mr-2"
          >
            Quay lại
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

// 404 Page Component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy trang</h1>
      <p className="text-gray-600 mb-4">
        Trang bạn đang tìm kiếm không tồn tại.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
      >
        Quay lại
      </button>
    </div>
  </div>
);

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes - Authentication */}
        <Route path="/login" element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        } />
        <Route path="/register" element={
          <AuthLayout>
            <Register />
          </AuthLayout>
        } />
        <Route path="/forgot-password" element={
          <AuthLayout>
            <ForgotPassword />
          </AuthLayout>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="buses" element={<Buses />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="students" element={<Students />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Driver Routes */}
        <Route path="/driver" element={
          <ProtectedRoute requiredRole="driver">
            <DriverLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/driver/schedule" replace />} />
          <Route path="schedule" element={<DriverSchedule />} />
          <Route path="trip" element={<Trip />} />
          <Route path="incident" element={<Incident />} />
          <Route path="history" element={<DriverHistory />} />
        </Route>

        {/* Parent Routes */}
        <Route path="/parent" element={
          <ProtectedRoute requiredRole="parent">
            <ParentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/parent/home" replace />} />
          <Route path="home" element={<ParentHome />} />
          <Route path="history" element={<ParentHistory />} />
          <Route path="notifications" element={<ParentNotifications />} />
          <Route path="profile" element={<ParentProfile />} />
        </Route>

        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
