const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const authMiddleware = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const inferenceRoutes = require('./routes/inferenceRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
const apiV1Prefix = config.api.baseUrl;

// Public routes (no authentication required)
app.use(`${apiV1Prefix}/auth`, authRoutes);

// Private routes (authentication required)
app.use(`${apiV1Prefix}/users`, authMiddleware, userRoutes);
app.use(`${apiV1Prefix}/inference`, authMiddleware, inferenceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: {
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: { code: 'NOT_FOUND' }
  });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}${apiV1Prefix}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
});

module.exports = app;
