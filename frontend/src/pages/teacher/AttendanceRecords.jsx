import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { FileSpreadsheet, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AttendanceRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const res = await apiRequest('/teacher/live-attendance');
    if (res.success) {
      setRecords(res.attendanceList || []);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">Attendance Records</h1>
        <p className="text-xs text-gray-400 font-mono">Detailed log of verified attendance scans</p>
      </div>

      <div className="glass-card overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-gray-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">SIC</th>
                <th className="px-4 py-3.5">Branch</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Entry Time</th>
                <th className="px-4 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-400 font-mono">Loading records...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-400 font-mono">No records found.</td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="px-4 py-3.5 font-mono text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-white">{r.name}</td>
                    <td className="px-4 py-3.5 font-mono text-violet-300">{r.sic}</td>
                    <td className="px-4 py-3.5">{r.branch}</td>
                    <td className="px-4 py-3.5">{r.year}</td>
                    <td className="px-4 py-3.5 font-mono text-cyan-300 font-bold">{r.entryTime}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        {r.status}
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
