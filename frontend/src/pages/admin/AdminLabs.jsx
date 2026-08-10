import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { LayoutDashboard, Plus } from 'lucide-react';

export default function AdminLabs() {
  const [labs, setLabs] = useState([]);
  const [form, setForm] = useState({ labId: '', labName: '', location: '', capacity: 120 });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    const res = await apiRequest('/admin/labs');
    if (res.success) setLabs(res.labs || []);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await apiRequest('/admin/labs', 'POST', form);
    if (res.success) {
      setMsg('✓ Lab created successfully!');
      setForm({ labId: '', labName: '', location: '', capacity: 120 });
      fetchLabs();
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">Manage Lab Facilities</h1>
        <p className="text-xs text-gray-400 font-mono">Configure IdeaLab halls, capacity limits, and display screens</p>
      </div>

      <div className="glass-card p-6 border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white">Add New Lab Facility</h3>
        {msg && <p className="text-xs font-mono font-bold text-emerald-400">{msg}</p>}
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="LAB-03"
            value={form.labId}
            onChange={(e) => setForm({ ...form, labId: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
          />
          <input
            type="text"
            required
            placeholder="AI & VLSI Design Studio"
            value={form.labName}
            onChange={(e) => setForm({ ...form, labName: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
          />
          <input
            type="text"
            placeholder="Block C - Floor 3"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
          />
          <button type="submit" className="py-2 bg-violet-600 text-white rounded-xl text-xs font-bold font-mono">
            ADD LAB
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {labs.map((l) => (
          <div key={l.lab_id} className="glass-card p-5 border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-violet-300 font-bold">{l.lab_id}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                {l.status}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{l.lab_name}</h3>
            <p className="text-xs text-gray-400 font-mono">Location: {l.location} • Capacity: {l.capacity} students</p>
          </div>
        ))}
      </div>
    </div>
  );
}
