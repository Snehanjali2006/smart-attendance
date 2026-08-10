import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Shield, User, GraduationCap, Lock, ArrowRight, CheckCircle2, Building2, HelpCircle } from 'lucide-react';
import BackgroundParticles from '../components/BackgroundParticles';

export default function Login({ defaultRole = 'STUDENT' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Infer role from path if specific route was hit
  const initialRole = location.pathname.includes('/admin')
    ? 'ADMIN'
    : location.pathname.includes('/faculty')
    ? 'TEACHER'
    : defaultRole;

  const [role, setRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState(initialRole === 'STUDENT' ? '' : initialRole === 'TEACHER' ? 'teacher@idealab.com' : 'admin@idealab.com');
  const [password, setPassword] = useState(initialRole === 'STUDENT' ? '' : initialRole === 'TEACHER' ? 'teacher123' : 'admin123');
  const [studentCategory, setStudentCategory] = useState('SIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'STUDENT') navigate('/student/dashboard');
      else if (user.role === 'TEACHER') navigate('/teacher/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setError('');
    if (newRole === 'STUDENT') {
      setIdentifier('');
      setPassword('');
      setStudentCategory('SIC');
    } else if (newRole === 'TEACHER') {
      setIdentifier('teacher@idealab.com');
      setPassword('teacher123');
    } else {
      setIdentifier('admin@idealab.com');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter User ID / Email and Password.');
      return;
    }

    setLoading(true);
    setError('');

    let endpoint = '/auth/login';
    let payload = { identifier, password };

    if (role === 'STUDENT') {
      endpoint = '/auth/student-login';
      payload.studentCategory = studentCategory;
    }

    const res = await apiRequest(endpoint, 'POST', payload);
    setLoading(false);

    if (res.success && res.token && res.user) {
      login(res.user, res.token);
      const userRole = res.user.role;
      if (userRole === 'STUDENT') navigate('/student/dashboard');
      else if (userRole === 'TEACHER') navigate('/teacher/dashboard');
      else if (userRole === 'ADMIN') navigate('/admin/dashboard');
    } else {
      setError(res.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundParticles />

      {/* Main Login Card */}
      <div className="w-full max-w-md glass-card p-8 border-violet-500/30 neon-border-purple z-10 shadow-2xl relative">
        {/* Institutional Branding */}
        <div className="text-center mb-8">
          <img src="/aicte-logo.jpg" alt="AICTE IDEALab Logo" className="w-14 h-14 object-contain rounded-2xl mx-auto shadow-lg shadow-violet-500/30 mb-4 bg-white p-1.5" />
          <h1 className="text-2xl font-black tracking-tight text-white">
            IDEALAB SMART ATTENDANCE
          </h1>
          <p className="text-[11px] text-violet-400 font-mono tracking-widest uppercase mt-1">
            "Scan • Verify • Attend"
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => handleRoleSwitch('STUDENT')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              role === 'STUDENT'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch('TEACHER')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              role === 'TEACHER'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Faculty</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch('ADMIN')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              role === 'ADMIN'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'STUDENT' && (
            <div>
              <label className="block text-[10px] font-semibold text-gray-300 font-mono mb-1.5 uppercase tracking-wider">
                STUDENT CATEGORY
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStudentCategory('SIC')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all border ${
                    studentCategory === 'SIC'
                      ? 'bg-violet-600/30 border-violet-500 text-white shadow-md shadow-violet-500/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="text-[11px]">SIC</div>
                  <div className="text-[9px] font-normal opacity-80">Innovation Council</div>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentCategory('SC')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all border ${
                    studentCategory === 'SC'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="text-[11px]">SC</div>
                  <div className="text-[9px] font-normal opacity-80">Student Chapter</div>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-gray-300 font-mono mb-1.5 uppercase tracking-wider">
              {role === 'STUDENT' ? 'STUDENT ID / SIC' : role === 'TEACHER' ? 'FACULTY ID / EMAIL' : 'ADMIN EMAIL'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'STUDENT' ? 'e.g. 23CSE1045' : 'Enter login ID or email'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-semibold text-gray-300 font-mono uppercase tracking-wider">
                PASSWORD
              </label>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-[11px] text-violet-400 hover:underline font-mono"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white text-xs font-bold font-mono shadow-lg shadow-violet-600/30 hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>SIGN IN TO PORTAL</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Institutional No Self-Registration Notice */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center font-mono space-y-2">
          <p className="text-[11px] text-gray-400">
            Account access is provided by <strong className="text-violet-300">IdeaLab Administration</strong>.
          </p>
          {role === 'STUDENT' && (
            <p className="text-[10px] text-gray-500">
              Don't have an account? <span className="text-cyan-400 font-bold">Contact IdeaLab Administrator.</span>
            </p>
          )}
          {role === 'TEACHER' && (
            <p className="text-[10px] text-gray-500">
              Faculty accounts are created by the <span className="text-indigo-400 font-bold">Administrator.</span>
            </p>
          )}
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-[9px] text-gray-400 font-mono text-center mb-2 uppercase">
            Quick Testing Credentials
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleRoleSwitch('STUDENT')}
              className="py-1 px-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-violet-300 border border-white/5"
            >
              Student
            </button>
            <button
              onClick={() => handleRoleSwitch('TEACHER')}
              className="py-1 px-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-indigo-300 border border-white/5"
            >
              Teacher
            </button>
            <button
              onClick={() => handleRoleSwitch('ADMIN')}
              className="py-1 px-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-cyan-300 border border-white/5"
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Account Assistance Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-sm w-full p-6 border-violet-500/40 relative font-mono text-xs">
            <div className="text-center space-y-3">
              <Building2 className="w-10 h-10 text-cyan-400 mx-auto" />
              <h3 className="text-base font-bold text-white">IdeaLab Account Assistance</h3>
              <p className="text-gray-300 leading-relaxed">
                All student and faculty accounts are strictly managed and issued by the <strong>IdeaLab Administration</strong>.
              </p>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-left space-y-1">
                <span className="text-[10px] text-gray-400 uppercase block">ADMIN CONTACT</span>
                <p className="text-violet-300 font-bold">admin@idealab.com</p>
                <p className="text-gray-400 text-[10px]">IdeaLab Central Block - Floor 2</p>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
