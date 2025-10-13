const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
// const adminRoutes = require('./routes/adminRoutes');
// const driverRoutes = require('./routes/driverRoutes');
// const parentRoutes = require('./routes/parentRoutes');
// const authRoutes = require('./routes/authRoutes');
// const trackingRoutes = require('./routes/trackingRoutes');

// Import middlewares
// const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// app.use('/api/admin', adminRoutes);
// app.use('/api/driver', driverRoutes);
// app.use('/api/parent', parentRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/tracking', trackingRoutes);

// Error handling middleware
// app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Smart School Bus Tracking System API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
