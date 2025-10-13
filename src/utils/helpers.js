// Utility functions for the Smart School Bus Tracking System

// Date and Time Utilities
export const formatDate = (date, format = 'dd/mm/yyyy') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  switch (format) {
    case 'dd/mm/yyyy':
      return `${day}/${month}/${year}`;
    case 'mm/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'yyyy-mm-dd':
      return `${year}-${month}-${day}`;
    case 'dd/mm/yyyy hh:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'hh:mm':
      return `${hours}:${minutes}`;
    case 'hh:mm:ss':
      return `${hours}:${minutes}:${seconds}`;
    default:
      return d.toLocaleDateString('vi-VN');
  }
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }
};

export const getCurrentTime = () => {
  return new Date().toISOString();
};

export const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
};

export const isThisWeek = (date) => {
  if (!date) return false;
  const today = new Date();
  const checkDate = new Date(date);
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  return checkDate >= startOfWeek && checkDate <= endOfWeek;
};

// String Utilities
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Validation Utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const isValidPassword = (password) => {
  // At least 6 characters, contains at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password);
};

// Number Utilities
export const formatNumber = (num, decimals = 0) => {
  if (isNaN(num)) return '0';
  return Number(num).toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatCurrency = (amount, currency = 'VND') => {
  if (isNaN(amount)) return '0 VND';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDistance = (distance) => {
  if (isNaN(distance)) return '0 km';
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

export const formatSpeed = (speed) => {
  if (isNaN(speed)) return '0 km/h';
  return `${speed} km/h`;
};

// Array Utilities
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

export const uniqueBy = (array, key) => {
  const seen = new Set();
  return array.filter(item => {
    const val = item[key];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
};

// Status Utilities
export const getStatusColor = (status, type = 'default') => {
  const statusColors = {
    default: {
      active: 'green',
      inactive: 'gray',
      pending: 'yellow',
      completed: 'green',
      cancelled: 'red',
      error: 'red',
      warning: 'yellow',
      info: 'blue'
    },
    bus: {
      active: 'green',
      maintenance: 'yellow',
      inactive: 'red',
      offline: 'gray'
    },
    trip: {
      scheduled: 'blue',
      in_progress: 'yellow',
      completed: 'green',
      cancelled: 'red',
      delayed: 'orange'
    },
    incident: {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red'
    }
  };

  const colors = statusColors[type] || statusColors.default;
  return colors[status] || 'gray';
};

export const getStatusText = (status, type = 'default') => {
  const statusTexts = {
    default: {
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      pending: 'Đang chờ',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      error: 'Lỗi',
      warning: 'Cảnh báo',
      info: 'Thông tin'
    },
    bus: {
      active: 'Hoạt động',
      maintenance: 'Bảo trì',
      inactive: 'Ngừng hoạt động',
      offline: 'Mất kết nối'
    },
    trip: {
      scheduled: 'Đã lên lịch',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      delayed: 'Trễ giờ'
    },
    incident: {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      critical: 'Nghiêm trọng'
    }
  };

  const texts = statusTexts[type] || statusTexts.default;
  return texts[status] || status;
};

// Local Storage Utilities
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// URL Utilities
export const getQueryParams = (url = window.location.href) => {
  const params = new URLSearchParams(new URL(url).search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      searchParams.append(key, params[key]);
    }
  });
  return searchParams.toString();
};

// Debounce and Throttle
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Error Handling
export const handleError = (error, defaultMessage = 'Đã xảy ra lỗi') => {
  console.error('Error:', error);
  
  if (error.response) {
    // Server responded with error status
    return error.response.data?.message || defaultMessage;
  } else if (error.request) {
    // Request was made but no response received
    return 'Không thể kết nối đến server';
  } else {
    // Something else happened
    return error.message || defaultMessage;
  }
};

// Constants
export const ROLES = {
  ADMIN: 'admin',
  DRIVER: 'driver',
  PARENT: 'parent'
};

export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE_USERS: 'manage_users',
  MANAGE_BUSES: 'manage_buses',
  MANAGE_DRIVERS: 'manage_drivers',
  MANAGE_TRIPS: 'manage_trips',
  REPORT_INCIDENTS: 'report_incidents',
  TRACK_CHILDREN: 'track_children'
};

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const INCIDENT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const TRIP_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed'
};
