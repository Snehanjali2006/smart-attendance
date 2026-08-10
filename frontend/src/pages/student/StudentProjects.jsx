import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { FolderKanban, Plus, Clock, CheckCircle2, AlertCircle, FileText, Send } from 'lucide-react';

export default function StudentProjects() {
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    reason: '',
    problemStatement: '',
    expectedOutcome: '',
    teamMembers: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchProjectsAndRequests();
  }, []);

  const fetchProjectsAndRequests = async () => {
    setLoading(true);
    const resProjects = await apiRequest('/projects');
    const resDash = await apiRequest('/student/dashboard');

    if (resProjects.success) setProjects(resProjects.projects || []);
    if (resDash.success) setRequests(resDash.requests || []);
    setLoading(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectName) return;

    setSubmitting(true);
    const res = await apiRequest('/projects/request', 'POST', formData);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('✓ Project permission request submitted to IdeaLab Faculty!');
      setFormData({
        projectName: '',
        reason: '',
        problemStatement: '',
        expectedOutcome: '',
        teamMembers: '',
        message: ''
      });
      setTimeout(() => {
        setShowApplyModal(false);
        setSuccessMsg('');
        fetchProjectsAndRequests();
      }, 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">IdeaLab Projects</h1>
          <p className="text-xs text-gray-400 font-mono">Explore active lab projects and apply for project permission</p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold font-mono shadow-lg hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>APPLY FOR PROJECT</span>
        </button>
      </div>

      {/* My Submitted Requests Section */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-violet-300 uppercase tracking-widest font-semibold">
            MY PROJECT PERMISSION REQUESTS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requests.map((req) => (
              <div key={req.request_id} className="glass-card p-4 border-violet-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{req.project_name}</h4>
                  {req.status === 'APPROVED' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      ✓ APPROVED
                    </span>
                  )}
                  {req.status === 'PENDING' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                      ⏱ PENDING REVIEW
                    </span>
                  )}
                  {req.status === 'REJECTED' && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold">
                      ❌ REJECTED
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300 line-clamp-2">{req.reason}</p>
                <div className="text-[10px] font-mono text-gray-400">
                  Submitted: {new Date(req.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Running Projects */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
          CURRENTLY RUNNING IDEALAB PROJECTS
        </h3>

        {loading ? (
          <div className="p-8 text-center text-gray-400 font-mono">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.project_id} className="glass-card p-6 border-white/10 space-y-4 hover:border-violet-500/30 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-violet-400 uppercase">{p.project_id}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{p.project_name}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                    {p.status}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{p.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase block">FACULTY IN-CHARGE</span>
                    <span className="font-semibold text-white">{p.faculty_name || 'Dr. Priyanshu'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase block">DEADLINE</span>
                    <span className="font-mono text-cyan-300 font-bold">{p.deadline}</span>
                  </div>
                </div>

                {p.members && p.members.length > 0 && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase block mb-1.5">TEAM MEMBERS ({p.members.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.members.map((m, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-200 border border-white/10 text-[10px] font-mono">
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
      </div>

      {/* Modal: Apply for Project */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full p-6 border-violet-500/40 relative">
            <h3 className="text-lg font-bold text-white mb-1">Apply for Project Permission</h3>
            <p className="text-xs text-gray-400 mb-4">Request faculty approval to build an R&D project in IdeaLab</p>

            {successMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold rounded-xl text-center">
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">PROJECT NAME</label>
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    placeholder="e.g. AI Crop Disease Detection"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">PROBLEM STATEMENT</label>
                  <textarea
                    rows="2"
                    value={formData.problemStatement}
                    onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                    placeholder="What problem does this project address?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">EXPECTED OUTCOME & REASON</label>
                  <textarea
                    rows="2"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value, expectedOutcome: e.target.value })}
                    placeholder="Expected hardware/software prototype output..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-300 uppercase mb-1">TEAM MEMBERS</label>
                  <input
                    type="text"
                    value={formData.teamMembers}
                    onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                    placeholder="Name & SIC of team members"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 py-2.5 bg-white/5 text-gray-300 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold font-mono shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'SUBMIT REQUEST'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
