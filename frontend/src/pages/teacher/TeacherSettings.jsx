import React, { useState } from 'react';
import { apiRequest } from '../../utils/api';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export default function TeacherSettings() {
  const [qrValidity, setQrValidity] = useState(60);
  const [minAttendance, setMinAttendance] = useState(75);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const res = await apiRequest('/admin/settings', 'POST', {
      qrExpirationSeconds: qrValidity,
      minAttendancePct: minAttendance
    });
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">System Settings</h1>
        <p className="text-xs text-gray-400 font-mono">Configure QR session security and attendance policy thresholds</p>
      </div>

      <div className="glass-card p-6 border-white/10 space-y-6">
        {saved && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>System configuration updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-white mb-1 font-mono uppercase">
              QR CODE ROTATION VALIDITY (SECONDS)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Time duration before the Lab PC generates a new cryptographically signed token. Old tokens immediately expire.
            </p>
            <select
              value={qrValidity}
              onChange={(e) => setQrValidity(Number(e.target.value))}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
            >
              <option value={30}>30 Seconds (Ultra High Security)</option>
              <option value={60}>60 Seconds (Recommended Production Standard)</option>
              <option value={120}>120 Seconds (Extended Duration)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-1 font-mono uppercase">
              MINIMUM MANDATORY ATTENDANCE THRESHOLD (%)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Students falling below this attendance rate trigger Low Attendance Alerts on the Faculty Dashboard.
            </p>
            <input
              type="number"
              value={minAttendance}
              onChange={(e) => setMinAttendance(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold font-mono shadow-lg flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>SAVE SYSTEM CONFIGURATION</span>
          </button>
        </form>
      </div>
    </div>
  );
}
