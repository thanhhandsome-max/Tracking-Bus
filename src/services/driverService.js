import api from './api';

// Driver Service - Handles all driver-related API calls
export const driverService = {
  // Schedule Management
  getSchedule: (params = {}) => {
    return api.get('/driver/schedule', params);
  },

  getTodaySchedule: () => {
    return api.get('/driver/schedule/today');
  },

  getWeeklySchedule: (weekStart) => {
    return api.get('/driver/schedule/week', { weekStart });
  },

  // Trip Management
  getCurrentTrip: () => {
    return api.get('/driver/trip/current');
  },

  startTrip: (tripData) => {
    return api.post('/driver/trip/start', tripData);
  },

  updateTripStatus: (tripId, status, data = {}) => {
    return api.patch(`/driver/trip/${tripId}/status`, { status, ...data });
  },

  endTrip: (tripId, tripData) => {
    return api.post(`/driver/trip/${tripId}/end`, tripData);
  },

  getTripHistory: (params = {}) => {
    return api.get('/driver/trip/history', params);
  },

  // Incident Reporting
  reportIncident: (incidentData) => {
    return api.post('/driver/incidents', incidentData);
  },

  getIncidents: (params = {}) => {
    return api.get('/driver/incidents', params);
  },

  getIncidentById: (id) => {
    return api.get(`/driver/incidents/${id}`);
  },

  updateIncident: (id, incidentData) => {
    return api.put(`/driver/incidents/${id}`, incidentData);
  },

  // Location Tracking
  updateLocation: (locationData) => {
    return api.post('/driver/location/update', locationData);
  },

  getLocationHistory: (params = {}) => {
    return api.get('/driver/location/history', params);
  },

  // Student Management
  getStudentsOnBus: (tripId) => {
    return api.get(`/driver/trip/${tripId}/students`);
  },

  markStudentBoarded: (tripId, studentId, data = {}) => {
    return api.post(`/driver/trip/${tripId}/students/${studentId}/board`, data);
  },

  markStudentDroppedOff: (tripId, studentId, data = {}) => {
    return api.post(`/driver/trip/${tripId}/students/${studentId}/dropoff`, data);
  },

  // Notifications
  getNotifications: (params = {}) => {
    return api.get('/driver/notifications', params);
  },

  markNotificationAsRead: (id) => {
    return api.patch(`/driver/notifications/${id}/read`);
  },

  markAllNotificationsAsRead: () => {
    return api.patch('/driver/notifications/read-all');
  },

  // Profile Management
  getProfile: () => {
    return api.get('/driver/profile');
  },

  updateProfile: (profileData) => {
    return api.put('/driver/profile', profileData);
  },

  changePassword: (passwordData) => {
    return api.post('/driver/profile/change-password', passwordData);
  },

  // Performance & Statistics
  getPerformanceStats: (params = {}) => {
    return api.get('/driver/performance', params);
  },

  getTripStatistics: (params = {}) => {
    return api.get('/driver/statistics/trips', params);
  },

  getIncidentStatistics: (params = {}) => {
    return api.get('/driver/statistics/incidents', params);
  },

  // Route Information
  getRouteDetails: (routeId) => {
    return api.get(`/driver/routes/${routeId}`);
  },

  getRouteStops: (routeId) => {
    return api.get(`/driver/routes/${routeId}/stops`);
  },

  // Emergency Functions
  sendEmergencyAlert: (alertData) => {
    return api.post('/driver/emergency/alert', alertData);
  },

  getEmergencyContacts: () => {
    return api.get('/driver/emergency/contacts');
  },

  // Maintenance
  reportMaintenanceIssue: (issueData) => {
    return api.post('/driver/maintenance/report', issueData);
  },

  getMaintenanceHistory: (params = {}) => {
    return api.get('/driver/maintenance/history', params);
  },

  // Fuel Management
  recordFuelConsumption: (fuelData) => {
    return api.post('/driver/fuel/record', fuelData);
  },

  getFuelHistory: (params = {}) => {
    return api.get('/driver/fuel/history', params);
  },

  // Attendance
  clockIn: (clockInData) => {
    return api.post('/driver/attendance/clock-in', clockInData);
  },

  clockOut: (clockOutData) => {
    return api.post('/driver/attendance/clock-out', clockOutData);
  },

  getAttendanceHistory: (params = {}) => {
    return api.get('/driver/attendance/history', params);
  },

  // Communication
  sendMessageToAdmin: (messageData) => {
    return api.post('/driver/communication/admin', messageData);
  },

  sendMessageToParents: (messageData) => {
    return api.post('/driver/communication/parents', messageData);
  },

  getMessages: (params = {}) => {
    return api.get('/driver/communication/messages', params);
  },

  // Settings
  updateSettings: (settings) => {
    return api.put('/driver/settings', settings);
  },

  getSettings: () => {
    return api.get('/driver/settings');
  }
};

export default driverService;
