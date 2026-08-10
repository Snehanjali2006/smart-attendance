import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Building2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import BackgroundParticles from '../components/BackgroundParticles';

export default function AttendanceVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const sessionId = searchParams.get('session') || '';
  const token = searchParams.get('token') || '';

  // Mobile login fields
  const [studentIdInput, setStudentIdInput] = useState('23CSE1045');
  const [passwordInput, setPasswordInput] = useState('student123');
  const [studentCategory, setStudentCategory] = useState('SIC');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Code entry field
  const [enteredCode, setEnteredCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Verification result states
  const [verifyState, setVerifyState] = useState('IDLE'); // 'IDLE' | 'SUCCESS' | 'INVALID_CODE' | 'EXPIRED' | 'ALREADY' | 'INACTIVE' | 'UNAUTHORIZED'
  const [resultRecord, setResultRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Mobile Login Submit Handler
  const handleMobileLogin = async (e) => {
    e.preventDefault();
    if (!studentIdInput || !passwordInput) {
      setLoginError('Please enter Student ID / SIC and Password.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    const res = await apiRequest('/auth/student-login', 'POST', {
      identifier: studentIdInput,
      password: passwordInput,
      studentCategory
    });
    setLoginLoading(false);

    if (res.success && res.token && res.user) {
      if (res.user.role !== 'STUDENT') {
        setLoginError('Only student accounts can mark attendance. Switch to a student login.');
        return;
      }
      login(res.user, res.token);
    } else {
      setLoginError(res.message || 'Login failed. Invalid credentials or category selection.');
    }
  };

  // Unique Code Verification Submit Handler
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!enteredCode) {
      setErrorMessage('Please enter the number displayed on the Lab PC.');
      setVerifyState('INVALID_CODE');
      return;
    }

    setVerifying(true);
    setErrorMessage('');

    const res = await apiRequest('/attendance/verify', 'POST', {
      sessionId,
      token,
      code: enteredCode,
      deviceInfo: 'Mobile Web Browser'
    });
    setVerifying(false);

    if (res.success && res.record) {
      setResultRecord(res.record);
      setVerifyState('SUCCESS');
    } else {
      setErrorMessage(res.message || 'Verification failed.');
      const code = res.errorCode;
      if (code === 'INVALID_CODE') setVerifyState('INVALID_CODE');
      else if (code === 'EXPIRED_TOKEN') setVerifyState('EXPIRED');
      else if (code === 'ALREADY_MARKED') setVerifyState('ALREADY');
      else if (code === 'SESSION_INACTIVE') setVerifyState('INACTIVE');
      else if (code === 'UNAUTHORIZED') setVerifyState('UNAUTHORIZED');
      else setVerifyState('INVALID_CODE');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden font-mono">
      <BackgroundParticles />

      <div className="w-full max-w-md glass-card p-6 md:p-8 border-violet-500/30 neon-border-purple z-10 shadow-2xl relative">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/aicte-logo.jpg" alt="AICTE IDEALab Logo" className="w-12 h-12 object-contain rounded-2xl mx-auto shadow-lg shadow-violet-500/30 mb-3 bg-white p-1" />
          <h1 className="text-xl font-black text-white tracking-tight">
            IDEALAB SMART ATTENDANCE
          </h1>
          <p className="text-[10px] text-violet-400 tracking-widest uppercase mt-1">
            "Scan • Verify • Attend"
          </p>
        </div>

        {/* STEP 1: MOBILE STUDENT LOGIN (IF NOT LOGGED IN) */}
        {!user && verifyState === 'IDLE' && (
          <div className="space-y-5">
            <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-xl text-center">
              <span className="text-[11px] text-violet-300 font-bold block">
                🔒 LOGIN TO MARK YOUR ATTENDANCE
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                Session Token Preserved from Lab PC Scan
              </span>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleMobileLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-gray-300 uppercase font-bold mb-1">
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

              <div>
                <label className="block text-[10px] text-gray-300 uppercase font-bold mb-1">
                  STUDENT ID / SIC
                </label>
                <input
                  type="text"
                  required
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  placeholder="e.g. 23CSE1045"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-300 uppercase font-bold mb-1">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>CONTINUE TO VERIFICATION</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-white/10 text-center text-[10px] text-gray-400">
              Your account is provided by <strong className="text-violet-300">IdeaLab Administration</strong>.
            </div>
          </div>
        )}

        {/* STEP 2: UNIQUE NUMBER ENTRY (IF LOGGED IN & STATE IS IDLE) */}
        {user && verifyState === 'IDLE' && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[11px] text-emerald-400 font-bold block">
                Welcome, {user.name} 👋
              </span>
              <h2 className="text-lg font-bold text-white mt-1">Verify Attendance</h2>
              <p className="text-xs text-gray-400 mt-1">
                Enter the number shown on the IdeaLab Lab Display.
              </p>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-5 text-center">
              <div className="p-4 bg-white/5 border border-violet-500/30 rounded-2xl space-y-3">
                <span className="text-[10px] text-violet-300 tracking-wider uppercase font-bold block">
                  CURRENT LAB DISPLAY NUMBER
                </span>
                <input
                  type="text"
                  maxLength={4}
                  required
                  autoFocus
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder="__"
                  className="w-32 bg-slate-900 border-2 border-violet-500 rounded-xl px-4 py-3 text-center text-4xl font-black text-white tracking-widest focus:outline-none focus:border-cyan-400 font-mono shadow-inner mx-auto"
                />
                <p className="text-[10px] text-gray-400 italic">
                  Look at the number currently displayed beside the QR code on the Lab PC.
                </p>
              </div>

              <button
                type="submit"
                disabled={verifying || !enteredCode}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-cyan-500 text-white text-xs font-bold tracking-wider shadow-lg shadow-emerald-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>VERIFY & MARK ATTENDANCE</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <Link to="/student/dashboard" className="text-[11px] text-gray-400 hover:text-white inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Profile
              </Link>
            </div>
          </div>
        )}

        {/* RESULT: ✓ ATTENDANCE MARKED SUCCESSFULLY */}
        {verifyState === 'SUCCESS' && resultRecord && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-emerald-400">
                ✓ ATTENDANCE MARKED SUCCESSFULLY
              </h2>
              <p className="text-xs text-gray-300 mt-1">
                Your attendance has been verified & recorded in IdeaLab database.
              </p>
            </div>

            <div className="glass-card p-4 text-left space-y-2.5 text-xs text-gray-200 border-white/10">
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-400">NAME:</span>
                <span className="font-bold text-white">{resultRecord.studentName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-400">STUDENT ID:</span>
                <span className="text-violet-300 font-bold">{resultRecord.studentId}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-400">BRANCH:</span>
                <span className="text-white">{resultRecord.branch}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-400">YEAR:</span>
                <span className="text-white">{resultRecord.year}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-400">LAB:</span>
                <span className="text-emerald-300 font-bold">{resultRecord.labName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-400">ENTRY TIME:</span>
                <span className="text-cyan-300 font-bold">{resultRecord.entryTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DATE:</span>
                <span className="text-gray-300">{resultRecord.date}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/student/dashboard')}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-bold text-xs shadow-lg"
            >
              [ GO TO MY PROFILE ]
            </button>
          </div>
        )}

        {/* RESULT: ❌ INVALID CODE */}
        {verifyState === 'INVALID_CODE' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-400">❌ INVALID CODE</h2>
              <p className="text-xs text-gray-300 mt-2">
                "{errorMessage || 'The number you entered does not match the number currently displayed on the IdeaLab screen.'}"
              </p>
            </div>
            <button
              onClick={() => { setVerifyState('IDLE'); setEnteredCode(''); }}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-xs shadow-lg"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* RESULT: ⏱ EXPIRED QR */}
        {verifyState === 'EXPIRED' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center">
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-400">⏱ QR CODE EXPIRED</h2>
              <p className="text-xs text-gray-300 mt-2">
                This QR code or verification number is no longer valid. Please scan the latest QR displayed on the IdeaLab screen.
              </p>
            </div>
            <button
              onClick={() => navigate('/student/scan')}
              className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-xs shadow-lg"
            >
              SCAN AGAIN
            </button>
          </div>
        )}

        {/* RESULT: ✓ ALREADY MARKED */}
        {verifyState === 'ALREADY' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/40 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-violet-300">✓ ALREADY MARKED</h2>
              <p className="text-xs text-gray-300 mt-2">
                You have already marked attendance for this session.
              </p>
            </div>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold text-xs shadow-lg"
            >
              [ GO TO PROFILE ]
            </button>
          </div>
        )}

        {/* RESULT: SESSION NOT ACTIVE / UNAUTHORIZED */}
        {(verifyState === 'INACTIVE' || verifyState === 'UNAUTHORIZED') && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-300">
                {verifyState === 'INACTIVE' ? 'SESSION NOT ACTIVE' : 'UNAUTHORIZED'}
              </h2>
              <p className="text-xs text-gray-300 mt-2">
                {errorMessage || 'The attendance session is closed or you are not eligible.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="w-full py-3 bg-cyan-600 text-white rounded-xl font-bold text-xs shadow-lg"
            >
              BACK TO DASHBOARD
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
