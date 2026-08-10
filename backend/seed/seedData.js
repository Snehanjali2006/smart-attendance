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

  // Students list
  const sampleStudents = [
    {
      email: 'student1@idealab.com',
      sic: '23CSE1045',
      name: 'Riya Gedam',
      branch: 'Computer Science',
      dept: 'CSE',
      year: '3rd Year',
      sem: 'Semester 5',
      phone: '+91 9876543210',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    {
      email: 'student2@idealab.com',
      sic: '23CSE1088',
      name: 'Sneha Anjali',
      branch: 'Computer Science',
      dept: 'CSE',
      year: '3rd Year',
      sem: 'Semester 5',
      phone: '+91 9876543211',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    {
      email: 'student3@idealab.com',
      sic: '23ECE1012',
      name: 'Aarav Sharma',
      branch: 'Electronics & Comm',
      dept: 'ECE',
      year: '3rd Year',
      sem: 'Semester 5',
      phone: '+91 9876543212',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      email: 'student4@idealab.com',
      sic: '23ME1005',
      name: 'Ananya Verma',
      branch: 'Mechanical Engg',
      dept: 'ME',
      year: '2nd Year',
      sem: 'Semester 3',
      phone: '+91 9876543213',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
    },
    {
      email: 'student5@idealab.com',
      sic: '23CSE1102',
      name: 'Vikram Patel',
      branch: 'Computer Science',
      dept: 'CSE',
      year: '3rd Year',
      sem: 'Semester 5',
      phone: '+91 9876543214',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    {
      email: 'student6@idealab.com',
      sic: '23CSE1115',
      name: 'Rohan Gupta',
      branch: 'Computer Science',
      dept: 'CSE',
      year: '3rd Year',
      sem: 'Semester 5',
      phone: '+91 9876543215',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    {
      email: 'student7@idealab.com',
      sic: '23ECE1025',
      name: 'Kavya Singh',
      branch: 'Electronics & Comm',
      dept: 'ECE',
      year: '3rd Year',
      sem: 'Semester 5',
      phone: '+91 9876543216',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
    },
    {
      email: 'student8@idealab.com',
      sic: '23CSE1140',
      name: 'Aditya Kumar',
      branch: 'Computer Science',
      dept: 'CSE',
      year: '3rd Year',
      sem: 'Semester 5',
      phone: '+91 9876543217',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
    }
  ];

  const studentUserIds = [];

  sampleStudents.forEach((st) => {
    const res = insertUser.run(st.email, passwordHash, 'STUDENT', st.name);
    insertStudent.run(res.lastInsertRowid, st.sic, st.name, st.email, st.branch, st.dept, st.year, st.sem, st.phone, st.photo);
    studentUserIds.push({ userId: res.lastInsertRowid, sic: st.sic, name: st.name });
  });

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

  // 4. Insert Active / Past Sessions & Attendance Records
  const insertSession = db.prepare(`
    INSERT OR REPLACE INTO attendance_sessions
    (session_id, lab_id, teacher_id, course_id, batch, date, start_time, end_time, current_token, current_code, status, total_eligible)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Active Session
  const activeSessionId = 'ILAB-20260808-101400';
  insertSession.run(
    activeSessionId,
    'LAB-01',
    teacherRes.lastInsertRowid,
    'CSE301',
    'Batch A',
    '2026-08-08',
    '10:00 AM',
    '11:30 AM',
    'INIT_TOKEN_88921',
    47,
    'ACTIVE',
    120
  );

  // Historical Session 1
  insertSession.run('ILAB-20260807-090000', 'LAB-01', teacherRes.lastInsertRowid, 'CSE301', 'Batch A', '2026-08-07', '09:00 AM', '10:30 AM', 'EXPIRED_1', 12, 'COMPLETED', 120);
  insertSession.run('ILAB-20260806-110000', 'LAB-01', teacherRes.lastInsertRowid, 'CSE301', 'Batch A', '2026-08-06', '11:00 AM', '12:30 PM', 'EXPIRED_2', 95, 'COMPLETED', 120);
  insertSession.run('ILAB-20260805-140000', 'LAB-02', teacherRes.lastInsertRowid, 'ECE202', 'Batch B', '2026-08-05', '02:00 PM', '03:30 PM', 'EXPIRED_3', 31, 'COMPLETED', 60);

  // Insert Attendance Records for Past & Active Sessions
  const insertAttendance = db.prepare(`
    INSERT OR IGNORE INTO attendance (session_id, student_id, timestamp, status, device_info, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Riya (student1) past attendance
  insertAttendance.run('ILAB-20260807-090000', '23CSE1045', '2026-08-07 09:05:12', 'PRESENT', 'Android Chrome Mobile', '192.168.1.45');
  insertAttendance.run('ILAB-20260806-110000', '23CSE1045', '2026-08-06 11:02:45', 'PRESENT', 'Android Chrome Mobile', '192.168.1.45');
  insertAttendance.run('ILAB-20260805-140000', '23CSE1045', '2026-08-05 14:10:00', 'PRESENT', 'Android Chrome Mobile', '192.168.1.45');

  // Sneha (student2) past attendance
  insertAttendance.run('ILAB-20260807-090000', '23CSE1088', '2026-08-07 09:06:10', 'PRESENT', 'iPhone Safari Mobile', '192.168.1.48');
  insertAttendance.run('ILAB-20260806-110000', '23CSE1088', '2026-08-06 11:04:18', 'PRESENT', 'iPhone Safari Mobile', '192.168.1.48');

  // Aarav (student3) low attendance
  insertAttendance.run('ILAB-20260807-090000', '23ECE1012', '2026-08-07 09:20:00', 'ABSENT', null, null);

  // Active Session initial present attendance (e.g. 87 pre-existing simulated attendees for demonstration!)
  insertAttendance.run(activeSessionId, '23CSE1088', '2026-08-08 10:02:11', 'PRESENT', 'iPhone Safari Mobile', '192.168.1.88');
  insertAttendance.run(activeSessionId, '23CSE1102', '2026-08-08 10:05:44', 'PRESENT', 'Android Chrome Mobile', '192.168.1.99');

  // 5. Insert Projects & Team Members
  const insertProject = db.prepare(`
    INSERT OR REPLACE INTO projects (project_id, project_name, description, faculty_id, faculty_name, status, start_date, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMember = db.prepare(`
    INSERT OR REPLACE INTO project_members (project_id, student_id, student_name)
    VALUES (?, ?, ?)
  `);

  insertProject.run(
    'PRJ-01',
    'AI Skin Disease Detection System',
    'Deep learning computer vision algorithm for automated dermatology diagnostics deployed on edge devices in IdeaLab.',
    teacherRes.lastInsertRowid,
    'Dr. Priyanshu Sharma',
    'In Progress',
    '2026-07-01',
    '2026-08-20'
  );
  insertMember.run('PRJ-01', '23CSE1045', 'Riya Gedam');
  insertMember.run('PRJ-01', '23CSE1102', 'Vikram Patel');
  insertMember.run('PRJ-01', '23CSE1115', 'Rohan Gupta');
  insertMember.run('PRJ-01', '23ECE1025', 'Kavya Singh');

  insertProject.run(
    'PRJ-02',
    'Smart IoT Crop Disease & Soil Monitoring',
    'ESP32 sensor array with LoRa mesh network and cloud dashboard for precision agriculture testing.',
    teacherRes.lastInsertRowid,
    'Dr. Priyanshu Sharma',
    'In Progress',
    '2026-07-15',
    '2026-09-10'
  );
  insertMember.run('PRJ-02', '23ECE1012', 'Aarav Sharma');
  insertMember.run('PRJ-02', '23ME1005', 'Ananya Verma');

  insertProject.run(
    'PRJ-03',
    'Autonomous Drone Navigation & Obstacle Avoidance',
    'ROS2 LiDAR based real-time mapping drone inside the IdeaLab indoor facility.',
    teacherRes.lastInsertRowid,
    'Dr. Priyanshu Sharma',
    'Planning',
    '2026-08-01',
    '2026-10-30'
  );

  // 6. Insert Sample Project Requests
  const insertRequest = db.prepare(`
    INSERT INTO project_requests (student_id, student_name, project_id, project_name, faculty_id, reason, problem_statement, expected_outcome, team_members, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRequest.run(
    '23CSE1088',
    'Sneha Anjali',
    'PRJ-02',
    'Smart IoT Crop Disease & Soil Monitoring',
    teacherRes.lastInsertRowid,
    'Interested in embedded sensors and cloud telemetry.',
    'Early detection of crop fungal infections via multispectral camera.',
    'Working prototype connected to IdeaLab dashboard.',
    'Sneha Anjali (23CSE1088), Riya Gedam (23CSE1045)',
    'Requesting permission to join the IoT Crop Disease team and use the IdeaLab PCB printer.',
    'PENDING'
  );

  // 7. Insert Sample Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, ?)
  `);
  studentUserIds.forEach((s) => {
    insertNotif.run(s.userId, 'Welcome to IdeaLab', 'Your smart attendance profile is active. Scan the PC display screen during lab sessions.', 'INFO');
    insertNotif.run(s.userId, 'Active Lab Session', 'Attendance session ILAB-20260808-101400 is active in IdeaLab Hall - 1.', 'ALERT');
  });

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
