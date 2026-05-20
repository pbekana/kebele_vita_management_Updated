require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/connectDB');
const initDB = require('./config/initDB');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// ── Security & Parsing Middleware ────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '20mb' }));app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ── Global rate limiter ──────────────────────────────────
app.use('/api/', apiLimiter);

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/residents', require('./routes/residents'));
app.use('/api/kebele-staff',   require('./routes/kebeleStafs'));
app.use('/api/staff',     require('./routes/kebeleStafs'));
app.use('/api/admin',     require('./routes/admin'));

app.use('/api/tasks', require('./routes/taskRoutes'));
// ── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

// ── 404 handler ──────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ─────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Startup ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await initDB();
  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
};

start();

module.exports = app;