import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Bell, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      const res = await apiRequest('/student/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
      }
      setLoading(false);
    };
    fetchNotifs();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6 text-violet-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          <p className="text-xs text-gray-400 font-mono">Updates regarding lab sessions, attendance, and project requests</p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400 font-mono">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400 font-mono text-xs">
            No new notifications.
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="glass-card p-4 border-white/10 flex items-start gap-3 hover:border-violet-500/30 transition-all">
              <div className="p-2 rounded-xl bg-white/5 mt-0.5">
                {n.type === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {n.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {n.type === 'ALERT' && <AlertCircle className="w-4 h-4 text-cyan-400" />}
                {(!n.type || n.type === 'INFO') && <Info className="w-4 h-4 text-violet-400" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <span className="text-[10px] font-mono text-gray-500">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
