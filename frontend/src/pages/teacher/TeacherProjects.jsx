import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { FolderGit2, CheckCircle2, XCircle, Clock, Plus, UserCheck } from 'lucide-react';

export default function TeacherProjects() {
  const [tab, setTab] = useState('PROJECTS'); // 'PROJECTS' | 'REQUESTS'
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const resP = await apiRequest('/projects');
    const resR = await apiRequest('/projects/requests');

    if (resP.success) setProjects(resP.projects || []);
    if (resR.success) setRequests(resR.requests || []);
    setLoading(false);
  };

  const handleRequestDecision = async (requestId, status) => {
    setUpdatingId(requestId);
    const res = await apiRequest(`/projects/requests/${requestId}`, 'PUT', { status });
    setUpdatingId(null);

    if (res.success) {
      fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Project Management</h1>
          <p className="text-xs text-gray-400 font-mono">Manage IdeaLab research projects and student permission requests</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setTab('PROJECTS')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg font-mono transition-all ${
              tab === 'PROJECTS' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            ACTIVE PROJECTS ({projects.length})
          </button>
          <button
            onClick={() => setTab('REQUESTS')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg font-mono transition-all ${
              tab === 'REQUESTS' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            PERMISSION REQUESTS ({requests.filter(r => r.status === 'PENDING').length})
          </button>
        </div>
      </div>

      {tab === 'PROJECTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.project_id} className="glass-card p-6 border-white/10 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-violet-400 uppercase">{p.project_id}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{p.project_name}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                  {p.status}
                </span>
              </div>

              <p className="text-xs text-gray-300">{p.description}</p>

              <div className="text-xs text-gray-400 font-mono pt-2 border-t border-white/5">
                Faculty: <strong className="text-white">{p.faculty_name}</strong> • Deadline: <strong className="text-cyan-300">{p.deadline}</strong>
              </div>

              {p.members && p.members.length > 0 && (
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase block mb-1">STUDENTS ASSIGNED</span>
                  <div className="flex flex-wrap gap-1">
                    {p.members.map((m, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-300 text-[10px] font-mono">
                        {m.student_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'REQUESTS' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-400 font-mono text-xs">
              No project permission requests found.
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.request_id} className="glass-card p-6 border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{req.project_name}</h3>
                    <span className="text-xs font-mono text-violet-300">by {req.student_name} ({req.student_id})</span>
                  </div>

                  <p className="text-xs text-gray-300">
                    <strong className="text-gray-400 font-mono">REASON / OUTCOME:</strong> {req.reason || req.message}
                  </p>

                  <div className="text-[11px] font-mono text-gray-400">
                    Team Members: {req.team_members || req.student_name}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {req.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleRequestDecision(req.request_id, 'APPROVED')}
                        disabled={updatingId === req.request_id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>APPROVE</span>
                      </button>

                      <button
                        onClick={() => handleRequestDecision(req.request_id, 'REJECTED')}
                        disabled={updatingId === req.request_id}
                        className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-mono font-bold shadow-md flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>REJECT</span>
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
