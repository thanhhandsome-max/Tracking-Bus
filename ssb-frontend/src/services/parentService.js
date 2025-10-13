import api from './api';

// Parent Service - Handles all parent-related API calls
export const parentService = {
  // Children Management
  getChildren: () => {
    return api.get('/parent/children');
  },

  getChildById: (id) => {
    return api.get(`/parent/children/${id}`);
  },

  addChild: (childData) => {
    return api.post('/parent/children', childData);
  },

  updateChild: (id, childData) => {
    return api.put(`/parent/children/${id}`, childData);
  },

  removeChild: (id) => {
    return api.delete(`/parent/children/${id}`);
  },

  // Tracking
  getChildLocation: (childId) => {
    return api.get(`/parent/children/${childId}/location`);
  },

  getChildTripHistory: (childId, params = {}) => {
    return api.get(`/parent/children/${childId}/trips`, params);
  },

  getCurrentTrip: (childId) => {
    return api.get(`/parent/children/${childId}/current-trip`);
  },

  // Notifications
  getNotifications: (params = {}) => {
    return api.get('/parent/notifications', params);
  },

  getNotificationById: (id) => {
    return api.get(`/parent/notifications/${id}`);
  },

  markNotificationAsRead: (id) => {
    return api.patch(`/parent/notifications/${id}/read`);
  },

  markAllNotificationsAsRead: () => {
    return api.patch('/parent/notifications/read-all');
  },

  deleteNotification: (id) => {
    return api.delete(`/parent/notifications/${id}`);
  },

  // Notification Settings
  getNotificationSettings: () => {
    return api.get('/parent/notifications/settings');
  },

  updateNotificationSettings: (settings) => {
    return api.put('/parent/notifications/settings', settings);
  },

  // Profile Management
  getProfile: () => {
    return api.get('/parent/profile');
  },

  updateProfile: (profileData) => {
    return api.put('/parent/profile', profileData);
  },

  changePassword: (passwordData) => {
    return api.post('/parent/profile/change-password', passwordData);
  },

  // Emergency Contacts
  getEmergencyContacts: () => {
    return api.get('/parent/emergency-contacts');
  },

  addEmergencyContact: (contactData) => {
    return api.post('/parent/emergency-contacts', contactData);
  },

  updateEmergencyContact: (id, contactData) => {
    return api.put(`/parent/emergency-contacts/${id}`, contactData);
  },

  deleteEmergencyContact: (id) => {
    return api.delete(`/parent/emergency-contacts/${id}`);
  },

  // Communication
  sendMessageToDriver: (childId, messageData) => {
    return api.post(`/parent/children/${childId}/message-driver`, messageData);
  },

  sendMessageToAdmin: (messageData) => {
    return api.post('/parent/communication/admin', messageData);
  },

  getMessages: (params = {}) => {
    return api.get('/parent/communication/messages', params);
  },

  // Trip Management
  getUpcomingTrips: (childId) => {
    return api.get(`/parent/children/${childId}/upcoming-trips`);
  },

  getTripDetails: (tripId) => {
    return api.get(`/parent/trips/${tripId}`);
  },

  // Attendance
  getChildAttendance: (childId, params = {}) => {
    return api.get(`/parent/children/${childId}/attendance`, params);
  },

  reportAbsence: (childId, absenceData) => {
    return api.post(`/parent/children/${childId}/absence`, absenceData);
  },

  // Reports
  getChildReport: (childId, params = {}) => {
    return api.get(`/parent/children/${childId}/report`, params);
  },

  getMonthlyReport: (childId, month, year) => {
    return api.get(`/parent/children/${childId}/monthly-report`, { month, year });
  },

  // Safety Features
  getSafetyAlerts: (childId) => {
    return api.get(`/parent/children/${childId}/safety-alerts`);
  },

  acknowledgeSafetyAlert: (alertId) => {
    return api.patch(`/parent/safety-alerts/${alertId}/acknowledge`);
  },

  // Bus Information
  getBusInfo: (childId) => {
    return api.get(`/parent/children/${childId}/bus-info`);
  },

  getDriverInfo: (childId) => {
    return api.get(`/parent/children/${childId}/driver-info`);
  },

  getRouteInfo: (childId) => {
    return api.get(`/parent/children/${childId}/route-info`);
  },

  // Feedback
  submitFeedback: (feedbackData) => {
    return api.post('/parent/feedback', feedbackData);
  },

  getFeedbackHistory: (params = {}) => {
    return api.get('/parent/feedback/history', params);
  },

  // Settings
  getSettings: () => {
    return api.get('/parent/settings');
  },

  updateSettings: (settings) => {
    return api.put('/parent/settings', settings);
  },

  // Privacy Settings
  getPrivacySettings: () => {
    return api.get('/parent/privacy-settings');
  },

  updatePrivacySettings: (settings) => {
    return api.put('/parent/privacy-settings', settings);
  },

  // Location History
  getLocationHistory: (childId, params = {}) => {
    return api.get(`/parent/children/${childId}/location-history`, params);
  },

  // Real-time Updates
  subscribeToUpdates: (childId) => {
    // This would typically use WebSocket or Server-Sent Events
    return api.get(`/parent/children/${childId}/subscribe`);
  },

  unsubscribeFromUpdates: (childId) => {
    return api.delete(`/parent/children/${childId}/subscribe`);
  },

  // Emergency
  sendEmergencyAlert: (childId, alertData) => {
    return api.post(`/parent/children/${childId}/emergency`, alertData);
  },

  getEmergencyHistory: (childId) => {
    return api.get(`/parent/children/${childId}/emergency-history`);
  },

  // Payment (if applicable)
  getPaymentHistory: (params = {}) => {
    return api.get('/parent/payments', params);
  },

  getPaymentMethods: () => {
    return api.get('/parent/payment-methods');
  },

  addPaymentMethod: (paymentData) => {
    return api.post('/parent/payment-methods', paymentData);
  },

  updatePaymentMethod: (id, paymentData) => {
    return api.put(`/parent/payment-methods/${id}`, paymentData);
  },

  deletePaymentMethod: (id) => {
    return api.delete(`/parent/payment-methods/${id}`);
  }
};

export default parentService;
