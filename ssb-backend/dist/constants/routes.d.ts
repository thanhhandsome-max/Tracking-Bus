export declare const ROUTES: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER: "/auth/register";
        readonly LOGOUT: "/auth/logout";
        readonly REFRESH: "/auth/refresh";
        readonly PROFILE: "/auth/profile";
        readonly CHANGE_PASSWORD: "/auth/change-password";
        readonly FORGOT_PASSWORD: "/auth/forgot-password";
        readonly RESET_PASSWORD: "/auth/reset-password";
    };
    readonly BUSES: {
        readonly BASE: "/buses";
        readonly BY_ID: "/buses/:id";
        readonly ASSIGN_DRIVER: "/buses/:id/assign-driver";
        readonly POSITION: "/buses/:id/position";
        readonly STATUS: "/buses/:id/status";
        readonly STATS: "/buses/stats";
    };
    readonly DRIVERS: {
        readonly BASE: "/drivers";
        readonly BY_ID: "/drivers/:id";
        readonly ASSIGNMENTS: "/drivers/:id/assignments";
        readonly SCHEDULES: "/drivers/:id/schedules";
        readonly TRIPS: "/drivers/:id/trips";
        readonly STATS: "/drivers/stats";
    };
    readonly ROUTES: {
        readonly BASE: "/routes";
        readonly BY_ID: "/routes/:id";
        readonly STOPS: "/routes/:id/stops";
        readonly STOP_BY_ID: "/routes/:id/stops/:stopId";
        readonly STATS: "/routes/stats";
    };
    readonly SCHEDULES: {
        readonly BASE: "/schedules";
        readonly BY_ID: "/schedules/:id";
        readonly ASSIGN: "/schedules/:id/assign";
        readonly TRIP_STATUS: "/schedules/:id/trip-status";
        readonly CONFLICTS: "/schedules/conflicts";
        readonly STATS: "/schedules/stats";
    };
    readonly TRIPS: {
        readonly BASE: "/trips";
        readonly BY_ID: "/trips/:id";
        readonly START: "/trips/:id/start";
        readonly END: "/trips/:id/end";
        readonly STUDENT_STATUS: "/trips/:id/students/:studentId/status";
        readonly POSITION: "/trips/:id/position";
        readonly STATS: "/trips/stats";
    };
    readonly STUDENTS: {
        readonly BASE: "/students";
        readonly BY_ID: "/students/:id";
        readonly PARENT: "/students/:id/parent";
        readonly STATUS: "/students/:id/status";
        readonly TRIPS: "/students/:id/trips";
        readonly STATS: "/students/stats";
    };
    readonly PARENTS: {
        readonly BASE: "/parents";
        readonly BY_ID: "/parents/:id";
        readonly CHILDREN: "/parents/:id/children";
        readonly NOTIFICATIONS: "/parents/:id/notifications";
        readonly STATS: "/parents/stats";
    };
    readonly NOTIFICATIONS: {
        readonly BASE: "/notifications";
        readonly BY_ID: "/notifications/:id";
        readonly MARK_READ: "/notifications/:id/read";
        readonly MARK_ALL_READ: "/notifications/read-all";
        readonly STATS: "/notifications/stats";
    };
    readonly REPORTS: {
        readonly BASE: "/reports";
        readonly BUSES: "/reports/buses";
        readonly TRIPS: "/reports/trips";
        readonly STUDENTS: "/reports/students";
        readonly DRIVERS: "/reports/drivers";
        readonly SCHEDULES: "/reports/schedules";
        readonly EXPORT: "/reports/export";
    };
    readonly ADMIN: {
        readonly BASE: "/admin";
        readonly DASHBOARD: "/admin/dashboard";
        readonly SETTINGS: "/admin/settings";
        readonly THRESHOLDS: "/admin/settings/thresholds";
        readonly SYSTEM_HEALTH: "/admin/system/health";
        readonly USERS: "/admin/users";
        readonly BACKUP: "/admin/backup";
        readonly LOGS: "/admin/logs";
    };
    readonly HEALTH: {
        readonly BASE: "/health";
        readonly DETAILED: "/health/detailed";
        readonly DATABASE: "/health/database";
        readonly REDIS: "/health/redis";
        readonly SOCKET: "/health/socket";
    };
};
//# sourceMappingURL=routes.d.ts.map