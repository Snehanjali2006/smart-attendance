import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { QrCode, UserCheck, FolderKanban, FileText, User, Sparkles, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const res = await apiRequest('/student/dashboard');
      if (res.success) {
        setData(res);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-violet-300 font-mono">
        Loading Student Profile...
      </div>
    );
  }

  const profile = data?.profile || {};
  const stats = data?.stats || { totalSessions: 100, present: 87, absent: 13, percentage: 87 };
  const today = data?.today || {};

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="glass-card p-6 border-violet-500/30 neon-border-purple text-center relative overflow-hidden">
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ACTIVE STUDENT
          </span>
        </div>

        <div className="relative inline-block mb-4">
          <img
            src={profile.profile_photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
            alt={profile.name || 'Student'}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-violet-500/50 shadow-xl shadow-violet-500/20 mx-auto"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">{profile.name || user?.name}</h2>
        <p className="text-xs font-mono text-violet-300 font-semibold mb-3">
          SIC: {profile.student_id || '23CSE1045'}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10 text-left">
          <div>
            <span className="text-[10px] text-gray-400 font-mono uppercase block">BRANCH</span>
            <span className="font-medium text-white">{profile.branch || 'Computer Science'}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-mono uppercase block">YEAR / SEM</span>
            <span className="font-medium text-white">{profile.year || '3rd Year'} • {profile.semester || 'Sem 5'}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-mono uppercase block">DEPARTMENT</span>
            <span className="font-medium text-white">{profile.department || 'CSE'}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-mono uppercase block">PHONE</span>
            <span className="font-medium text-white">{profile.phone || '+91 9876543210'}</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Attendance Stats Card */}
      <div className="glass-card p-6 border-indigo-500/20">
        <h3 className="text-xs font-mono tracking-widest text-violet-300 uppercase font-semibold mb-4">
          ATTENDANCE OVERVIEW
        </h3>

        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-300 font-mono uppercase block">PRESENT</span>
            <span className="text-2xl font-black font-mono text-emerald-400">{stats.present}</span>
          </div>

          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="text-[10px] text-red-300 font-mono uppercase block">ABSENT</span>
            <span className="text-2xl font-black font-mono text-red-400">{stats.absent}</span>
          </div>

          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <span className="text-[10px] text-violet-300 font-mono uppercase block">PERCENTAGE</span>
            <span className="text-2xl font-black font-mono text-violet-400">{stats.percentage}%</span>
          </div>
        </div>

        {/* Attendance Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono text-gray-300 mb-1">
            <span>Minimum Required: 75%</span>
            <span className={stats.percentage >= 75 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {stats.percentage >= 75 ? '✓ ON TRACK' : '⚠ LOW ATTENDANCE'}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                stats.percentage >= 75 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-amber-500 to-red-500'
              }`}
              style={{ width: `${Math.min(100, stats.percentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Session Banner */}
      <div className="glass-card p-5 border-cyan-500/20 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">TODAY'S LAB ATTENDANCE</span>
          <p className="text-sm font-bold text-white mt-0.5">
            {today.activeSession ? today.activeSession.labName : 'IdeaLab Hall - 1'}
          </p>
          <p className="text-xs text-gray-400 font-mono">
            {today.activeSession ? `${today.activeSession.courseName} (${today.activeSession.batch})` : 'Session Active'}
          </p>
        </div>

        <div className="text-right">
          {today.status === 'PRESENT' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              PRESENT TODAY
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              NOT MARKED YET
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/student/scan"
          className="col-span-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-center flex items-center justify-center gap-3 shadow-xl shadow-violet-600/30 hover:opacity-95 transition-all group"
        >
          <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-base tracking-wide font-mono">SCAN LAB QR CODE</span>
        </Link>

        <Link
          to="/student/attendance"
          className="p-4 rounded-xl glass-card hover:border-violet-500/40 flex flex-col items-center justify-center gap-2 text-center text-xs font-medium text-gray-200 transition-all"
        >
          <UserCheck className="w-5 h-5 text-indigo-400" />
          <span>ATTENDANCE HISTORY</span>
        </Link>

        <Link
          to="/student/projects"
          className="p-4 rounded-xl glass-card hover:border-violet-500/40 flex flex-col items-center justify-center gap-2 text-center text-xs font-medium text-gray-200 transition-all"
        >
          <FolderKanban className="w-5 h-5 text-violet-400" />
          <span>MY PROJECTS & APPLY</span>
        </Link>
      </div>
    </div>
  );
}
