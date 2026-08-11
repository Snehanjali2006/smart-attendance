const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { calculateDistance } = require('../utils/geoUtils');
const faceUtils = require('../utils/faceUtils');

exports.verifyAndMarkAttendance = async (req, res) => {
  try {
    const { sessionId, token, code, deviceInfo, latitude, longitude, photo } = req.body;
    const userId = req.user.id;

    // 1. Validate student profile
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId);
    if (!student) {
      return res.status(403).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        message: 'Only registered students can scan and mark attendance.'
      });
    }

    if (student.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        message: 'Your student account is currently inactive.'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_TOKEN',
        message: 'Invalid scan payload. Session ID missing.'
      });
    }

    // 2. Fetch session
    const session = db.prepare(`
      SELECT s.*, l.lab_name
      FROM attendance_sessions s
      JOIN labs l ON s.lab_id = l.lab_id
      WHERE s.session_id = ?
    `).get(sessionId);

    if (!session || session.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        errorCode: 'SESSION_INACTIVE',
        message: 'The attendance session is currently not active.'
      });
    }

    // 3. Check token validity
    if (!token || token !== session.current_token) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_TOKEN',
        message: 'The QR code you scanned is not valid or has been rotated.'
      });
    }

    // Check expiration time (60 second validity window)
    if (session.token_expires_at) {
      const expires = new Date(session.token_expires_at).getTime();
      const now = Date.now();
      if (now > expires) {
        return res.status(400).json({
          success: false,
          errorCode: 'EXPIRED_TOKEN',
          message: 'QR code has expired. Please scan the new QR code.'
        });
      }
    }

    // 3.5 Check Verification Code (Unique Lab Display Code e.g. 47)
    if (!code) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_CODE',
        message: 'Please enter the number currently displayed on the Lab PC screen.'
      });
    }

    if (Number(code) !== Number(session.current_code)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_CODE',
        message: 'The number you entered does not match the number currently displayed on the IdeaLab screen.'
      });
    }

    // 4. Check duplicate scan (UNIQUE constraint check)
    const existing = db.prepare('SELECT * FROM attendance WHERE session_id = ? AND student_id = ?').get(sessionId, student.student_id);
    if (existing) {
      return res.status(400).json({
        success: false,
        errorCode: 'ALREADY_MARKED',
        message: 'You have already marked your attendance for this session.',
        markedAt: existing.timestamp
      });
    }

    // 4.5 Geolocation and Geofence Verification
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        errorCode: 'LOCATION_REQUIRED',
        message: 'GPS location is required to mark attendance.'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const getSetting = (key, defaultVal) => {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
      return row ? row.value : defaultVal;
    };

    const labLat = parseFloat(getSetting('IDEALAB_LATITUDE', '20.998711'));
    const labLng = parseFloat(getSetting('IDEALAB_LONGITUDE', '79.553924'));
    const allowedRadius = parseFloat(getSetting('IDEALAB_ALLOWED_RADIUS', '500'));

    const distance = calculateDistance(lat, lng, labLat, labLng);

    if (distance > allowedRadius) {
      return res.status(400).json({
        success: false,
        errorCode: 'OUTSIDE_GEOFENCE',
        message: 'You are outside the IdeaLab attendance area.',
        distance,
        allowedRadius
      });
    }

    // 4.6 Process and Save Photo
    if (!photo || !photo.startsWith('data:image')) {
      return res.status(400).json({
        success: false,
        errorCode: 'PHOTO_REQUIRED',
        message: 'A live attendance photo is required.'
      });
    }

    if (!student.face_embedding) {
      return res.status(403).json({
        success: false,
        errorCode: 'FACE_NOT_REGISTERED',
        message: 'Your face is not registered in the system. Please contact the administrator.'
      });
    }

    const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Process Face Match
    try {
      const liveFaceData = await faceUtils.detectSingleFace(imageBuffer);
      const registeredEmbedding = JSON.parse(student.face_embedding);
      
      const distance = faceUtils.compareEmbeddings(registeredEmbedding, liveFaceData.embedding);
      const threshold = parseFloat(getSetting('FACE_MATCH_THRESHOLD', '0.6'));
      
      if (distance > threshold) {
        return res.status(400).json({
          success: false,
          errorCode: 'FACE_MISMATCH',
          message: 'The captured face does not match your registered profile.',
          distance
        });
      }
    } catch (err) {
      if (err.message === 'NO_FACE_DETECTED') {
        return res.status(400).json({ success: false, errorCode: 'NO_FACE_DETECTED', message: 'No face detected in the frame. Please look at the camera.' });
      }
      if (err.message === 'MULTIPLE_FACES_DETECTED') {
        return res.status(400).json({ success: false, errorCode: 'MULTIPLE_FACES_DETECTED', message: 'Multiple faces detected. Only you should be in the frame.' });
      }
      console.error('Face verification error:', err);
      return res.status(500).json({ success: false, message: 'Server error during face verification.' });
    }

    const photoFileName = `${student.student_id}_${sessionId}_${Date.now()}.jpg`;
    const photoDir = path.join(__dirname, '..', 'public', 'uploads', 'attendance');
    const photoPath = path.join(photoDir, photoFileName);
    
    // Ensure directory exists
    if (!fs.existsSync(photoDir)) {
      fs.mkdirSync(photoDir, { recursive: true });
    }
    
    fs.writeFileSync(photoPath, imageBuffer);
    const photoUrl = `/uploads/attendance/${photoFileName}`;

    // 5. Insert Attendance Record
    const entryTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const fullDateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    const serverTimestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO attendance (
        session_id, student_id, timestamp, status, device_info, ip_address, 
        photo_url, latitude, longitude, distance_from_lab, location_verified, captured_at
      )
      VALUES (?, ?, ?, 'PRESENT', ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      sessionId,
      student.student_id,
      serverTimestamp,
      deviceInfo || req.headers['user-agent'] || 'Mobile Browser',
      req.ip || '127.0.0.1',
      photoUrl,
      lat,
      lng,
      distance,
      serverTimestamp
    );

    // Get updated present count
    const presentCount = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE session_id = ? AND status = "PRESENT"').get(sessionId).count;

    // Real-Time Socket.IO Broadcast to Lab PC Display & Teacher Live Table
    const io = req.app.get('io');
    const attendancePayload = {
      sessionId,
      studentId: student.student_id,
      studentName: student.name,
      branch: student.branch,
      year: student.year,
      department: student.department,
      studentCategory: student.student_category || 'SIC',
      entryTime: entryTimeStr,
      status: 'PRESENT',
      presentCount,
      totalStudents: session.total_eligible || 120
    };

    io.to(sessionId).emit('attendance_marked', attendancePayload);
    io.emit('global_attendance_marked', attendancePayload);

    // Return Success Response formatted for Student Verification Screen
    res.json({
      success: true,
      message: '✓ Attendance Marked Successfully',
      record: {
        studentName: student.name,
        studentId: student.student_id,
        branch: student.branch,
        year: student.year,
        department: student.department,
        studentCategory: student.student_category || 'SIC',
        labName: session.lab_name,
        entryTime: entryTimeStr,
        date: fullDateStr,
        status: 'PRESENT',
        presentCount,
        distance,
        allowedRadius
      }
    });

  } catch (err) {
    console.error('Verify attendance error:', err);
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        errorCode: 'ALREADY_MARKED',
        message: 'You have already marked your attendance for this session.'
      });
    }
    res.status(500).json({ success: false, message: 'Server error while verifying attendance.' });
  }
};

exports.getStudentAttendanceHistory = (req, res) => {
  try {
    const userId = req.user.id;
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const history = db.prepare(`
      SELECT a.attendance_id, a.timestamp, a.status, s.date, s.start_time, s.session_id, l.lab_name, c.course_name
      FROM attendance a
      JOIN attendance_sessions s ON a.session_id = s.session_id
      JOIN labs l ON s.lab_id = l.lab_id
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE a.student_id = ?
      ORDER BY a.timestamp DESC
    `).all(student.student_id);

    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM attendance_sessions').get().count || 1;
    const presentCount = history.filter(h => h.status === 'PRESENT').length;
    const absentCount = Math.max(0, totalSessions - presentCount);
    const percentage = Math.round((presentCount / (totalSessions || 1)) * 100);

    res.json({
      success: true,
      stats: {
        totalSessions,
        present: presentCount,
        absent: absentCount,
        percentage
      },
      history
    });

  } catch (err) {
    console.error('Get student history error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve attendance history.' });
  }
};
