const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Force .env to always override any shell environment variables
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();

// ─── MIDDLEWARE ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'TUC ICT Help Desk API is running...',
    version: '1.0.0',
    university: 'Turkana University College',
  });
});

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Ticket routes
app.use('/api/tickets', require('./routes/ticketRoutes'));

// User management routes
app.use('/api/users', require('./routes/userRoutes'));

// Knowledge base routes
app.use('/api/knowledge', require('./routes/knowledgeBaseRoutes'));

// Asset management routes
app.use('/api/assets', require('./routes/assetRoutes'));

// Reports routes
app.use('/api/reports', require('./routes/reportRoutes'));

// Upload routes
app.use('/api/upload', require('./routes/uploadRoutes'));

// ─── ERROR HANDLER ───────────────────────────────────────────
app.use(errorHandler);

// ─── START SERVER ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `Port ${PORT} is already in use. Stop the other process or change PORT in server/.env.`
        );
      } else {
        console.error(`Server startup error: ${err.message}`);
      }
      process.exit(1);
    });

  } catch {
    process.exit(1);
  }
}

start();