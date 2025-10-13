import api from './api';

// Admin Service - Handles all admin-related API calls
export const adminService = {
  // Dashboard Statistics
  getDashboardStats: () => {
    return api.get('/admin/dashboard/stats');
  },

  // Bus Management
  getBuses: (params = {}) => {
    return api.get('/admin/buses', params);
  },

  getBusById: (id) => {
    return api.get(`/admin/buses/${id}`);
  },

  createBus: (busData) => {
    return api.post('/admin/buses', busData);
  },

  updateBus: (id, busData) => {
    return api.put(`/admin/buses/${id}`, busData);
  },

  deleteBus: (id) => {
    return api.delete(`/admin/buses/${id}`);
  },

  // Driver Management
  getDrivers: (params = {}) => {
    return api.get('/admin/drivers', params);
  },

  getDriverById: (id) => {
    return api.get(`/admin/drivers/${id}`);
  },

  createDriver: (driverData) => {
    return api.post('/admin/drivers', driverData);
  },

  updateDriver: (id, driverData) => {
    return api.put(`/admin/drivers/${id}`, driverData);
  },

  deleteDriver: (id) => {
    return api.delete(`/admin/drivers/${id}`);
  },

  // Student Management
  getStudents: (params = {}) => {
    return api.get('/admin/students', params);
  },

  getStudentById: (id) => {
    return api.get(`/admin/students/${id}`);
  },

  createStudent: (studentData) => {
    return api.post('/admin/students', studentData);
  },

  updateStudent: (id, studentData) => {
    return api.put(`/admin/students/${id}`, studentData);
  },

  deleteStudent: (id) => {
    return api.delete(`/admin/students/${id}`);
  },

  // Route Management
  getRoutes: (params = {}) => {
    return api.get('/admin/routes', params);
  },

  getRouteById: (id) => {
    return api.get(`/admin/routes/${id}`);
  },

  createRoute: (routeData) => {
    return api.post('/admin/routes', routeData);
  },

  updateRoute: (id, routeData) => {
    return api.put(`/admin/routes/${id}`, routeData);
  },

  deleteRoute: (id) => {
    return api.delete(`/admin/routes/${id}`);
  },

  // Schedule Management
  getSchedules: (params = {}) => {
    return api.get('/admin/schedules', params);
  },

  getScheduleById: (id) => {
    return api.get(`/admin/schedules/${id}`);
  },

  createSchedule: (scheduleData) => {
    return api.post('/admin/schedules', scheduleData);
  },

  updateSchedule: (id, scheduleData) => {
    return api.put(`/admin/schedules/${id}`, scheduleData);
  },

  deleteSchedule: (id) => {
    return api.delete(`/admin/schedules/${id}`);
  },

  // Tracking
  getBusLocations: (params = {}) => {
    return api.get('/admin/tracking/locations', params);
  },

  getBusLocationById: (id) => {
    return api.get(`/admin/tracking/locations/${id}`);
  },

  // Notifications
  getNotifications: (params = {}) => {
    return api.get('/admin/notifications', params);
  },

  markNotificationAsRead: (id) => {
    return api.patch(`/admin/notifications/${id}/read`);
  },

  markAllNotificationsAsRead: () => {
    return api.patch('/admin/notifications/read-all');
  },

  createNotification: (notificationData) => {
    return api.post('/admin/notifications', notificationData);
  },

  // Reports
  getReports: (params = {}) => {
    return api.get('/admin/reports', params);
  },

  generateReport: (reportData) => {
    return api.post('/admin/reports/generate', reportData);
  },

  downloadReport: (reportId) => {
    return api.get(`/admin/reports/${reportId}/download`);
  },

  // Analytics
  getAnalytics: (params = {}) => {
    return api.get('/admin/analytics', params);
  },

  // System Settings
  getSystemSettings: () => {
    return api.get('/admin/settings');
  },

  updateSystemSettings: (settings) => {
    return api.put('/admin/settings', settings);
  },

  // User Management
  getUsers: (params = {}) => {
    return api.get('/admin/users', params);
  },

  getUserById: (id) => {
    return api.get(`/admin/users/${id}`);
  },

  createUser: (userData) => {
    return api.post('/admin/users', userData);
  },

  updateUser: (id, userData) => {
    return api.put(`/admin/users/${id}`, userData);
  },

  deleteUser: (id) => {
    return api.delete(`/admin/users/${id}`);
  },

  // Bulk Operations
  bulkUpdateBuses: (busIds, updateData) => {
    return api.patch('/admin/buses/bulk-update', { busIds, updateData });
  },

  bulkDeleteBuses: (busIds) => {
    return api.delete('/admin/buses/bulk-delete', { busIds });
  },

  bulkUpdateDrivers: (driverIds, updateData) => {
    return api.patch('/admin/drivers/bulk-update', { driverIds, updateData });
  },

  bulkDeleteDrivers: (driverIds) => {
    return api.delete('/admin/drivers/bulk-delete', { driverIds });
  },

  // Export Data
  exportBuses: (params = {}) => {
    return api.get('/admin/buses/export', params);
  },

  exportDrivers: (params = {}) => {
    return api.get('/admin/drivers/export', params);
  },

  exportStudents: (params = {}) => {
    return api.get('/admin/students/export', params);
  },

  exportReports: (params = {}) => {
    return api.get('/admin/reports/export', params);
  }
};

export default adminService;
