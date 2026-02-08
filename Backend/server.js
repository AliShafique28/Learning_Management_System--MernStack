const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const setupSocket = require('./config/socket');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();

// Create HTTP server
const httpserver = http.createServer(app);

// Initialize Socket.io
const io = new Server(httpserver, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5172',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Setup Socket.io handlers
// setupSocket(io);

// Middleware
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5172',
  credentials: true
}));

// Serve static files (uploaded videos, assignments, certificates)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible to routes
app.set('io', io);

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const moduleRoutes = require('./routes/modules');
const lessonRoutes = require('./routes/lessons');
const quizRoutes = require('./routes/quizzes');
const assignmentRoutes = require('./routes/assignments');
const enrollmentRoutes = require('./routes/enrollments');
const forumRoutes = require('./routes/forums');
const certificateRoutes = require('./routes/certificates');
const progressRoutes = require('./routes/progress');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/progress', progressRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LMS Backend API is running',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
