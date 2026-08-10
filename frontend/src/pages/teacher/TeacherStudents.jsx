import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Search, Users, Phone, Mail, GraduationCap } from 'lucide-react';

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const res = await apiRequest('/teacher/students');
      if (res.success) {
        setStudents(res.students || []);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase()) ||
    s.branch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Student Directory</h1>
          <p className="text-xs text-gray-400 font-mono">View students registered in IdeaLab courses</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SIC, branch..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-400 font-mono">
            Loading student directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full glass-card p-8 text-center text-gray-400 font-mono text-xs">
            No students found matching "{search}".
          </div>
        ) : (
          filtered.map((st) => (
            <div key={st.student_id} className="glass-card p-5 border-white/10 space-y-4 hover:border-violet-500/30 transition-all">
              <div className="flex items-center gap-3">
                <img
                  src={st.profile_photo || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                  alt={st.name}
                  className="w-12 h-12 rounded-xl object-cover border border-violet-500/30"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{st.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                      st.student_category === 'SC'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                    }`}>
                      {st.student_category || 'SIC'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-violet-300">SIC: {st.student_id}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300 font-mono pt-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Branch:</span>
                  <span className="text-white">{st.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Year / Sem:</span>
                  <span className="text-white">{st.year} ({st.semester})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Attendance %:</span>
                  <span className={`font-bold ${st.attendancePct >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {st.attendancePct}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
