const crypto = require('crypto');
const db = require('../config/database');
const { getAppBaseUrl } = require('../utils/networkUtils');

const activeTimers = new Map(); // session_id -> setInterval handle

function generateSecureToken() {
  return crypto.randomBytes(24).toString('hex');
}

function generateRandomCode() {
  return Math.floor(10 + Math.random() * 90); // 2 digit code e.g. 47
}

function startQrRotation(io, sessionId) {
  if (activeTimers.has(sessionId)) {
    clearInterval(activeTimers.get(sessionId));
  }

  const rotateToken = () => {
    try {
      const session = db.prepare('SELECT * FROM attendance_sessions WHERE session_id = ?').get(sessionId);
      if (!session || session.status !== 'ACTIVE') {
        if (activeTimers.has(sessionId)) {
          clearInterval(activeTimers.get(sessionId));
          activeTimers.delete(sessionId);
        }
        return;
      }

      const newToken = generateSecureToken();
      const newCode = generateRandomCode();
      const expirationTime = new Date(Date.now() + 60 * 1000).toISOString();

      db.prepare(`
        UPDATE attendance_sessions
        SET current_token = ?, current_code = ?, token_expires_at = ?
        WHERE session_id = ?
      `).run(newToken, newCode, expirationTime, sessionId);

      const presentCount = db.prepare(`
        SELECT COUNT(*) as count FROM attendance WHERE session_id = ? AND status = 'PRESENT'
      `).get(sessionId).count;

      const lab = db.prepare('SELECT * FROM labs WHERE lab_id = ?').get(session.lab_id);

      const baseUrl = getAppBaseUrl();
      const qrScanUrl = `${baseUrl}/attendance/verify?session=${sessionId}&token=${newToken}`;

      const payload = {
        sessionId,
        token: newToken,
        code: newCode,
        expiresInSeconds: 60,
        expiresAt: expirationTime,
        labName: lab ? lab.lab_name : 'IdeaLab',
        totalStudents: session.total_eligible || 120,
        presentCount,
        date: session.date,
        startTime: session.start_time,
        batch: session.batch,
        appBaseUrl: baseUrl,
        qrScanUrl
      };

      // Broadcast new QR token to lab displays and teacher dashboards
      io.to(sessionId).emit('qr_update', payload);
      io.emit('global_session_update', payload);

    } catch (err) {
      console.error('Error in rotateToken for session', sessionId, err);
    }
  };

  // Immediate initial rotation
  rotateToken();

  // Schedule timer every 60 seconds
  const timer = setInterval(rotateToken, 60 * 1000);
  activeTimers.set(sessionId, timer);
}

function stopQrRotation(sessionId) {
  if (activeTimers.has(sessionId)) {
    clearInterval(activeTimers.get(sessionId));
    activeTimers.delete(sessionId);
  }
}

module.exports = {
  startQrRotation,
  stopQrRotation,
  generateSecureToken,
  generateRandomCode
};
