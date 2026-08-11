import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BackgroundParticles from './components/BackgroundParticles';
import PasswordChangeModal from './components/PasswordChangeModal';

// Pages
import Login from './pages/Login';
import LabDisplay from './pages/LabDisplay';
import AttendanceVerify from './pages/AttendanceVerify';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentScan from './pages/student/StudentScan';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentProjects from './pages/student/StudentProjects';
import StudentNotifications from './pages/student/StudentNotifications';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import LiveAttendance from './pages/teacher/LiveAttendance';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherProjects from './pages/teacher/TeacherProjects';
import AttendanceRecords from './pages/teacher/AttendanceRecords';
import Reports from './pages/teacher/Reports';
import TeacherSettings from './pages/teacher/TeacherSettings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminLabs from './pages/admin/AdminLabs';
import AdminProjects from './pages/admin/AdminProjects';
import AdminSettings from './pages/admin/AdminSettings';

function ProtectedLayout() {
  const { user, loading, clearForcePasswordChange } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-violet-300 font-mono text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col relative overflow-x-hidden">
      <BackgroundParticles />
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 z-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Force Password Change Modal on First Login */}
      {user.force_password_change && (
        <PasswordChangeModal
          user={user}
          onPasswordChanged={clearForcePasswordChange}
        />
      )}
    </div>
  );
}

function RoleGuard({ allowedRoles, fallbackPath }) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath || '/login'} replace />;
  }
  return <Outlet />;
}

function PublicOnlyGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  
  if (user && user.role === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Routes */}
            <Route path="/login" element={<Login defaultRole="STUDENT" />} />
            <Route path="/admin/login" element={<Login defaultRole="ADMIN" />} />
            <Route path="/faculty/login" element={<Login defaultRole="TEACHER" />} />
            <Route path="/student/login" element={<Login defaultRole="STUDENT" />} />

            {/* Standalone Lab PC Display Screen */}
            <Route element={<PublicOnlyGuard />}>
              <Route path="/lab-display" element={<LabDisplay />} />
            </Route>

            {/* Public/Mobile QR Verification Route */}
            <Route path="/attendance/verify" element={<AttendanceVerify />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Student Routes */}
              <Route element={<RoleGuard allowedRoles={['STUDENT']} fallbackPath="/login" />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<StudentDashboard />} />
                <Route path="/student/scan" element={<StudentScan />} />
                <Route path="/student/attendance" element={<StudentAttendance />} />
                <Route path="/student/projects" element={<StudentProjects />} />
                <Route path="/student/notifications" element={<StudentNotifications />} />
              </Route>

              {/* Teacher Routes */}
              <Route element={<RoleGuard allowedRoles={['TEACHER', 'ADMIN']} fallbackPath="/login" />}>
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="/teacher/live-attendance" element={<LiveAttendance />} />
                <Route path="/teacher/students" element={<TeacherStudents />} />
                <Route path="/teacher/projects" element={<TeacherProjects />} />
                <Route path="/teacher/attendance" element={<AttendanceRecords />} />
                <Route path="/teacher/reports" element={<Reports />} />
                <Route path="/teacher/export" element={<Reports />} />
                <Route path="/teacher/settings" element={<TeacherSettings />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<RoleGuard allowedRoles={['ADMIN']} fallbackPath="/login" />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/students" element={<AdminStudents />} />
                <Route path="/admin/teachers" element={<AdminTeachers />} />
                <Route path="/admin/labs" element={<AdminLabs />} />
                <Route path="/admin/projects" element={<AdminProjects />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
