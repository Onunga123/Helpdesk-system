const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

console.log('SERVER STARTED FROM:', __dirname);
console.log('ROUTES FOLDER:', require('fs').readdirSync(__dirname + '/routes'));

// Use .env as source of truth for local dev (Windows/shell may already set MONGO_URI).
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();

const corsOrigins = [
  'https://helpdinesk-system-smoky.vercel.app',
  'https://helpdesk-system-smoky.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
].filter(Boolean);

const corsOptions = {
  origin: [...new Set(corsOrigins)],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  } catch {
    process.exit(1);
  }
}

start();
