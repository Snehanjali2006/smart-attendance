const db = require('../config/database');

exports.verifyAndMarkAttendance = (req, res) => {
  try {
    const { sessionId, token, code, deviceInfo } = req.body;
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
<<<<<<< HEAD
          message: 'QR code has expired. Please scan the new QR code.'
=======
          message: 'This QR code is no longer valid. Please scan the new QR code displayed on the IdeaLab screen.'
>>>>>>> cf753f4ff6dbdee6aac03d8225071450ced49492
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

    // 5. Insert Attendance Record
    const entryTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const fullDateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    const serverTimestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO attendance (session_id, student_id, timestamp, status, device_info, ip_address)
      VALUES (?, ?, ?, 'PRESENT', ?, ?)
    `).run(
      sessionId,
      student.student_id,
      serverTimestamp,
      deviceInfo || req.headers['user-agent'] || 'Mobile Browser',
      req.ip || '127.0.0.1'
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
        presentCount
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
