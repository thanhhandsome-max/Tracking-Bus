const fs = require("fs");
const path = require("path");

class LoggingService {
  constructor() {
    this.logDir = path.join(__dirname, "../../logs");
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogFileName(type) {
    const date = new Date().toISOString().split("T")[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }

  formatLogMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}\n`;
  }

  writeLog(type, level, message, meta = {}) {
    const logFile = this.getLogFileName(type);
    const logMessage = this.formatLogMessage(level, message, meta);

    fs.appendFileSync(logFile, logMessage);

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      const colors = {
        error: "\x1b[31m", // Red
        warn: "\x1b[33m", // Yellow
        info: "\x1b[36m", // Cyan
        debug: "\x1b[37m", // White
        reset: "\x1b[0m", // Reset
      };

      console.log(
        `${colors[level] || colors.reset}${logMessage.trim()}${colors.reset}`
      );
    }
  }

  // Application logs
  info(message, meta = {}) {
    this.writeLog("app", "info", message, meta);
  }

  error(message, meta = {}) {
    this.writeLog("app", "error", message, meta);
  }

  warn(message, meta = {}) {
    this.writeLog("app", "warn", message, meta);
  }

  debug(message, meta = {}) {
    this.writeLog("app", "debug", message, meta);
  }

  // Database logs
  dbQuery(query, params = [], executionTime = null, meta = {}) {
    this.writeLog("database", "info", "Database Query", {
      query: query.substring(0, 200) + (query.length > 200 ? "..." : ""),
      params,
      executionTime: executionTime ? `${executionTime}ms` : null,
      ...meta,
    });
  }

  dbError(error, query = null, params = [], meta = {}) {
    this.writeLog("database", "error", "Database Error", {
      error: error.message,
      query: query
        ? query.substring(0, 200) + (query.length > 200 ? "..." : "")
        : null,
      params,
      ...meta,
    });
  }

  // API logs
  apiRequest(req, res, responseTime = null, meta = {}) {
    this.writeLog("api", "info", "API Request", {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.userId || null,
      userRole: req.user?.userRole || null,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : null,
      ...meta,
    });
  }

  apiError(error, req, res, meta = {}) {
    this.writeLog("api", "error", "API Error", {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.userId || null,
      userRole: req.user?.userRole || null,
      statusCode: res.statusCode || 500,
      ...meta,
    });
  }

  // Authentication logs
  authSuccess(userId, email, role, meta = {}) {
    this.writeLog("auth", "info", "Authentication Success", {
      userId,
      email,
      role,
      ...meta,
    });
  }

  authFailure(email, reason, meta = {}) {
    this.writeLog("auth", "warn", "Authentication Failure", {
      email,
      reason,
      ...meta,
    });
  }

  // Security logs
  securityViolation(type, details, req = null, meta = {}) {
    this.writeLog("security", "warn", "Security Violation", {
      type,
      details,
      ip: req?.ip || null,
      userAgent: req?.get("User-Agent") || null,
      userId: req?.user?.userId || null,
      ...meta,
    });
  }

  // Business logic logs
  busLocationUpdate(busId, location, driverId, meta = {}) {
    this.writeLog("business", "info", "Bus Location Update", {
      busId,
      location,
      driverId,
      ...meta,
    });
  }

  tripStatusChange(tripId, oldStatus, newStatus, userId, meta = {}) {
    this.writeLog("business", "info", "Trip Status Change", {
      tripId,
      oldStatus,
      newStatus,
      userId,
      ...meta,
    });
  }

  studentStatusChange(
    tripId,
    studentId,
    oldStatus,
    newStatus,
    userId,
    meta = {}
  ) {
    this.writeLog("business", "info", "Student Status Change", {
      tripId,
      studentId,
      oldStatus,
      newStatus,
      userId,
      ...meta,
    });
  }

  // Performance logs
  performance(operation, duration, meta = {}) {
    this.writeLog("performance", "info", "Performance Metric", {
      operation,
      duration: `${duration}ms`,
      ...meta,
    });
  }

  // System logs
  systemStart(meta = {}) {
    this.writeLog("system", "info", "System Started", {
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      ...meta,
    });
  }

  systemShutdown(meta = {}) {
    this.writeLog("system", "info", "System Shutdown", {
      uptime: process.uptime(),
      ...meta,
    });
  }

  // Error tracking
  trackError(error, context = {}, meta = {}) {
    this.writeLog("errors", "error", "Error Tracked", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      ...meta,
    });
  }

  // Clean up old log files (call this periodically)
  cleanupOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      files.forEach((file) => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned up old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error("Failed to cleanup old logs", { error: error.message });
    }
  }

  // Get log statistics
  getLogStats() {
    try {
      const files = fs.readdirSync(this.logDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        files: {},
      };

      files.forEach((file) => {
        const filePath = path.join(this.logDir, file);
        const fileStats = fs.statSync(filePath);
        stats.totalSize += fileStats.size;
        stats.files[file] = {
          size: fileStats.size,
          lastModified: fileStats.mtime,
        };
      });

      return stats;
    } catch (error) {
      this.error("Failed to get log stats", { error: error.message });
      return null;
    }
  }
}

// Singleton instance
const loggingService = new LoggingService();

// Export both class and instance
module.exports = loggingService;
module.exports.LoggingService = LoggingService;
