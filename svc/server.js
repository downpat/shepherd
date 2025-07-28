const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://192.168.0.133:27017/dreamshepherd';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());

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

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'DreamShepherd API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      dreams: '/api/dreams'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`DreamShepherd service running on port ${PORT}`);
});
