const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cookieParser());

// Import routes
const authRoutes = require('./routes/auth');
const dreamRoutes = require('./routes/dreams');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://shepherd-db:27017/dreamshepherd';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_ORIGIN
    : ['http://localhost:5173', 'http://192.168.0.133:5173', 'http://shepherd-ui:5173'], // Vite dev server + Docker network
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for rich text content
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    service: 'dreamshepherd-api',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dreams', dreamRoutes);

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'DreamShepherd API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        intro: 'POST /auth/intro',
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout',
        me: 'GET /auth/me'
      },
      dreams: {
        list: 'GET /api/dreams',
        get: 'GET /api/dreams/:slug',
        create: 'POST /api/dreams',
        update: 'PUT /api/dreams/:slug',
        delete: 'DELETE /api/dreams/:slug',
        stats: 'GET /api/dreams/:slug/stats'
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`DreamShepherd service running on port ${PORT}`);
});
