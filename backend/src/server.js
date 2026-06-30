require('dotenv').config();
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);   
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173'
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/friends', require('./routes/friends'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.io - real-time online/study status
const onlineUsers = new Map(); // userId -> socketId

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.userId;
  onlineUsers.set(userId, socket.id);

  // Mark user online
  await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

  // Notify friends that this user came online
  const user = await User.findById(userId).populate('friends', '_id');
  user?.friends?.forEach(friend => {
    const friendSocket = onlineUsers.get(friend._id.toString());
    if (friendSocket) {
      io.to(friendSocket).emit('friend_online', { userId, name: user.name });
    }
  });

  // Timer events
  socket.on('timer_start', async ({ courseName }) => {
    await User.findByIdAndUpdate(userId, {
      'currentlyStudying.active': true,
      'currentlyStudying.courseName': courseName || 'General Study',
      'currentlyStudying.startedAt': new Date()
    });
    // Notify friends
    const u = await User.findById(userId).populate('friends', '_id');
    u?.friends?.forEach(friend => {
      const fs = onlineUsers.get(friend._id.toString());
      if (fs) io.to(fs).emit('friend_studying', { userId, name: u.name, courseName: courseName || 'General Study' });
    });
  });

  socket.on('timer_stop', async () => {
    await User.findByIdAndUpdate(userId, {
      'currentlyStudying.active': false,
      'currentlyStudying.courseName': '',
    });
    const u = await User.findById(userId).populate('friends', '_id');
    u?.friends?.forEach(friend => {
      const fs = onlineUsers.get(friend._id.toString());
      if (fs) io.to(fs).emit('friend_stopped', { userId });
    });
  });

  socket.on('disconnect', async () => {
    onlineUsers.delete(userId);
    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date(), 'currentlyStudying.active': false });
    const u = await User.findById(userId).populate('friends', '_id');
    u?.friends?.forEach(friend => {
      const fs = onlineUsers.get(friend._id.toString());
      if (fs) io.to(fs).emit('friend_offline', { userId });
    });
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../../frontend/dist/index.html')));
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studytracker')
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = { app, io };
