import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { apiRequest } from '../utils/api';
import { Maximize, Minimize, Clock, Users, Calendar, Sparkles, RefreshCw, Wifi } from 'lucide-react';

export default function LabDisplay() {
  const { socket } = useSocket();
  const [activeSession, setActiveSession] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [code, setCode] = useState(47);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [presentCount, setPresentCount] = useState(87);
  const [totalStudents, setTotalStudents] = useState(120);
  const [labName, setLabName] = useState('IdeaLab Hall - 1');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState(null);

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current active session & network info on mount
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      const res = await apiRequest('/sessions/current');
      if (res.success && res.active && res.session) {
        const s = res.session;
        setActiveSession(s);
        setQrToken(s.token);
        setCode(s.code || 47);
        setPresentCount(s.presentCount || 0);
        setTotalStudents(s.totalStudents || 120);
        setLabName(s.labName || 'IdeaLab Hall - 1');
      } else {
        setActiveSession(null);
      }

      // Fetch network info
      const netRes = await apiRequest('/system/network-info');
      if (netRes.success) {
        setNetworkInfo(netRes);
      }
      setLoading(false);
    };

    fetchSession();
  }, []);

  // Socket.IO real-time QR rotation and instant present counter updates
  useEffect(() => {
    if (!socket) return;

    if (activeSession?.sessionId) {
      socket.emit('join_session_room', activeSession.sessionId);
    }

    const handleQrUpdate = (data) => {
      setQrToken(data.token);
      setCode(data.code);
      setSecondsRemaining(60);
      setPresentCount(data.presentCount);
      setTotalStudents(data.totalStudents);
      setLabName(data.labName);
    };

    const handleAttendanceMarked = (data) => {
      setPresentCount(data.presentCount);
    };

    const handleGlobalSessionUpdate = (data) => {
      if (data) {
        setActiveSession(data);
        setQrToken(data.token);
        setCode(data.code);
        setPresentCount(data.presentCount);
        setTotalStudents(data.totalStudents);
        setLabName(data.labName);
      } else {
        setActiveSession(null);
      }
    };

    socket.on('qr_update', handleQrUpdate);
    socket.on('attendance_marked', handleAttendanceMarked);
    socket.on('global_session_update', handleGlobalSessionUpdate);

    return () => {
      socket.off('qr_update', handleQrUpdate);
      socket.off('attendance_marked', handleAttendanceMarked);
      socket.off('global_session_update', handleGlobalSessionUpdate);
    };
  }, [socket, activeSession?.sessionId]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  // Resolve LAN Mobile QR URL (never use localhost inside QR for mobile devices)
  const getMobileQrScanUrl = () => {
    if (!activeSession) return '';

    // 1. If backend APP_BASE_URL / networkInfo has LAN IP, use it
    if (activeSession.appBaseUrl && !activeSession.appBaseUrl.includes('localhost') && !activeSession.appBaseUrl.includes('127.0.0.1')) {
      return `${activeSession.appBaseUrl}/attendance/verify?session=${activeSession.sessionId}&token=${qrToken}`;
    }

    if (networkInfo?.appBaseUrl && !networkInfo.appBaseUrl.includes('localhost') && !networkInfo.appBaseUrl.includes('127.0.0.1')) {
      return `${networkInfo.appBaseUrl}/attendance/verify?session=${activeSession.sessionId}&token=${qrToken}`;
    }

    // 2. If browser address bar uses IP (e.g. 192.168.1.100), use origin
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.origin}/attendance/verify?session=${activeSession.sessionId}&token=${qrToken}`;
    }

    // 3. If LAN IP detected by networkInfo
    if (networkInfo?.lanIp && networkInfo.lanIp !== 'localhost') {
      return `http://${networkInfo.lanIp}:5173/attendance/verify?session=${activeSession.sessionId}&token=${qrToken}`;
    }

    // Fallback
    return `${window.location.origin}/attendance/verify?session=${activeSession.sessionId}&token=${qrToken}`;
  };

  const scanUrl = getMobileQrScanUrl();
  const qrImageUrl = activeSession
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(scanUrl)}&color=0b0f19&bgcolor=ffffff`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-violet-300">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-mono text-lg">Initializing IdeaLab Screen...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-between p-6 lg:p-10 select-none relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img src="/aicte-logo.jpg" alt="AICTE IDEALab Logo" className="w-12 h-12 object-contain rounded-2xl shadow-xl shadow-violet-500/25 bg-white p-1" />
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent">
              IDEALAB SMART ATTENDANCE
            </h1>
            <p className="text-xs text-violet-400 font-mono tracking-widest uppercase">
              "Scan • Verify • Attend"
            </p>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card hover:border-violet-500/50 text-xs font-semibold text-violet-200 transition-all shadow-lg"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          <span>{isFullscreen ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      {!activeSession ? (
        <main className="flex-1 flex items-center justify-center my-8 z-10">
          <div className="glass-card max-w-xl p-10 text-center border-violet-500/30 neon-border-purple">
            <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/30 mx-auto flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-violet-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Active Attendance Session</h2>
            <p className="text-gray-400 text-sm mb-6">
              Please ask your faculty to start an attendance session from the Teacher Dashboard.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-violet-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Waiting for session broadcast...
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-8 z-10">
          {/* Left Column: Code & Timer */}
          <div className="lg:col-span-5 flex flex-col justify-center items-center lg:items-start space-y-8">
            <div className="glass-card p-8 w-full max-w-md border-violet-500/30 text-center lg:text-left">
              <span className="text-xs font-mono tracking-widest text-violet-400 uppercase font-semibold block mb-2">
                CURRENT CODE
              </span>
              <div className="text-7xl lg:text-8xl font-black font-mono tracking-wider neon-text-purple my-2">
                {String(code).padStart(2, '0')}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">Code changes in:</span>
                <span className="text-xl font-bold font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-500/30">
                  00:{String(secondsRemaining).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="glass-card p-6 w-full max-w-md border-indigo-500/20 text-xs text-gray-300 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">SESSION ID:</span>
                <span className="text-violet-300 font-bold">{activeSession.sessionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">COURSE:</span>
                <span className="text-white font-medium">{activeSession.courseName || 'Advanced AI & IoT'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">BATCH:</span>
                <span className="text-white font-medium">{activeSession.batch || 'Batch A'}</span>
              </div>
              {networkInfo?.lanIp && (
                <div className="flex justify-between pt-2 border-t border-white/10 text-cyan-400">
                  <span className="text-gray-400">LAN WI-FI IP:</span>
                  <span className="font-bold flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> {networkInfo.lanIp}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: QR Code Display */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="glass-card p-8 lg:p-10 border-violet-500/40 neon-border-purple text-center flex flex-col items-center shadow-2xl relative">
              <span className="text-sm font-bold tracking-wider text-violet-300 uppercase mb-4 font-mono">
                SCAN QR TO MARK ATTENDANCE
              </span>

              {/* QR Container */}
              <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-violet-500/50 mb-4 group hover:scale-[1.02] transition-transform">
                <img
                  src={qrImageUrl}
                  alt="Attendance Session QR"
                  className="w-64 h-64 lg:w-80 lg:h-80 object-contain rounded-lg"
                />
              </div>

              <p className="text-xs text-gray-400 font-mono mb-2 break-all max-w-sm">
                Target URL: <span className="text-cyan-300 select-all">{scanUrl}</span>
              </p>

              <p className="text-xs text-gray-300 max-w-md leading-relaxed">
                Scan this QR code using your mobile phone camera or built-in scanner. Ensure phone is connected to the same Wi-Fi network.
              </p>
            </div>
          </div>
        </main>
      )}

      {/* Bottom Information Bar */}
      <footer className="glass-card px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-violet-500/20 z-10">
        <div className="flex items-center gap-6 text-xs text-gray-300 font-mono">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">{formattedTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-semibold">{labName}</span>
          </div>
        </div>

        {/* Live Counter */}
        <div className="flex items-center gap-4 bg-violet-950/60 px-5 py-2 rounded-xl border border-violet-500/40 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
            <Users className="w-4 h-4 text-violet-400" />
            <span>PRESENT TODAY:</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 animate-pulse-glow">
            {presentCount} <span className="text-gray-500 text-lg font-normal">/ {totalStudents}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
