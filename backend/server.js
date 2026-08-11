const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');
const seedDatabase = require('./seed/seedData');
const { startQrRotation } = require('./services/qrSessionManager');
const { getLanIpAddress, getAppBaseUrl } = require('./utils/networkUtils');

const app = express();
const server = http.createServer(app);

// Enable Socket.IO with multi-origin CORS support
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static public folder for uploads (photos)
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Seed Database with initial production data
if (process.env.SEED_DB && process.env.SEED_DB.toLowerCase() === 'true') {
  try {
    seedDatabase();
  } catch (err) {
    console.error('Error during DB seeding:', err);
  }
}

// Socket.IO Room management
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join_session_room', (sessionId) => {
    if (sessionId) {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined room: ${sessionId}`);
    }
  });

  socket.on('leave_session_room', (sessionId) => {
    if (sessionId) {
      socket.leave(sessionId);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Resume QR Rotation if an ACTIVE session exists in DB
try {
  const activeSession = db.prepare("SELECT session_id FROM attendance_sessions WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1").get();
  if (activeSession) {
    console.log(`⚡ Resuming dynamic QR rotation for active session: ${activeSession.session_id}`);
    startQrRotation(io, activeSession.session_id);
  }
} catch (err) {
  console.error('Failed to resume active session on boot:', err);
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/student', require('./routes/students'));
app.use('/api/teacher', require('./routes/teachers'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

// System Network & Health Information Endpoint
app.get('/api/system/network-info', (req, res) => {
  const lanIp = getLanIpAddress();
  const appBaseUrl = getAppBaseUrl();
  const isLocalhostOnly = appBaseUrl.includes('localhost') || appBaseUrl.includes('127.0.0.1');

  res.json({
    success: true,
    lanIp,
    appBaseUrl,
    port: process.env.PORT || 5000,
    isLocalhostOnly,
    warning: isLocalhostOnly ? 'QR URLs currently use localhost. Set APP_BASE_URL in .env to your LAN IP (e.g. http://192.168.1.100:5173) for mobile camera scanning.' : null
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'IDEALAB SMART ATTENDANCE',
    lanIp: getLanIpAddress(),
    appBaseUrl: getAppBaseUrl(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  const lanIp = getLanIpAddress();
  const appBaseUrl = getAppBaseUrl();

  console.log(`==================================================`);
  console.log(`🚀 IDEALAB SMART ATTENDANCE BACKEND READY`);
  console.log(`"Scan • Verify • Attend"`);
  console.log(`Bound to Host: ${HOST} : Port ${PORT}`);
  console.log(`Local Access:   http://localhost:${PORT}`);
  console.log(`LAN Access:     http://${lanIp}:${PORT}`);
  console.log(`App Base URL:   ${appBaseUrl}`);
  console.log(`==================================================`);
});
