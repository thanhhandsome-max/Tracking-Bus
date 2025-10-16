const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Import routes
const busRoutes = require("./routes/api/bus");
const driverRoutes = require("./routes/api/driver");
const scheduleRoutes = require("./routes/api/schedule");

// Import middlewares
// const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/buses", require("./routes/api/bus"));
app.use("/api/drivers", require("./routes/api/driver"));
app.use("/api/schedules", require("./routes/api/schedule"));
// Error handling middleware
// app.use(errorHandler);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Smart School Bus Tracking System API is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
