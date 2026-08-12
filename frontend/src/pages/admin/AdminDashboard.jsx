import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Users,
  GraduationCap,
  Building2,
  Activity,
  UserCheck,
  UserX,
  History,
  ShieldCheck,
  PlusCircle,
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/dashboard');
    if (res.success) {
      setData(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data?.stats || {
    totalStudents: 120,
    totalTeachers: 15,
    totalLabs: 4,
    activeSessions: 2,
    presentToday: 87,
    absentToday: 33
  };

  const attendanceTrend = data?.chartData?.attendanceTrend || [];
  const departmentDistribution = data?.chartData?.departmentDistribution || [];

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> System Administration Control Panel
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Admin Overview Dashboard
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Manage institutional users, faculty labs, attendance security, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/students"
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg shadow-violet-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Student Account</span>
          </Link>

          <Link
            to="/admin/teachers"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Faculty Account</span>
          </Link>
        </div>
      </div>

      {/* 6 Metric Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Students */}
        <div className="glass-card p-5 border-violet-500/30 neon-border-purple relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">STUDENTS</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white font-mono">
            {stats.totalStudents}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
            <span className="text-violet-300 font-bold bg-violet-500/20 px-1.5 py-0.5 rounded">
              SIC: {stats.sicCount || 0}
            </span>
            <span className="text-indigo-300 font-bold bg-indigo-500/20 px-1.5 py-0.5 rounded">
              SC: {stats.scCount || 0}
            </span>
          </div>
        </div>

        {/* Total Faculty */}
        <div className="glass-card p-5 border-indigo-500/30 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">FACULTY</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white font-mono">
            {stats.totalTeachers}
          </div>
          <span className="text-[10px] text-indigo-300 font-mono mt-1 block">Instructors & Staff</span>
        </div>

        {/* Total Labs */}
        <div className="glass-card p-5 border-cyan-500/30 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">LABS</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white font-mono">
            {stats.totalLabs}
          </div>
          <span className="text-[10px] text-cyan-300 font-mono mt-1 block">IdeaLab Facilities</span>
        </div>

        {/* Active Sessions */}
        <div className="glass-card p-5 border-amber-500/30 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">ACTIVE SESSIONS</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center animate-pulse">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white font-mono">
            {stats.activeSessions}
          </div>
          <span className="text-[10px] text-amber-300 font-mono mt-1 block">Live QR Displaying</span>
        </div>

        {/* Present Today */}
        <div className="glass-card p-5 border-emerald-500/30 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">PRESENT TODAY</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono">
            {stats.presentToday}
          </div>
          <span className="text-[10px] text-emerald-300 font-mono mt-1 block">Verified Scans</span>
        </div>

        {/* Absent Today */}
        <div className="glass-card p-5 border-rose-500/30 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">ABSENT TODAY</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-rose-400 font-mono">
            {stats.absentToday}
          </div>
          <span className="text-[10px] text-rose-300 font-mono mt-1 block">Unverified Students</span>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Area Chart */}
        <div className="glass-card p-6 border-white/10 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Attendance Trend (Last 7 Days)</h3>
          </div>
          <div className="h-[250px] w-full">
            {attendanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#22d3ee' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCount)" name="Present Students" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                No attendance data available for the last 7 days.
              </div>
            )}
          </div>
        </div>

        {/* Department Distribution Pie Chart */}
        <div className="glass-card p-6 border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-bold text-white">Student Distribution</h3>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center">
            {departmentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 font-mono text-xs text-center">
                No student data available.
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {departmentDistribution.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-[10px] font-mono text-gray-300 uppercase">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/admin/students" className="glass-card p-6 border-white/10 hover:border-violet-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-violet-600/20 text-violet-400 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Manage Student Accounts</h3>
          <p className="text-xs text-gray-400 font-mono">
            Create new students, generate temporary credentials, reset passwords, and set statuses.
          </p>
        </Link>

        <Link to="/admin/teachers" className="glass-card p-6 border-white/10 hover:border-indigo-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Manage Faculty Accounts</h3>
          <p className="text-xs text-gray-400 font-mono">
            Register faculty members, assign lab rooms, configure designations, and print credential cards.
          </p>
        </Link>

        <Link to="/admin/labs" className="glass-card p-6 border-white/10 hover:border-cyan-500/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-cyan-600/20 text-cyan-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Lab PC & Display Settings</h3>
          <p className="text-xs text-gray-400 font-mono">
            Configure IdeaLab display screens, capacity thresholds, and 60s dynamic QR security rules.
          </p>
        </Link>
      </div>

      {/* System Audit Logs */}
      <div className="glass-card p-6 border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">System Audit & Security Logs</h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">Live Institutional Activity Trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="pb-3">TIMESTAMP</th>
                <th className="pb-3">PERFORMED BY</th>
                <th className="pb-3">ACTION</th>
                <th className="pb-3">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.auditLogs && data.auditLogs.length > 0 ? (
                data.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-all">
                    <td className="py-3 text-gray-400">{log.timestamp}</td>
                    <td className="py-3">
                      <span className="font-bold text-violet-300">{log.user_name || 'Admin'}</span>
                      <span className="text-[10px] text-gray-500 block">{log.user_role}</span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-gray-300">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-gray-500">
                    No audit logs recorded yet. Action logs will appear here when accounts are created or modified.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
