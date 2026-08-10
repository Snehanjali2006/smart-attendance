const crypto = require('crypto');
const db = require('../config/database');
const { getAppBaseUrl } = require('../utils/networkUtils');
<<<<<<< HEAD
const QRCode = require('qrcode');
=======
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492

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

<<<<<<< HEAD
  const rotateToken = async () => {
=======
  const rotateToken = () => {
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
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
<<<<<<< HEAD
      const expirationTime = new Date(Date.now() + 180 * 1000).toISOString();
=======
      const expirationTime = new Date(Date.now() + 60 * 1000).toISOString();
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492

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
<<<<<<< HEAD
      const qrCode = await QRCode.toDataURL(qrScanUrl);
=======
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492

      const payload = {
        sessionId,
        token: newToken,
        code: newCode,
<<<<<<< HEAD
        expiresInSeconds: 180,
=======
        expiresInSeconds: 60,
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
        expiresAt: expirationTime,
        labName: lab ? lab.lab_name : 'IdeaLab',
        totalStudents: session.total_eligible || 120,
        presentCount,
        date: session.date,
        startTime: session.start_time,
        batch: session.batch,
        appBaseUrl: baseUrl,
<<<<<<< HEAD
        qrScanUrl,
        qrCode
=======
        qrScanUrl
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
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

<<<<<<< HEAD
  // Schedule timer every 180 seconds
  const timer = setInterval(rotateToken, 180 * 1000);
=======
  // Schedule timer every 60 seconds
  const timer = setInterval(rotateToken, 60 * 1000);
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
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
