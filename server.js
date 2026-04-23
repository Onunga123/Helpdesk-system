const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Use .env as source of truth for local dev (Windows/shell may already set MONGO_URI).
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    message: 'TUC ICT Help Desk API is running...',
    version: '1.0.0',
    university: 'Turkana University College',
  });
});
// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

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
