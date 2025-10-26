import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Import routes
import busRoutes from "./routes/api/bus.js";
import driverRoutes from "./routes/api/driver.js";
import scheduleRoutes from "./routes/api/schedule.js";

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
app.use("/api/buses", busRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/schedules", scheduleRoutes);
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

export default app;
