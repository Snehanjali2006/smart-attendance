const db = require('../config/database');

exports.getTeacherDashboard = (req, res) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'ACTIVE'").get().count;

    const activeSession = db.prepare(`
      SELECT s.*, l.lab_name, c.course_name
      FROM attendance_sessions s
      JOIN labs l ON s.lab_id = l.lab_id
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.status = 'ACTIVE'
      ORDER BY s.created_at DESC LIMIT 1
    `).get();

    let presentToday = 0;
    if (activeSession) {
      presentToday = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE session_id = ? AND status = 'PRESENT'").get(activeSession.session_id).count;
    } else {
      // Latest session count
      const latestSession = db.prepare('SELECT session_id FROM attendance_sessions ORDER BY created_at DESC LIMIT 1').get();
      if (latestSession) {
        presentToday = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE session_id = ? AND status = 'PRESENT'").get(latestSession.session_id).count;
      }
    }

    const absentToday = Math.max(0, totalStudents - presentToday);
    const attendancePct = totalStudents > 0 ? ((presentToday / totalStudents) * 100).toFixed(2) : '0.00';

    // Fetch Low Attendance Students (< 75%)
    const minPctSetting = db.prepare("SELECT value FROM settings WHERE key = 'min_attendance_pct'").get();
    const threshold = minPctSetting ? parseInt(minPctSetting.value, 10) : 75;

    const allStudents = db.prepare("SELECT * FROM students WHERE status = 'ACTIVE'").all();
    const totalSessionsCount = db.prepare('SELECT COUNT(*) as count FROM attendance_sessions').get().count || 1;

    const lowAttendanceList = [];
    allStudents.forEach((st) => {
      const pCount = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'PRESENT'").get(st.student_id).count;
      const pct = Math.round((pCount / totalSessionsCount) * 100);
      if (pct < threshold) {
        lowAttendanceList.push({
          studentId: st.student_id,
          name: st.name,
          branch: st.branch,
          year: st.year,
          attendancePct: pct
        });
      }
    });

    res.json({
      success: true,
      stats: {
        totalStudents,
        presentToday,
        absentToday,
        attendancePercentage: attendancePct,
        activeSession: activeSession ? {
          sessionId: activeSession.session_id,
          labName: activeSession.lab_name,
          courseName: activeSession.course_name,
          startTime: activeSession.start_time
        } : null
      },
      lowAttendanceAlerts: lowAttendanceList
    });

  } catch (err) {
    console.error('Teacher dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve teacher dashboard analytics.' });
  }
};

exports.getLiveAttendance = (req, res) => {
  try {
    const activeSession = db.prepare(`
      SELECT s.*, l.lab_name, c.course_name
      FROM attendance_sessions s
      JOIN labs l ON s.lab_id = l.lab_id
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.status = 'ACTIVE'
      ORDER BY s.created_at DESC LIMIT 1
    `).get();

    const targetSessionId = req.query.sessionId || (activeSession ? activeSession.session_id : null);

    if (!targetSessionId) {
      return res.json({
        success: true,
        session: null,
        attendanceList: []
      });
    }

    const sessionInfo = db.prepare(`
      SELECT s.*, l.lab_name, c.course_name
      FROM attendance_sessions s
      JOIN labs l ON s.lab_id = l.lab_id
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.session_id = ?
    `).get(targetSessionId);

    const records = db.prepare(`
      SELECT a.attendance_id, a.timestamp, a.status, s.name, s.student_id, s.branch, s.year, s.department, s.student_category
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      WHERE a.session_id = ?
      ORDER BY a.timestamp DESC
    `).all(targetSessionId);

    const formattedList = records.map((r, idx) => {
      const t = new Date(r.timestamp);
      const timeStr = isNaN(t.getTime()) ? '10:14:37 AM' : t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      return {
        id: idx + 1,
        name: r.name,
        sic: r.student_id,
        branch: r.branch,
        year: r.year,
        department: r.department,
        studentCategory: r.student_category || 'SIC',
        chapter: r.student_category === 'SC' ? 'Student Chapter' : 'Student Innovation Council',
        entryTime: timeStr,
        status: r.status
      };
    });

    res.json({
      success: true,
      session: sessionInfo,
      attendanceList: formattedList
    });

  } catch (err) {
    console.error('Live attendance error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve live attendance table.' });
  }
};

exports.getStudentsList = (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students ORDER BY name ASC').all();
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM attendance_sessions').get().count || 1;

    const listWithStats = students.map((st) => {
      const pCount = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'PRESENT'").get(st.student_id).count;
      const pct = Math.round((pCount / totalSessions) * 100);
      return {
        ...st,
        presentCount: pCount,
        absentCount: Math.max(0, totalSessions - pCount),
        attendancePct: pct
      };
    });

    res.json({ success: true, students: listWithStats });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve student directory.' });
  }
};
