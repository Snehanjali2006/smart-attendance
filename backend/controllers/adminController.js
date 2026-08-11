const bcrypt = require('bcryptjs');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const faceUtils = require('../utils/faceUtils');

// Helper to log administrative actions
function logAudit(adminUser, action, details) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      adminUser ? adminUser.id : null,
      adminUser ? adminUser.name : 'System Admin',
      adminUser ? adminUser.role : 'ADMIN',
      action,
      details
    );
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}

// Generate secure random temporary password
function generateTempPassword(prefix = 'ILAB') {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}@${randomNum}`;
}

// Admin Dashboard Stats
exports.getAdminDashboard = (req, res) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE status != 'DELETED'").get().count;
    const totalTeachers = db.prepare("SELECT COUNT(*) as count FROM teachers WHERE status != 'DELETED'").get().count;
    const totalLabs = db.prepare('SELECT COUNT(*) as count FROM labs').get().count;
    const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const activeSessions = db.prepare("SELECT COUNT(*) as count FROM attendance_sessions WHERE status = 'ACTIVE'").get().count;
    
    // SIC / SC category breakdown
    const sicCount = db.prepare("SELECT COUNT(*) as count FROM students WHERE status != 'DELETED' AND student_category = 'SIC'").get().count;
    const scCount = db.prepare("SELECT COUNT(*) as count FROM students WHERE status != 'DELETED' AND student_category = 'SC'").get().count;

    // Present Today
    const todayStr = new Date().toISOString().split('T')[0];
    const presentTodayRow = db.prepare(`
      SELECT COUNT(DISTINCT student_id) as count 
      FROM attendance 
      WHERE DATE(timestamp) = DATE('now') OR DATE(timestamp) = ?
    `).get(todayStr);
    const presentToday = presentTodayRow ? presentTodayRow.count : 0;

    const absentToday = Math.max(0, totalStudents - presentToday);

    const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10').all();
    const settings = db.prepare('SELECT * FROM settings').all();

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalLabs,
        totalProjects,
        activeSessions,
        presentToday,
        absentToday,
        sicCount,
        scCount
      },
      auditLogs,
      settings
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin stats.' });
  }
};

// GET Students with search and filters
exports.getStudents = (req, res) => {
  try {
    const { search, branch, year, status, category } = req.query;

    let query = `
      SELECT s.*, u.status as user_status, u.last_login, u.force_password_change
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (s.name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ? OR s.department LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (branch) {
      query += ` AND s.branch = ?`;
      params.push(branch);
    }
    if (year) {
      query += ` AND s.year = ?`;
      params.push(year);
    }
    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }
    if (category && category !== 'ALL') {
      query += ` AND s.student_category = ?`;
      params.push(category.toUpperCase());
    }

    query += ` ORDER BY s.id DESC`;

    const students = db.prepare(query).all(...params);
    res.json({ success: true, students });
  } catch (err) {
    console.error('Fetch students error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch students list.' });
  }
};

// CREATE Student
exports.createStudent = async (req, res) => {
  try {
    const {
      name,
      studentId,
      email,
      phone,
      branch,
      department,
      year,
      semester,
      division,
      academicYear,
      profilePhoto,
      status,
      studentCategory
    } = req.body;

    if (!name || !email || !studentId) {
      return res.status(400).json({ success: false, message: 'Name, Email, and SIC / Student ID are required.' });
    }

    let facePhotoUrl = null;
    let faceEmbedding = null;

    if (profilePhoto && profilePhoto.startsWith('data:image')) {
      try {
        const base64Data = profilePhoto.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        const faceData = await faceUtils.detectSingleFace(imageBuffer);
        faceEmbedding = JSON.stringify(faceData.embedding);

        const photoFileName = `${studentId.trim().toUpperCase()}_face_${Date.now()}.jpg`;
        const photoDir = path.join(__dirname, '..', 'public', 'uploads', 'face_registered');
        if (!fs.existsSync(photoDir)) {
          fs.mkdirSync(photoDir, { recursive: true });
        }
        
        const photoPath = path.join(photoDir, photoFileName);
        fs.writeFileSync(photoPath, imageBuffer);
        
        facePhotoUrl = `/uploads/face_registered/${photoFileName}`;
      } catch (err) {
        if (err.message === 'NO_FACE_DETECTED') {
          return res.status(400).json({ success: false, message: 'No face detected in the registered photo. Please ensure the student is looking at the camera.' });
        }
        if (err.message === 'MULTIPLE_FACES_DETECTED') {
          return res.status(400).json({ success: false, message: 'Multiple faces detected. Only the student should be in the frame.' });
        }
        console.error('Face processing error:', err);
        return res.status(400).json({ success: false, message: 'Failed to process the registered face photo.' });
      }
    }

    // Validate student category
    const category = (studentCategory || 'SIC').toUpperCase();
    if (!['SIC', 'SC'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Student category must be SIC or SC.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanStudentId = studentId.trim().toUpperCase();

    // Check duplicate
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this Email already exists.' });
    }

    const existingStudent = db.prepare('SELECT id FROM students WHERE LOWER(student_id) = ?').get(cleanStudentId.toLowerCase());
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'A student with this SIC / Student ID already exists.' });
    }

    // Auto-generate temporary password if not provided by admin
    const customPass = (req.body.password || '').trim();
    const tempPassword = customPass || generateTempPassword('ILAB');
    const passHash = bcrypt.hashSync(tempPassword, 10);
    const userStatus = status || 'ACTIVE';
    const forceChange = req.body.forcePasswordChange !== undefined ? (req.body.forcePasswordChange ? 1 : 0) : 1;

    // Insert user with force_password_change
    const userRes = db.prepare(`
      INSERT INTO users (email, password_hash, role, name, status, force_password_change)
      VALUES (?, ?, 'STUDENT', ?, ?, ?)
    `).run(cleanEmail, passHash, name, userStatus, forceChange);

    // Insert student profile with category
    db.prepare(`
      INSERT INTO students (
        user_id, student_id, name, email, student_category, branch, department, year, semester, division, academic_year, phone, profile_photo, face_photo, face_embedding, face_registered_at, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userRes.lastInsertRowid,
      cleanStudentId,
      name,
      cleanEmail,
      category,
      branch || 'Computer Science',
      department || 'CSE',
      year || '3rd Year',
      semester || 'Semester 5',
      division || 'A',
      academicYear || '2025-2026',
      phone || '',
      profilePhoto || '',
      facePhotoUrl,
      faceEmbedding,
      facePhotoUrl ? new Date().toISOString() : null,
      userStatus
    );

    logAudit(req.user, 'CREATE_STUDENT', `Created Student Account for ${name} (SIC: ${cleanStudentId})`);

    res.json({
      success: true,
      message: '✓ STUDENT ACCOUNT CREATED SUCCESSFULLY',
      credentials: {
        studentId: cleanStudentId,
        name,
        email: cleanEmail,
        temporaryPassword: tempPassword,
        role: 'STUDENT',
        forcePasswordChange: !!forceChange
      }
    });

  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({
      success: false,
      message: err.message.includes('UNIQUE') ? 'Email or Student ID already exists.' : 'Failed to create student account.'
    });
  }
};

// UPDATE Student
exports.updateStudent = (req, res) => {
  try {
    const studentId = req.params.id;
    const { name, email, phone, branch, department, year, semester, division, academicYear, status, studentCategory } = req.body;

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Validate category if provided
    const category = studentCategory ? studentCategory.toUpperCase() : student.student_category;
    if (category && !['SIC', 'SC'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Student category must be SIC or SC.' });
    }

    const userStatus = status || 'ACTIVE';

    db.prepare(`
      UPDATE students 
      SET name = ?, email = ?, phone = ?, branch = ?, department = ?, year = ?, semester = ?, division = ?, academic_year = ?, student_category = ?, status = ?
      WHERE id = ?
    `).run(
      name || student.name,
      email || student.email,
      phone !== undefined ? phone : student.phone,
      branch || student.branch,
      department || student.department,
      year || student.year,
      semester || student.semester,
      division || student.division,
      academicYear || student.academic_year,
      category || 'SIC',
      userStatus,
      studentId
    );

    db.prepare('UPDATE users SET name = ?, email = ?, status = ? WHERE id = ?').run(
      name || student.name,
      email || student.email,
      userStatus,
      student.user_id
    );

    logAudit(req.user, 'UPDATE_STUDENT', `Updated Student Profile for ${student.name} (${student.student_id})`);

    res.json({ success: true, message: 'Student profile updated successfully.' });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ success: false, message: 'Failed to update student profile.' });
  }
};

// RESET Student Password
exports.resetStudentPassword = (req, res) => {
  try {
    const studentDbId = req.params.id;
    const { password, customPassword, forcePasswordChange } = req.body || {};
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentDbId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const customPass = (password || customPassword || '').trim();
    const tempPassword = customPass || generateTempPassword('ILAB');
    const passHash = bcrypt.hashSync(tempPassword, 10);
    const forceChange = forcePasswordChange !== undefined ? (forcePasswordChange ? 1 : 0) : 1;

    db.prepare('UPDATE users SET password_hash = ?, force_password_change = ? WHERE id = ?').run(passHash, forceChange, student.user_id);

    logAudit(req.user, 'RESET_STUDENT_PASSWORD', `Reset password for Student ${student.name} (${student.student_id})`);

    res.json({
      success: true,
      message: '✓ Password set successfully.',
      credentials: {
        studentId: student.student_id,
        name: student.name,
        email: student.email,
        temporaryPassword: tempPassword,
        role: 'STUDENT',
        forcePasswordChange: !!forceChange
      }
    });

  } catch (err) {
    console.error('Reset student password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

// CHANGE Student Password (PUT /api/admin/students/:id/password)
exports.changeStudentPassword = (req, res) => {
  try {
    const studentDbId = req.params.id;
    const { newPassword, password, forcePasswordChange } = req.body || {};
    const targetPass = (newPassword || password || '').trim();

    if (!targetPass) {
      return res.status(400).json({ success: false, message: 'New password is required.' });
    }

    if (targetPass.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentDbId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const passHash = bcrypt.hashSync(targetPass, 10);
    const forceChange = forcePasswordChange !== undefined ? (forcePasswordChange ? 1 : 0) : 1;

    db.prepare('UPDATE users SET password_hash = ?, force_password_change = ? WHERE id = ?').run(
      passHash,
      forceChange,
      student.user_id
    );

    logAudit(req.user, 'ADMIN_CHANGE_STUDENT_PASSWORD', `Admin changed password for Student ${student.name} (${student.student_id})`);

    res.json({
      success: true,
      message: '✓ Password changed successfully in database.',
      credentials: {
        studentId: student.student_id,
        name: student.name,
        email: student.email,
        temporaryPassword: targetPass,
        role: 'STUDENT',
        forcePasswordChange: !!forceChange
      }
    });

  } catch (err) {
    console.error('Change student password error:', err);
    res.status(500).json({ success: false, message: 'Failed to change student password.' });
  }
};

// UPDATE Student Status (Deactivate / Reactivate / Suspend)
exports.updateStudentStatus = (req, res) => {
  try {
    const studentDbId = req.params.id;
    const { status } = req.body; // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentDbId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, student.user_id);
    db.prepare('UPDATE students SET status = ? WHERE id = ?').run(status, studentDbId);

    logAudit(req.user, 'CHANGE_STUDENT_STATUS', `Changed status of Student ${student.student_id} to ${status}`);

    res.json({ success: true, message: `Student status updated to ${status}.` });

  } catch (err) {
    console.error('Update student status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update student status.' });
  }
};

// GET Teachers / Faculty list
exports.getTeachers = (req, res) => {
  try {
    const { search, department, status } = req.query;

    let query = `
      SELECT t.*, u.status as user_status, u.last_login, u.force_password_change
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (t.name LIKE ? OR t.faculty_id LIKE ? OR t.email LIKE ? OR t.department LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (department) {
      query += ` AND t.department = ?`;
      params.push(department);
    }
    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY t.id DESC`;

    const teachers = db.prepare(query).all(...params);
    res.json({ success: true, teachers });
  } catch (err) {
    console.error('Fetch teachers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch faculty list.' });
  }
};

// CREATE Faculty
exports.createTeacher = (req, res) => {
  try {
    const {
      name,
      facultyId,
      email,
      phone,
      department,
      designation,
      profilePhoto,
      assignedLabs,
      assignedSubjects,
      status
    } = req.body;

    if (!name || !email || !facultyId) {
      return res.status(400).json({ success: false, message: 'Name, Email, and Faculty ID are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFacultyId = facultyId.trim().toUpperCase();

    // Check duplicate
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this Email already exists.' });
    }

    const existingTeacher = db.prepare('SELECT id FROM teachers WHERE LOWER(faculty_id) = ?').get(cleanFacultyId.toLowerCase());
    if (existingTeacher) {
      return res.status(400).json({ success: false, message: 'A faculty member with this Faculty ID already exists.' });
    }

    // Auto-generate temporary password if not provided by admin
    const customPass = (req.body.password || '').trim();
    const tempPassword = customPass || generateTempPassword('FAC');
    const passHash = bcrypt.hashSync(tempPassword, 10);
    const userStatus = status || 'ACTIVE';
    const forceChange = req.body.forcePasswordChange !== undefined ? (req.body.forcePasswordChange ? 1 : 0) : 1;

    const userRes = db.prepare(`
      INSERT INTO users (email, password_hash, role, name, status, force_password_change)
      VALUES (?, ?, 'TEACHER', ?, ?, ?)
    `).run(cleanEmail, passHash, name, userStatus, forceChange);

    db.prepare(`
      INSERT INTO teachers (
        user_id, faculty_id, name, email, phone, department, designation, profile_photo, assigned_labs, assigned_subjects, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userRes.lastInsertRowid,
      cleanFacultyId,
      name,
      cleanEmail,
      phone || '',
      department || 'Computer Science & Engineering',
      designation || 'Assistant Professor',
      profilePhoto || '',
      assignedLabs || 'IdeaLab Hall - 1',
      assignedSubjects || 'Advanced AI & IoT',
      userStatus
    );

    logAudit(req.user, 'CREATE_FACULTY', `Created Faculty Account for ${name} (ID: ${cleanFacultyId})`);

    res.json({
      success: true,
      message: '✓ FACULTY ACCOUNT CREATED SUCCESSFULLY',
      credentials: {
        facultyId: cleanFacultyId,
        name,
        email: cleanEmail,
        temporaryPassword: tempPassword,
        role: 'FACULTY',
        forcePasswordChange: !!forceChange
      }
    });

  } catch (err) {
    console.error('Create teacher error:', err);
    res.status(500).json({
      success: false,
      message: err.message.includes('UNIQUE') ? 'Email or Faculty ID already exists.' : 'Failed to create faculty account.'
    });
  }
};

// UPDATE Faculty
exports.updateTeacher = (req, res) => {
  try {
    const teacherId = req.params.id;
    const { name, email, phone, department, designation, assignedLabs, assignedSubjects, status } = req.body;

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    const userStatus = status || 'ACTIVE';

    db.prepare(`
      UPDATE teachers 
      SET name = ?, email = ?, phone = ?, department = ?, designation = ?, assigned_labs = ?, assigned_subjects = ?, status = ?
      WHERE id = ?
    `).run(
      name || teacher.name,
      email || teacher.email,
      phone !== undefined ? phone : teacher.phone,
      department || teacher.department,
      designation || teacher.designation,
      assignedLabs || teacher.assigned_labs,
      assignedSubjects || teacher.assigned_subjects,
      userStatus,
      teacherId
    );

    db.prepare('UPDATE users SET name = ?, email = ?, status = ? WHERE id = ?').run(
      name || teacher.name,
      email || teacher.email,
      userStatus,
      teacher.user_id
    );

    logAudit(req.user, 'UPDATE_FACULTY', `Updated Faculty Profile for ${teacher.name} (${teacher.faculty_id})`);

    res.json({ success: true, message: 'Faculty profile updated successfully.' });
  } catch (err) {
    console.error('Update teacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to update faculty profile.' });
  }
};

// RESET Faculty Password
exports.resetTeacherPassword = (req, res) => {
  try {
    const teacherDbId = req.params.id;
    const { password, customPassword, forcePasswordChange } = req.body || {};
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherDbId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    const customPass = (password || customPassword || '').trim();
    const tempPassword = customPass || generateTempPassword('FAC');
    const passHash = bcrypt.hashSync(tempPassword, 10);
    const forceChange = forcePasswordChange !== undefined ? (forcePasswordChange ? 1 : 0) : 1;

    db.prepare('UPDATE users SET password_hash = ?, force_password_change = ? WHERE id = ?').run(passHash, forceChange, teacher.user_id);

    logAudit(req.user, 'RESET_FACULTY_PASSWORD', `Reset password for Faculty ${teacher.name} (${teacher.faculty_id})`);

    res.json({
      success: true,
      message: '✓ Password set successfully.',
      credentials: {
        facultyId: teacher.faculty_id,
        name: teacher.name,
        email: teacher.email,
        temporaryPassword: tempPassword,
        role: 'FACULTY',
        forcePasswordChange: !!forceChange
      }
    });

  } catch (err) {
    console.error('Reset teacher password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset faculty password.' });
  }
};

// CHANGE Faculty Password (PUT /api/admin/teachers/:id/password)
exports.changeTeacherPassword = (req, res) => {
  try {
    const teacherDbId = req.params.id;
    const { newPassword, password, forcePasswordChange } = req.body || {};
    const targetPass = (newPassword || password || '').trim();

    if (!targetPass) {
      return res.status(400).json({ success: false, message: 'New password is required.' });
    }

    if (targetPass.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherDbId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    const passHash = bcrypt.hashSync(targetPass, 10);
    const forceChange = forcePasswordChange !== undefined ? (forcePasswordChange ? 1 : 0) : 1;

    db.prepare('UPDATE users SET password_hash = ?, force_password_change = ? WHERE id = ?').run(
      passHash,
      forceChange,
      teacher.user_id
    );

    logAudit(req.user, 'ADMIN_CHANGE_FACULTY_PASSWORD', `Admin changed password for Faculty ${teacher.name} (${teacher.faculty_id})`);

    res.json({
      success: true,
      message: '✓ Faculty password changed successfully in database.',
      credentials: {
        facultyId: teacher.faculty_id,
        name: teacher.name,
        email: teacher.email,
        temporaryPassword: targetPass,
        role: 'FACULTY',
        forcePasswordChange: !!forceChange
      }
    });

  } catch (err) {
    console.error('Change teacher password error:', err);
    res.status(500).json({ success: false, message: 'Failed to change faculty password.' });
  }
};

// UPDATE Faculty Status
exports.updateTeacherStatus = (req, res) => {
  try {
    const teacherDbId = req.params.id;
    const { status } = req.body; // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherDbId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, teacher.user_id);
    db.prepare('UPDATE teachers SET status = ? WHERE id = ?').run(status, teacherDbId);

    logAudit(req.user, 'CHANGE_FACULTY_STATUS', `Changed status of Faculty ${teacher.faculty_id} to ${status}`);

    res.json({ success: true, message: `Faculty status updated to ${status}.` });

  } catch (err) {
    console.error('Update teacher status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update faculty status.' });
  }
};

// GET Labs
exports.getLabs = (req, res) => {
  try {
    const labs = db.prepare('SELECT * FROM labs ORDER BY lab_id ASC').all();
    res.json({ success: true, labs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch labs.' });
  }
};

// CREATE Lab
exports.createLab = (req, res) => {
  try {
    const { labId, labName, location, capacity } = req.body;
    if (!labId || !labName) {
      return res.status(400).json({ success: false, message: 'Lab ID and Lab Name are required.' });
    }

    db.prepare('INSERT INTO labs (lab_id, lab_name, location, capacity) VALUES (?, ?, ?, ?)').run(
      labId,
      labName,
      location || 'Block A',
      capacity || 120
    );

    logAudit(req.user, 'CREATE_LAB', `Created Lab ${labId}: ${labName}`);

    res.json({ success: true, message: 'Lab created successfully.' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message.includes('UNIQUE') ? 'Lab ID already exists.' : 'Failed to create lab.' });
  }
};

// GET System Audit Logs
exports.getAuditLogs = (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
};

// Save System Settings
exports.updateSettings = (req, res) => {
  try {
    const { qrExpirationSeconds, minAttendancePct, systemName, tagline } = req.body;

    if (qrExpirationSeconds) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES ("qr_expiration_seconds", ?)').run(String(qrExpirationSeconds));
    }
    if (minAttendancePct) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES ("min_attendance_pct", ?)').run(String(minAttendancePct));
    }
    if (systemName) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES ("system_name", ?)').run(String(systemName));
    }
    if (tagline) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES ("tagline", ?)').run(String(tagline));
    }
    if (req.body.idealabLatitude) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES ("IDEALAB_LATITUDE", ?)').run(String(req.body.idealabLatitude));
    }
    if (req.body.idealabLongitude) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES ("IDEALAB_LONGITUDE", ?)').run(String(req.body.idealabLongitude));
    }
    if (req.body.idealabAllowedRadius) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES ("IDEALAB_ALLOWED_RADIUS", ?)').run(String(req.body.idealabAllowedRadius));
    }

    logAudit(req.user, 'UPDATE_SETTINGS', 'Updated system settings');

    res.json({ success: true, message: 'System settings updated successfully.' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update system settings.' });
  }
};

// GET System Settings
exports.getSettings = (req, res) => {
  try {
    const settingsRows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
};

// DELETE Student (Admin)
exports.deleteStudent = (req, res) => {
  try {
    const studentDbId = req.params.id;
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentDbId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const userId = student.user_id;
    const studentId = student.student_id;

    const deleteAttendance = db.prepare('DELETE FROM attendance WHERE student_id = ?');
    const deleteNotifications = db.prepare('DELETE FROM notifications WHERE user_id = ?');
    const deleteProjectMembers = db.prepare('DELETE FROM project_members WHERE student_id = ?');
    const deleteProjectRequests = db.prepare('DELETE FROM project_requests WHERE student_id = ?');

    const transaction = db.transaction(() => {
      deleteAttendance.run(studentId);
      deleteNotifications.run(userId);
      deleteProjectMembers.run(studentId);
      deleteProjectRequests.run(studentId);
      // Deleting the user will cascade delete the student record due to foreign key.
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    transaction();

    logAudit(req.user, 'DELETE_STUDENT', `Deleted student ${student.name} (SIC: ${studentId})`);
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete student.' });
  }
};

// DELETE Teacher (Admin)
exports.deleteTeacher = (req, res) => {
  try {
    const teacherDbId = req.params.id;
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherDbId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Faculty not found.' });
    }

    const userId = teacher.user_id;
    const teacherId = teacher.id;

    const deleteProjects = db.prepare('DELETE FROM projects WHERE faculty_id = ?');
    const deleteNotifications = db.prepare('DELETE FROM notifications WHERE user_id = ?');

    const transaction = db.transaction(() => {
      deleteProjects.run(teacherId);
      deleteNotifications.run(userId);
      // Deleting the user will cascade delete the teacher record.
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    transaction();

    logAudit(req.user, 'DELETE_TEACHER', `Deleted faculty ${teacher.name} (ID: ${teacher.faculty_id})`);
    res.json({ success: true, message: 'Faculty deleted successfully.' });
  } catch (err) {
    console.error('Delete teacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete faculty.' });
  }
};

