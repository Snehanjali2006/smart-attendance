import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Settings, Save, MapPin, Navigation } from 'lucide-react';
import BackgroundParticles from '../../components/BackgroundParticles';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    idealabLatitude: '20.998711',
    idealabLongitude: '79.553924',
    idealabAllowedRadius: '500'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/settings');
    if (res.success && res.settings) {
      setSettings({
        idealabLatitude: res.settings.IDEALAB_LATITUDE || '20.998711',
        idealabLongitude: res.settings.IDEALAB_LONGITUDE || '79.553924',
        idealabAllowedRadius: res.settings.IDEALAB_ALLOWED_RADIUS || '500'
      });
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const res = await apiRequest('/admin/settings', 'POST', settings);
    setSaving(false);

    if (res.success) {
      setMessage('Settings saved successfully.');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(res.message || 'Error saving settings.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 text-violet-300 font-mono text-center mt-20">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-violet-400" />
            System Settings
          </h1>
          <p className="text-sm text-gray-400 font-mono mt-1">Configure global application parameters</p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 font-mono text-sm relative z-10">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 relative z-10 max-w-2xl">
        <div className="glass-card p-6 border-white/10 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-cyan-400" />
            Attendance Location
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Set the official GPS coordinates of the IdeaLab. Students must be within the allowed radius of this location to mark attendance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 uppercase font-mono">Latitude</label>
              <input
                type="text"
                required
                value={settings.idealabLatitude}
                onChange={(e) => setSettings({ ...settings, idealabLatitude: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 uppercase font-mono">Longitude</label>
              <input
                type="text"
                required
                value={settings.idealabLongitude}
                onChange={(e) => setSettings({ ...settings, idealabLongitude: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 uppercase font-mono">Allowed Radius (Meters)</label>
              <input
                type="number"
                required
                min="10"
                max="5000"
                value={settings.idealabAllowedRadius}
                onChange={(e) => setSettings({ ...settings, idealabAllowedRadius: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
