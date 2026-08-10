const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide User ID / Email and Password.' });
    }

    // Check user by email or student_id/faculty_id
    let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(loginId);

    if (!user) {
      // Check if loginId is a Student SIC/ID
      const student = db.prepare('SELECT user_id FROM students WHERE LOWER(student_id) = LOWER(?)').get(loginId);
      if (student) {
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(student.user_id);
      }
    }

    if (!user) {
      // Check if loginId is a Teacher/Faculty ID
      const teacher = db.prepare('SELECT user_id FROM teachers WHERE LOWER(faculty_id) = LOWER(?)').get(loginId);
      if (teacher) {
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(teacher.user_id);
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User profile not found.' });
    }

    // Check Account Status
    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Access denied. Please contact IdeaLab Administrator.`
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    // Update last_login timestamp
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Fetch role details
    let profileData = {};
    if (user.role === 'STUDENT') {
      profileData = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id) || {};
    } else if (user.role === 'TEACHER') {
      profileData = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(user.id) || {};
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      studentId: profileData.student_id || null,
      facultyId: profileData.faculty_id || null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status || 'ACTIVE',
        force_password_change: !!user.force_password_change,
        profile: profileData
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

// Student-specific login with category validation
exports.studentLogin = (req, res) => {
  try {
    const { identifier, email, password, studentCategory } = req.body;
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Student ID / Email and Password.' });
    }

    if (!studentCategory || !['SIC', 'SC'].includes(studentCategory.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Please select a valid student category (SIC or SC).' });
    }

    // Check user by email or student_id
    let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(loginId);
    let student = null;

    if (!user) {
      student = db.prepare('SELECT * FROM students WHERE LOWER(student_id) = LOWER(?)').get(loginId);
      if (student) {
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(student.user_id);
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Student profile not found.' });
    }

    if (user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'This login is for students only. Faculty/Admin should use the main login.' });
    }

    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Access denied. Please contact IdeaLab Administrator.`
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    if (!student) {
      student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found in database.' });
    }

    // Validate category matches
    const storedCategory = (student.student_category || 'SIC').toUpperCase();
    if (studentCategory.toUpperCase() !== storedCategory) {
      return res.status(403).json({
        success: false,
        message: `Category mismatch. Your account is registered under ${storedCategory === 'SIC' ? 'Student Innovation Council (SIC)' : 'Student Chapter (SC)'}. Please select the correct category.`
      });
    }

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      studentId: student.student_id,
      studentCategory: storedCategory,
      facultyId: null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status || 'ACTIVE',
        force_password_change: !!user.force_password_change,
        profile: student
      }
    });

  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during student login.' });
  }
};

exports.getMe = (req, res) => {

  try {
    const user = db.prepare('SELECT id, email, role, name, status, force_password_change, last_login, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: `Account is ${user.status}. Access denied.` });
    }

    let profileData = {};
    if (user.role === 'STUDENT') {
      profileData = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id) || {};
    } else if (user.role === 'TEACHER') {
      profileData = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(user.id) || {};
    }

    res.json({
      success: true,
      user: {
        ...user,
        force_password_change: !!user.force_password_change,
        profile: profileData
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

exports.changePassword = (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, force_password_change = 0 WHERE id = ?').run(newHash, userId);

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, user_name, user_role, action, details) VALUES (?, ?, ?, ?, ?)').run(
      user.id,
      user.name,
      user.role,
      'USER_PASSWORD_CHANGED',
      `User ${user.email} changed temporary password successfully.`
    );

    res.json({ success: true, message: 'Password updated successfully. You now have full access.' });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};
