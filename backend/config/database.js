const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'idealab.db');
const db = new Database(dbPath);

// Enable Foreign Keys & Write-Ahead Logging for performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      force_password_change INTEGER DEFAULT 0,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      student_category TEXT NOT NULL DEFAULT 'SIC',
      branch TEXT NOT NULL,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      semester TEXT NOT NULL,
      division TEXT DEFAULT 'A',
      academic_year TEXT DEFAULT '2025-2026',
      phone TEXT,
      profile_photo TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      faculty_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      department TEXT NOT NULL,
      designation TEXT DEFAULT 'Assistant Professor',
      profile_photo TEXT,
      assigned_labs TEXT,
      assigned_subjects TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS labs (
      lab_id TEXT PRIMARY KEY,
      lab_name TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity INTEGER DEFAULT 120,
      status TEXT DEFAULT 'ACTIVE'
    );

    CREATE TABLE IF NOT EXISTS courses (
      course_id TEXT PRIMARY KEY,
      course_name TEXT NOT NULL,
      department TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_sessions (
      session_id TEXT PRIMARY KEY,
      lab_id TEXT NOT NULL,
      teacher_id INTEGER NOT NULL,
      course_id TEXT NOT NULL,
      batch TEXT DEFAULT 'Batch A',
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      current_token TEXT,
      current_code INTEGER DEFAULT 47,
      token_expires_at DATETIME,
      status TEXT DEFAULT 'ACTIVE',
      total_eligible INTEGER DEFAULT 120,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lab_id) REFERENCES labs(lab_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'PRESENT',
      device_info TEXT,
      ip_address TEXT,
      UNIQUE(session_id, student_id),
      FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      project_id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      description TEXT,
      faculty_id INTEGER,
      faculty_name TEXT,
      status TEXT DEFAULT 'In Progress',
      start_date TEXT,
      deadline TEXT
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_requests (
      request_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      project_id TEXT,
      project_name TEXT NOT NULL,
      faculty_id INTEGER,
      reason TEXT,
      problem_statement TEXT,
      expected_outcome TEXT,
      team_members TEXT,
      message TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO',
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Settings initial seed
  db.exec(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('IDEALAB_LATITUDE', '20.960705');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('IDEALAB_LONGITUDE', '79.014667');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('IDEALAB_ALLOWED_RADIUS', '500');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('FACE_MATCH_THRESHOLD', '0.6');
  `);

  // Safe migrations for existing databases
  const addColumn = (table, colDef) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
    } catch (e) {
      // Column already exists or table doesn't exist
    }
  };

  addColumn('users', 'force_password_change INTEGER DEFAULT 0');
  addColumn('users', 'last_login DATETIME');
  addColumn('users', 'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');

  addColumn('students', 'student_category TEXT NOT NULL DEFAULT "SIC"');
  addColumn('students', 'division TEXT DEFAULT "A"');
  addColumn('students', 'academic_year TEXT DEFAULT "2025-2026"');
  addColumn('students', 'face_photo TEXT');
  addColumn('students', 'face_embedding TEXT');
  addColumn('students', 'face_registered_at DATETIME');

  addColumn('teachers', 'phone TEXT');
  addColumn('teachers', 'designation TEXT DEFAULT "Assistant Professor"');
  addColumn('teachers', 'profile_photo TEXT');
  addColumn('teachers', 'assigned_labs TEXT');
  addColumn('teachers', 'assigned_subjects TEXT');
  addColumn('teachers', 'status TEXT DEFAULT "ACTIVE"');
  addColumn('teachers', 'created_at DATETIME DEFAULT CURRENT_TIMESTAMP');

  addColumn('attendance', 'photo_url TEXT');
  addColumn('attendance', 'latitude REAL');
  addColumn('attendance', 'longitude REAL');
  addColumn('attendance', 'distance_from_lab REAL');
  addColumn('attendance', 'location_verified INTEGER DEFAULT 0');
  addColumn('attendance', 'captured_at DATETIME');
}

initDatabase();

module.exports = db;
