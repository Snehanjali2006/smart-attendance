import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell, Sparkles, Monitor } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 glass-nav px-4 lg:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/aicte-logo.jpg" alt="AICTE IDEALab Logo" className="w-9 h-9 object-contain rounded-xl shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform bg-white p-1" />
          <div>
            <h1 className="text-base lg:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent">
              IDEALAB
            </h1>
            <p className="text-[10px] text-violet-400 font-mono tracking-wider uppercase -mt-1">
              SMART ATTENDANCE
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Lab PC Display Quick Button */}
        <Link
          to="/lab-display"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-950/60 hover:bg-violet-900/80 border border-violet-500/30 text-violet-200 transition-all shadow-md"
          title="Open Lab PC Screen Display"
        >
          <Monitor className="w-3.5 h-3.5 text-violet-400" />
          <span>Lab PC Screen</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3 border-l border-white/10 pl-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-white">{user.name}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase font-mono font-medium">
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-gray-300 hover:text-red-400 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
