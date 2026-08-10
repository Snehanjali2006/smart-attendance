import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { apiRequest } from '../../utils/api';
import { Radio, Users, CheckCircle2, RefreshCw } from 'lucide-react';

export default function LiveAttendance() {
  const { socket } = useSocket();
  const [session, setSession] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveFeed();
  }, []);

  const fetchLiveFeed = async () => {
    setLoading(true);
    const res = await apiRequest('/teacher/live-attendance');
    if (res.success) {
      setSession(res.session);
      setAttendanceList(res.attendanceList || []);
    }
    setLoading(false);
  };

  // Socket.IO Listener for real-time live attendance additions
  useEffect(() => {
    if (!socket) return;

    const handleNewAttendance = (newRecord) => {
      setAttendanceList((prev) => {
        // Prevent duplicate append
        if (prev.some((r) => r.sic === newRecord.studentId)) return prev;

        const newItem = {
          id: prev.length + 1,
          name: newRecord.studentName,
          sic: newRecord.studentId,
          branch: newRecord.branch,
          year: newRecord.year,
          department: newRecord.department,
          studentCategory: newRecord.studentCategory || 'SIC',
          chapter: newRecord.studentCategory === 'SC' ? 'Student Chapter' : 'Student Innovation Council',
          entryTime: newRecord.entryTime,
          status: 'PRESENT'
        };

        return [newItem, ...prev];
      });
    };

    socket.on('attendance_marked', handleNewAttendance);
    socket.on('global_attendance_marked', handleNewAttendance);

    return () => {
      socket.off('attendance_marked', handleNewAttendance);
      socket.off('global_attendance_marked', handleNewAttendance);
    };
  }, [socket]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Live Attendance Feed
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold animate-pulse">
                ● LIVE SOCKET SYNC
              </span>
            </h1>
            <p className="text-xs text-gray-400 font-mono">
              {session ? `${session.lab_name} • ${session.session_id}` : 'Listening for student QR scans'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchLiveFeed}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass-card text-xs text-gray-300 hover:text-white font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Live Table */}
      <div className="glass-card overflow-hidden border-emerald-500/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-gray-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">SIC</th>
                <th className="px-4 py-3.5">Branch</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Dept</th>
                <th className="px-4 py-3.5">Chapter / Council</th>
                <th className="px-4 py-3.5">Entry Time</th>
                <th className="px-4 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-400 font-mono">
                    Loading live attendance feed...
                  </td>
                </tr>
              ) : attendanceList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-gray-400 font-mono">
                    Waiting for students to scan the Lab PC QR screen...
                  </td>
                </tr>
              ) : (
                attendanceList.map((row, idx) => (
                  <tr
                    key={row.sic || idx}
                    className="hover:bg-white/5 transition-colors animate-fadeIn"
                  >
                    <td className="px-4 py-3.5 font-mono text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-white">{row.name}</td>
                    <td className="px-4 py-3.5 font-mono text-violet-300">{row.sic}</td>
                    <td className="px-4 py-3.5 text-gray-300">{row.branch}</td>
                    <td className="px-4 py-3.5 text-gray-300">{row.year}</td>
                    <td className="px-4 py-3.5 font-mono text-gray-400">{row.department}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        row.studentCategory === 'SC' || (row.chapter && row.chapter.includes('Chapter'))
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                      }`}>
                        {row.studentCategory || (row.chapter && row.chapter.includes('Chapter') ? 'SC' : 'SIC')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-cyan-300 font-bold">{row.entryTime}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
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
