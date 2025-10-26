export const EVT_TRIP_STARTED = "trip_started";
export const EVT_TRIP_COMPLETED = "trip_completed";
export const EVT_BUS_POS_UPDATE = "bus_position_update";
export const EVT_APPROACH_STOP = "approach_stop";
export const EVT_DELAY_ALERT = "delay_alert";
export const roomBus = (busId) => `bus-${busId}`;
export const roomTrip = (tripId) => `trip-${tripId}`;
export const roomUser = (userId) => `user-${userId}`;
export const SOCKET_ROOMS = {
    BUS: (busId) => `bus-${busId}`,
    TRIP: (tripId) => `trip-${tripId}`,
    USER: (userId) => `user-${userId}`,
    DRIVER: (driverId) => `driver-${driverId}`,
    PARENT: (parentId) => `parent-${parentId}`,
    ADMIN: 'admin',
    NOTIFICATIONS: (userId) => `notifications-${userId}`,
};
export const SOCKET_EVENTS = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    AUTHENTICATE: 'authenticate',
    AUTHENTICATED: 'authenticated',
    UNAUTHORIZED: 'unauthorized',
    JOIN_ROOM: 'join-room',
    LEAVE_ROOM: 'leave-room',
    JOINED_ROOM: 'joined-room',
    LEFT_ROOM: 'left-room',
    BUS_POSITION_UPDATE: 'bus_position_update',
    BUS_STATUS_CHANGE: 'bus_status_change',
    BUS_ASSIGNED: 'bus_assigned',
    BUS_UNASSIGNED: 'bus_unassigned',
    TRIP_STARTED: 'trip_started',
    TRIP_COMPLETED: 'trip_completed',
    TRIP_CANCELLED: 'trip_cancelled',
    TRIP_DELAYED: 'trip_delayed',
    TRIP_STATUS_CHANGE: 'trip_status_change',
    STUDENT_PICKED_UP: 'student_picked_up',
    STUDENT_DROPPED_OFF: 'student_dropped_off',
    STUDENT_ABSENT: 'student_absent',
    STUDENT_STATUS_CHANGE: 'student_status_change',
    APPROACHING_STOP: 'approaching_stop',
    ARRIVED_AT_STOP: 'arrived_at_stop',
    LEFT_STOP: 'left_stop',
    DELAY_ALERT: 'delay_alert',
    EMERGENCY_ALERT: 'emergency_alert',
    MAINTENANCE_ALERT: 'maintenance_alert',
    WEATHER_ALERT: 'weather_alert',
    NOTIFICATION: 'notification',
    NOTIFICATION_READ: 'notification_read',
    NOTIFICATION_DELETED: 'notification_deleted',
    SYSTEM_MAINTENANCE: 'system_maintenance',
    SYSTEM_UPDATE: 'system_update',
    SYSTEM_ERROR: 'system_error',
};
//# sourceMappingURL=realtime.js.map