import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Users, UserCheck, UserX, Percent, Radio, Play, Square, AlertTriangle, Monitor, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);

  const [sessionForm, setSessionForm] = useState({
    labId: 'LAB-01',
    courseId: 'CSE301',
    batch: 'Batch A',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:30 AM'
  });
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await apiRequest('/teacher/dashboard');
    if (res.success) {
      setData(res);
    }
    setLoading(false);
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setStarting(true);
    const res = await apiRequest('/sessions/start', 'POST', sessionForm);
    setStarting(false);
    if (res.success) {
      setShowStartModal(false);
      fetchDashboard();
    }
  };

  const handleStopSession = async (sessionId) => {
    const res = await apiRequest('/sessions/stop', 'POST', { sessionId });
    if (res.success) {
      fetchDashboard();
    }
  };

  const stats = data?.stats || {
    totalStudents: 120,
    presentToday: 87,
    absentToday: 33,
    attendancePercentage: '72.50',
    activeSession: null
  };

  const alerts = data?.lowAttendanceAlerts || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Faculty Dashboard</h1>
          <p className="text-xs text-gray-400 font-mono">Overview of IdeaLab attendance, live sessions, and low-attendance alerts</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/lab-display"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/30 text-xs font-bold text-violet-200 transition-all shadow-md"
          >
            <Monitor className="w-4 h-4 text-violet-400" />
            <span>OPEN LAB PC DISPLAY</span>
          </Link>

          {!stats.activeSession ? (
            <button
              onClick={() => setShowStartModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-xs font-bold font-mono shadow-lg shadow-emerald-600/30 hover:opacity-90 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>START ATTENDANCE SESSION</span>
            </button>
          ) : (
            <button
              onClick={() => handleStopSession(stats.activeSession.sessionId)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-500/40 text-white text-xs font-bold font-mono shadow-lg transition-all"
            >
              <Square className="w-4 h-4" />
              <span>STOP SESSION</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Session Alert Banner */}
      {stats.activeSession && (
        <div className="glass-card p-5 border-emerald-500/40 neon-border-purple flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest block font-bold">SESSION ACTIVE ON LAB PC</span>
              <h3 className="text-base font-bold text-white">
                {stats.activeSession.labName} • {stats.activeSession.courseName}
              </h3>
              <p className="text-xs text-gray-400 font-mono">SESSION ID: {stats.activeSession.sessionId}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/teacher/live-attendance"
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-mono font-bold shadow-md hover:bg-violet-500 transition-all flex items-center gap-1.5"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>VIEW LIVE FEED</span>
            </Link>
          </div>
        </div>
      )}

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div className="glass-card p-5 border-white/10 glass-card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-gray-400 uppercase">TOTAL STUDENTS</span>
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white">{stats.totalStudents}</div>
          <p className="text-[11px] text-gray-400 mt-1">Enrolled across all lab batches</p>
        </div>

        {/* Card 2: Present Today */}
        <div className="glass-card p-5 border-emerald-500/20 glass-card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-emerald-400 uppercase">PRESENT TODAY</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">{stats.presentToday}</div>
          <p className="text-[11px] text-emerald-300 mt-1 font-mono">Verified QR scans</p>
        </div>

        {/* Card 3: Absent Today */}
        <div className="glass-card p-5 border-red-500/20 glass-card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-red-400 uppercase">ABSENT TODAY</span>
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-red-400">{stats.absentToday}</div>
          <p className="text-[11px] text-red-300 mt-1 font-mono">Unmarked students</p>
        </div>

        {/* Card 4: Attendance Percentage */}
        <div className="glass-card p-5 border-indigo-500/20 glass-card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-indigo-400 uppercase">ATTENDANCE</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-indigo-300">{stats.attendancePercentage}%</div>
          <p className="text-[11px] text-gray-400 mt-1">Overall lab attendance rate</p>
        </div>
      </div>

      {/* Low Attendance Alert Panel (< 75%) */}
      <div className="glass-card p-6 border-amber-500/30">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">⚠ LOW ATTENDANCE ALERTS (&lt; 75%)</h3>
            <p className="text-xs text-gray-400 font-mono">Students below the mandatory 75% lab attendance threshold</p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400 font-mono">
            No students currently below 75% attendance threshold.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-gray-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Student Name</th>
                  <th className="px-4 py-2.5">SIC</th>
                  <th className="px-4 py-2.5">Branch</th>
                  <th className="px-4 py-2.5">Year</th>
                  <th className="px-4 py-2.5 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {alerts.map((st) => (
                  <tr key={st.studentId} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-semibold text-white">{st.name}</td>
                    <td className="px-4 py-3 font-mono text-violet-300">{st.studentId}</td>
                    <td className="px-4 py-3 text-gray-300">{st.branch}</td>
                    <td className="px-4 py-3 text-gray-300">{st.year}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                      {st.attendancePct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Start Session Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6 border-violet-500/40 relative">
            <h3 className="text-lg font-bold text-white mb-1">Start Attendance Session</h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">Configure session parameters for Lab PC dynamic QR code display</p>

            <form onSubmit={handleStartSession} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">LAB LOCATION</label>
                <select
                  value={sessionForm.labId}
                  onChange={(e) => setSessionForm({ ...sessionForm, labId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                >
                  <option value="LAB-01">IdeaLab Hall - 1 (Capacity 120)</option>
                  <option value="LAB-02">Embedded Systems & Robotics Lab (Capacity 60)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">COURSE / SUBJECT</label>
                <select
                  value={sessionForm.courseId}
                  onChange={(e) => setSessionForm({ ...sessionForm, courseId: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                >
                  <option value="CSE301">CSE301 - Advanced AI & IoT Systems</option>
                  <option value="ECE202">ECE202 - Robotics & Microcontrollers</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">BATCH</label>
                  <input
                    type="text"
                    value={sessionForm.batch}
                    onChange={(e) => setSessionForm({ ...sessionForm, batch: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">DATE</label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">START TIME</label>
                  <input
                    type="text"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">END TIME</label>
                  <input
                    type="text"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={starting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl text-xs font-bold font-mono shadow-md"
                >
                  {starting ? 'Starting...' : 'START SESSION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
