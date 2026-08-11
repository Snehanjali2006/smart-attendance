const bcrypt = require('bcryptjs');
const db = require('../config/database');

function seedDatabase() {
  console.log('🌱 Checking and seeding database with initial production data...');

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  // We re-seed if users table is empty or missing expected admin
  const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@idealab.com');
  
  if (userCount > 0 && adminExists) {
    console.log('✅ Database already seeded with users.');
    return;
  }

  console.log('⚡ Populating fresh seed data...');

  const passwordHash = bcrypt.hashSync('student123', 10);
  const teacherHash = bcrypt.hashSync('teacher123', 10);
  const adminHash = bcrypt.hashSync('admin123', 10);

  // 1. Insert Users & Profiles
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, name, status)
    VALUES (?, ?, ?, ?, 'ACTIVE')
  `);

  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, student_id, name, email, branch, department, year, semester, phone, profile_photo, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);

  const insertTeacher = db.prepare(`
    INSERT INTO teachers (user_id, faculty_id, name, email, department)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Admin
  insertUser.run('admin@idealab.com', adminHash, 'ADMIN', 'System Administrator');

  // Teacher
  const teacherRes = insertUser.run('teacher@idealab.com', teacherHash, 'TEACHER', 'Dr. Priyanshu Sharma');
  insertTeacher.run(teacherRes.lastInsertRowid, 'FAC-101', 'Dr. Priyanshu Sharma', 'teacher@idealab.com', 'CSE & Robotics');


  // 2. Insert Labs
  const insertLab = db.prepare(`
    INSERT OR REPLACE INTO labs (lab_id, lab_name, location, capacity, status)
    VALUES (?, ?, ?, ?, 'ACTIVE')
  `);
  insertLab.run('LAB-01', 'IdeaLab Hall - 1', 'Block A - Floor 2', 120);
  insertLab.run('LAB-02', 'Embedded Systems & Robotics Lab', 'Block B - Floor 1', 60);

  // 3. Insert Courses
  const insertCourse = db.prepare(`
    INSERT OR REPLACE INTO courses (course_id, course_name, department)
    VALUES (?, ?, ?)
  `);
  insertCourse.run('CSE301', 'Advanced AI & IoT Systems', 'CSE');
  insertCourse.run('ECE202', 'Robotics & Microcontrollers', 'ECE');


  // 8. Insert Default Settings
  const insertSetting = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value)
    VALUES (?, ?)
  `);
  insertSetting.run('qr_expiration_seconds', '60');
  insertSetting.run('min_attendance_pct', '75');
  insertSetting.run('system_name', 'IDEALAB SMART ATTENDANCE');
  insertSetting.run('tagline', 'Scan • Verify • Attend');

  console.log('✅ Seed data successfully created!');
}

module.exports = seedDatabase;
