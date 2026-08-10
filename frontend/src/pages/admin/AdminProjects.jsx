import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { FolderGit2 } from 'lucide-react';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    apiRequest('/projects').then((res) => {
      if (res.success) setProjects(res.projects || []);
    });
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">All University Projects</h1>
        <p className="text-xs text-gray-400 font-mono">Overview of registered R&D projects in IdeaLab</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div key={p.project_id} className="glass-card p-6 border-white/10 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-violet-400">{p.project_id}</span>
                <h3 className="text-base font-bold text-white">{p.project_name}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                {p.status}
              </span>
            </div>
            <p className="text-xs text-gray-300">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
