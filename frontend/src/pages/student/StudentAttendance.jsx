import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Calendar, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function StudentAttendance() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const res = await apiRequest('/attendance/history');
      if (res.success) {
        setHistory(res.history || []);
        setStats(res.stats || {});
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const filteredList = history.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Attendance History</h1>
          <p className="text-xs text-gray-400 font-mono">View past lab sessions and attendance status</p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-violet-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
          >
            <option value="ALL" className="bg-slate-900">All Statuses</option>
            <option value="PRESENT" className="bg-slate-900">Present</option>
            <option value="ABSENT" className="bg-slate-900">Absent</option>
            <option value="LATE" className="bg-slate-900">Late</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="glass-card p-4">
          <span className="text-[10px] text-gray-400 font-mono uppercase block">TOTAL SESSIONS</span>
          <span className="text-xl font-black font-mono text-white">{stats.totalSessions || 0}</span>
        </div>
        <div className="glass-card p-4 border-emerald-500/20">
          <span className="text-[10px] text-emerald-400 font-mono uppercase block">PRESENT</span>
          <span className="text-xl font-black font-mono text-emerald-400">{stats.present || 0}</span>
        </div>
        <div className="glass-card p-4 border-red-500/20">
          <span className="text-[10px] text-red-400 font-mono uppercase block">ABSENT</span>
          <span className="text-xl font-black font-mono text-red-400">{stats.absent || 0}</span>
        </div>
        <div className="glass-card p-4 border-violet-500/20">
          <span className="text-[10px] text-violet-400 font-mono uppercase block">PERCENTAGE</span>
          <span className="text-xl font-black font-mono text-violet-300">{stats.percentage || 0}%</span>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-gray-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Session ID</th>
                <th className="px-4 py-3">Lab Name</th>
                <th className="px-4 py-3">Course / Subject</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400 font-mono">
                    Loading records...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400 font-mono">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.attendance_id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-white">{row.date || '2026-08-08'}</td>
                    <td className="px-4 py-3.5 font-mono text-violet-300">{row.session_id}</td>
                    <td className="px-4 py-3.5 font-medium">{row.lab_name}</td>
                    <td className="px-4 py-3.5">{row.course_name || 'IdeaLab Practical'}</td>
                    <td className="px-4 py-3.5 font-mono text-gray-400">
                      {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {row.status === 'PRESENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                          <CheckCircle2 className="w-3 h-3" /> PRESENT
                        </span>
                      )}
                      {row.status === 'ABSENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold font-mono">
                          <XCircle className="w-3 h-3" /> ABSENT
                        </span>
                      )}
                      {row.status === 'LATE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
                          <Clock className="w-3 h-3" /> LATE
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
