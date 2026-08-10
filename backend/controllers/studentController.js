const db = require('../config/database');

exports.getDashboard = (req, res) => {
  try {
    const userId = req.user.id;
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Attendance stats
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM attendance_sessions').get().count || 1;
    const studentAttendance = db.prepare(`
      SELECT a.*, s.date, s.start_time, s.session_id, l.lab_name, c.course_name
      FROM attendance a
      JOIN attendance_sessions s ON a.session_id = s.session_id
      JOIN labs l ON s.lab_id = l.lab_id
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE a.student_id = ?
    `).all(student.student_id);

    const presentCount = studentAttendance.filter(a => a.status === 'PRESENT').length;
    const absentCount = Math.max(0, totalSessions - presentCount);
    const percentage = Math.round((presentCount / (totalSessions || 1)) * 100);

    // Today's attendance status
    const todayStr = new Date().toISOString().split('T')[0];
    const activeSession = db.prepare(`
      SELECT s.*, l.lab_name, c.course_name
      FROM attendance_sessions s
      JOIN labs l ON s.lab_id = l.lab_id
      LEFT JOIN courses c ON s.course_id = c.course_id
      WHERE s.status = 'ACTIVE'
      ORDER BY s.created_at DESC LIMIT 1
    `).get();

    let todayStatus = 'NO_SESSION';
    if (activeSession) {
      const todayMarked = db.prepare('SELECT * FROM attendance WHERE session_id = ? AND student_id = ?').get(activeSession.session_id, student.student_id);
      todayStatus = todayMarked ? 'PRESENT' : 'NOT_MARKED';
    }

    // Projects assigned / requests
    const assignedProjects = db.prepare(`
      SELECT p.* FROM projects p
      JOIN project_members pm ON p.project_id = pm.project_id
      WHERE pm.student_id = ?
    `).all(student.student_id);

    const projectRequests = db.prepare('SELECT * FROM project_requests WHERE student_id = ? ORDER BY created_at DESC').all(student.student_id);

    // Unread notifications
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(userId);

    res.json({
      success: true,
      profile: student,
      stats: {
        totalSessions,
        present: presentCount,
        absent: absentCount,
        percentage
      },
      today: {
        status: todayStatus,
        activeSession: activeSession ? {
          sessionId: activeSession.session_id,
          labName: activeSession.lab_name,
          courseName: activeSession.course_name,
          batch: activeSession.batch,
          startTime: activeSession.start_time
        } : null
      },
      projects: assignedProjects,
      requests: projectRequests,
      notifications
    });

  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving student dashboard data.' });
  }
};

exports.getNotifications = (req, res) => {
  try {
    const userId = req.user.id;
    const list = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json({ success: true, notifications: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

// Student self-edit profile (limited fields only)
exports.updateProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { phone, email, profilePhoto } = req.body;

    // Only allow updating: phone, email, profile_photo
    // Cannot change: student_id, student_category, role, status, branch, department, year, semester
    const newPhone = phone !== undefined ? phone : student.phone;
    const newEmail = email ? email.trim().toLowerCase() : student.email;
    const newPhoto = profilePhoto !== undefined ? profilePhoto : student.profile_photo;

    // If email changed, check uniqueness
    if (newEmail !== student.email) {
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(newEmail, userId);
      if (existing) {
        return res.status(400).json({ success: false, message: 'This email is already in use by another account.' });
      }
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail, userId);
    }

    db.prepare('UPDATE students SET phone = ?, email = ?, profile_photo = ? WHERE id = ?').run(
      newPhone,
      newEmail,
      newPhoto,
      student.id
    );

    res.json({ success: true, message: 'Profile updated successfully.' });

  } catch (err) {
    console.error('Student profile update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};
