const db = require('../config/database');
const { startQrRotation, stopQrRotation, generateSecureToken, generateRandomCode } = require('../services/qrSessionManager');
const { getAppBaseUrl, getLanIpAddress } = require('../utils/networkUtils');
<<<<<<< HEAD
const QRCode = require('qrcode');

exports.startSession = async (req, res) => {
=======

exports.startSession = (req, res) => {
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
  try {
    const { labId, courseId, batch, date, startTime, endTime } = req.body;
    const teacherId = req.user.id;

    if (!labId || !courseId) {
      return res.status(400).json({ success: false, message: 'Lab and Course selection are required.' });
    }

    const lab = db.prepare('SELECT * FROM labs WHERE lab_id = ?').get(labId);
    if (!lab) {
      return res.status(404).json({ success: false, message: 'Selected Lab does not exist.' });
    }

    // Stop any existing ACTIVE session for this lab
<<<<<<< HEAD
    const existingActive = db.prepare(`SELECT session_id FROM attendance_sessions WHERE lab_id = ? AND status = 'ACTIVE'`).all(labId);
    existingActive.forEach((s) => {
      db.prepare(`UPDATE attendance_sessions SET status = 'COMPLETED' WHERE session_id = ?`).run(s.session_id);
=======
    const existingActive = db.prepare('SELECT session_id FROM attendance_sessions WHERE lab_id = ? AND status = "ACTIVE"').all(labId);
    existingActive.forEach((s) => {
      db.prepare('UPDATE attendance_sessions SET status = "COMPLETED" WHERE session_id = ?').run(s.session_id);
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
      stopQrRotation(s.session_id);
    });

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const sessionId = `ILAB-${timestamp}`;
    const token = generateSecureToken();
    const code = generateRandomCode();
<<<<<<< HEAD
    const expiresAt = new Date(Date.now() + 180 * 1000).toISOString();
    const istNow = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }); // format YYYY-MM-DD
    const currentDate = date || istNow.split(' ')[0];
=======
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
    const currentDate = date || new Date().toISOString().split('T')[0];
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
    const currentStartTime = startTime || '10:00 AM';
    const currentEndTime = endTime || '11:30 AM';

    db.prepare(`
      INSERT INTO attendance_sessions
      (session_id, lab_id, teacher_id, course_id, batch, date, start_time, end_time, current_token, current_code, token_expires_at, status, total_eligible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `).run(
      sessionId,
      labId,
      teacherId,
      courseId,
      batch || 'Batch A',
      currentDate,
      currentStartTime,
      currentEndTime,
      token,
      code,
      expiresAt,
      lab.capacity || 120
    );

    const io = req.app.get('io');
    startQrRotation(io, sessionId);

    const baseUrl = getAppBaseUrl();
    const qrScanUrl = `${baseUrl}/attendance/verify?session=${sessionId}&token=${token}`;
<<<<<<< HEAD
    const qrCode = await QRCode.toDataURL(qrScanUrl);
=======
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492

    res.json({
      success: true,
      message: 'Attendance Session Started Successfully',
<<<<<<< HEAD
      qrCode,
      qrUrl: qrScanUrl,
=======
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
      session: {
        sessionId,
        labId,
        labName: lab.lab_name,
        courseId,
        batch: batch || 'Batch A',
        date: currentDate,
        token,
        code,
        status: 'ACTIVE',
        appBaseUrl: baseUrl,
        qrScanUrl
      }
    });

  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ success: false, message: 'Failed to start attendance session.' });
  }
};

exports.stopSession = (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required.' });
    }

    db.prepare('UPDATE attendance_sessions SET status = "COMPLETED" WHERE session_id = ?').run(sessionId);
    stopQrRotation(sessionId);

    const io = req.app.get('io');
    io.to(sessionId).emit('session_stopped', { sessionId, message: 'Attendance session has ended.' });
    io.emit('global_session_update', null);

    res.json({ success: true, message: 'Session stopped successfully.' });

  } catch (err) {
    console.error('Stop session error:', err);
    res.status(500).json({ success: false, message: 'Failed to stop attendance session.' });
  }
};

<<<<<<< HEAD
exports.getCurrentActiveSession = async (req, res) => {
=======
exports.getCurrentActiveSession = (req, res) => {
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
  try {
    const session = db.prepare(`
      SELECT s.*, l.lab_name, l.location, c.course_name
      FROM attendance_sessions s
      JOIN labs l ON s.lab_id = l.lab_id
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.status = 'ACTIVE'
      ORDER BY s.created_at DESC
      LIMIT 1
    `).get();

    if (!session) {
      return res.json({ success: true, active: false, session: null });
    }

    const presentCount = db.prepare(`
      SELECT COUNT(*) as count FROM attendance WHERE session_id = ? AND status = 'PRESENT'
    `).get(session.session_id).count;

    const baseUrl = getAppBaseUrl();
    const qrScanUrl = `${baseUrl}/attendance/verify?session=${session.session_id}&token=${session.current_token}`;
<<<<<<< HEAD
    const qrCode = await QRCode.toDataURL(qrScanUrl);
=======
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492

    res.json({
      success: true,
      active: true,
<<<<<<< HEAD
      qrCode,
      qrUrl: qrScanUrl,
=======
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
      session: {
        sessionId: session.session_id,
        labId: session.lab_id,
        labName: session.lab_name,
        location: session.location,
        courseId: session.course_id,
        courseName: session.course_name || 'Advanced Lab',
        batch: session.batch,
        date: session.date,
        startTime: session.start_time,
        endTime: session.end_time,
        token: session.current_token,
        code: session.current_code,
        totalStudents: session.total_eligible || 120,
        presentCount,
        expiresAt: session.token_expires_at,
        appBaseUrl: baseUrl,
        qrScanUrl
      }
    });

  } catch (err) {
    console.error('Get active session error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving active session.' });
  }
};
