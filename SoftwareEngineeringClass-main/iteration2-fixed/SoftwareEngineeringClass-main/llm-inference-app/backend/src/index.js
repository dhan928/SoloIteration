const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const authMiddleware = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();

app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const apiV1Prefix = config.api.baseUrl;
app.use(`${apiV1Prefix}/auth`, authRoutes);
app.use(`${apiV1Prefix}/users`, authMiddleware, userRoutes);
app.use(`${apiV1Prefix}/conversations`, authMiddleware, conversationRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: { code: err.code || 'INTERNAL_ERROR' }
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found', error: { code: 'NOT_FOUND' } });
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}${apiV1Prefix}`);
});

module.exports = app;
