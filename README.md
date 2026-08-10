# IDEALAB SMART ATTENDANCE

Tagline: **"Scan • Verify • Attend"**

A complete production-ready full-stack university laboratory attendance system featuring a dark futuristic laboratory design system, dynamic Lab PC QR code display screen, mobile student camera scanning, real-time WebSocket attendance tracking, project management, and report exporting.

---

## Important Core Workflow

1. **LAB PC GENERATES & DISPLAYS THE QR CODE** on the `/lab-display` projector screen.
2. Students do **NOT** generate QR codes.
3. Students open their authenticated **Student Profile** on their mobile phone, tap **SCAN LAB QR CODE**, scan the QR code displayed on the lab PC screen, and attendance is verified and marked instantly.
4. **Real-time WebSockets (Socket.IO)** update the live present count on the Lab PC screen (`87 → 88`) and the Teacher Live Attendance Table without page reloads.

---

## User Roles & Quick Credentials

| Role | Login Identifier | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| **Student** | `23CSE1045` or `student1@idealab.com` | `student123` | Profile, Mobile Camera QR Scanner, Attendance History, Projects, Apply for Project |
| **Faculty / Teacher** | `teacher@idealab.com` or `FAC-101` | `teacher123` | Start Session, Live Feed, Student Directory, Project Approval, Export Reports (Excel/CSV/PDF) |
| **System Admin** | `admin@idealab.com` | `admin123` | Manage Students, Faculty, Labs, Courses, Projects, System Settings |

---

## Technology Stack

- **Frontend**: React (Vite) + React Router v6 + Lucide Icons + Custom Glassmorphic Dark Lab CSS + Socket.IO Client + HTML5 QrScanner + Recharts + jsPDF + XLSX.
- **Backend**: Node.js + Express + Socket.IO + SQLite (`better-sqlite3`) + JWT + bcryptjs + CORS.
- **Database**: File-backed SQLite (`backend/data/idealab.db`) with automatic schema initialization and realistic university seed data.

---

## How to Run Locally

### 1. Start Backend Server
```bash
cd backend
npm install
node server.js
```
*Backend runs on `http://localhost:5000`.*

### 2. Start Frontend App
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## Key URLs

- **Public Login**: `http://localhost:5173/login`
- **Lab PC Display Screen**: `http://localhost:5173/lab-display`
- **Student Dashboard**: `http://localhost:5173/student/dashboard`
- **Student Scanner**: `http://localhost:5173/student/scan`
- **Teacher Dashboard**: `http://localhost:5173/teacher/dashboard`
- **Teacher Live Attendance**: `http://localhost:5173/teacher/live-attendance`
- **Admin Dashboard**: `http://localhost:5173/admin/dashboard`

---

## Security & Anti-Fraud Controls

- **Short-Lived QR Tokens**: Lab PC rotates tokens every 60 seconds. Old tokens expire immediately.
- **Unique Scan Constraint**: Database enforces `(session_id, student_id)` uniqueness to prevent duplicate scans.
- **Server-Side Validation**: All QR tokens, session states, and student credentials are verified strictly on the backend.
