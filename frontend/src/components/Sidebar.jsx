import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Users,
  FolderGit2,
  FileSpreadsheet,
  FileBarChart,
  Settings,
  ShieldCheck,
  QrCode,
  Bell,
  UserCheck,
  FolderKanban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const studentLinks = [
    { to: '/student/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/student/scan', label: 'Scan Lab QR', icon: QrCode },
    { to: '/student/attendance', label: 'Attendance History', icon: UserCheck },
    { to: '/student/projects', label: 'Projects & Requests', icon: FolderKanban },
    { to: '/student/notifications', label: 'Notifications', icon: Bell }
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/live-attendance', label: 'Live Attendance', icon: Radio },
    { to: '/teacher/students', label: 'Students', icon: Users },
    { to: '/teacher/projects', label: 'Projects', icon: FolderGit2 },
    { to: '/teacher/attendance', label: 'Attendance Records', icon: FileSpreadsheet },
    { to: '/teacher/reports', label: 'Reports & Export', icon: FileBarChart },
    { to: '/teacher/settings', label: 'Settings', icon: Settings }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: ShieldCheck },
    { to: '/admin/students', label: 'Manage Students', icon: Users },
    { to: '/admin/teachers', label: 'Manage Teachers', icon: Users },
    { to: '/admin/labs', label: 'Manage Labs', icon: LayoutDashboard },
    { to: '/admin/projects', label: 'Manage Projects', icon: FolderGit2 },
    { to: '/admin/settings', label: 'System Settings', icon: Settings }
  ];

  let links = teacherLinks;
  if (role === 'STUDENT') links = studentLinks;
  if (role === 'ADMIN') links = adminLinks;

  return (
    <aside className="w-64 glass-card border-r-0 rounded-none h-[calc(100vh-61px)] sticky top-[61px] hidden lg:flex flex-col p-4 z-30">
      <div className="mb-6 px-3 py-2 rounded-xl bg-violet-950/40 border border-violet-500/20">
        <span className="text-[10px] text-violet-400 font-mono tracking-wider uppercase block">LOGGED IN AS</span>
        <p className="text-sm font-bold text-white truncate">{user.name}</p>
        <span className="text-xs text-indigo-300 capitalize">{role.toLowerCase()} Access</span>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-violet-400/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-white/10 text-center">
        <p className="text-[10px] text-gray-500 font-mono">
          IDEALAB SMART ATTENDANCE v1.0
        </p>
      </div>
    </aside>
  );
}
