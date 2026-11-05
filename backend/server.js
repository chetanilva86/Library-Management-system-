// ============================================
// server.js - Main Entry Point
// Library Management System v2.0
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ========== Middleware ==========
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// ========== Routes ==========
const authRoutes  = require('./routes/auth');
const bookRoutes  = require('./routes/books');
const userRoutes  = require('./routes/users');

app.use('/api/auth',  authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);

// ========== Health Check ==========
app.get('/api', (req, res) => {
  res.json({ message: 'Library API is running! v2.0', status: 'OK' });
});

// ========== Connect DB & Start Server ==========
const startServer = () => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
};

const connectToDatabase = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_db';
  const fallbackUri = 'mongodb://127.0.0.1:27017/library_db';

  try {
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: false
    });
    console.log(`✅ MongoDB Connected Successfully to ${primaryUri}`);
    return true;
  } catch (error) {
    if (primaryUri !== fallbackUri) {
      console.log(`⚠️ Primary MongoDB connection failed: ${error.message}`);
      console.log('Trying local MongoDB instance...');

      try {
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000,
          retryWrites: false
        });
        console.log(`✅ MongoDB Connected Successfully to ${fallbackUri}`);
        return true;
      } catch (fallbackError) {
        console.log('❌ Local MongoDB Connection Error:', fallbackError.message);
      }
    } else {
      console.log('❌ MongoDB Connection Error:', error.message);
    }

    console.log('Starting server without a database connection.');
    return false;
  }
};

connectToDatabase().then(() => {
  startServer();
});
