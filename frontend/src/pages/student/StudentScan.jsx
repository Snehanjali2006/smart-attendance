import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { apiRequest } from '../../utils/api';
import { CheckCircle2, XCircle, Clock, AlertTriangle, QrCode, RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function StudentScan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [scanState, setScanState] = useState('IDLE'); // 'IDLE' | 'SCANNING' | 'VERIFYING' | 'SUCCESS' | 'INVALID' | 'EXPIRED' | 'ALREADY' | 'INACTIVE' | 'UNAUTHORIZED'
  const [resultRecord, setResultRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [manualSessionId, setManualSessionId] = useState('');
  const [activeSession, setActiveSession] = useState(null);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Auto-verify if session & token passed in URL parameters (e.g. from scanning URL or test link)
  useEffect(() => {
    const sessionParam = searchParams.get('session');
    const tokenParam = searchParams.get('token');
    if (sessionParam && tokenParam) {
      verifyToken(sessionParam, tokenParam);
    } else {
      fetchCurrentSession();
    }
  }, [searchParams]);

  const fetchCurrentSession = async () => {
    const res = await apiRequest('/sessions/current');
    if (res.success && res.active && res.session) {
      setActiveSession(res.session);
      setManualSessionId(res.session.sessionId);
      setManualToken(res.session.token);
    }
  };

  const startScanner = async () => {
    setScanState('SCANNING');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-viewport');
      }
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopScanner();
          handleScannedData(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.warn('Camera access issue:', err);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {}
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleScannedData = (scannedText) => {
    try {
      if (scannedText.includes('session=') && scannedText.includes('token=')) {
        const urlObj = new URL(scannedText);
        const sId = urlObj.searchParams.get('session');
        const tok = urlObj.searchParams.get('token');
        if (sId && tok) {
          navigate(`/verify-attendance?session=${sId}&token=${tok}`);
          return;
        }
      }
      if (scannedText.startsWith('{')) {
        const parsed = JSON.parse(scannedText);
        navigate(`/verify-attendance?session=${parsed.sessionId}&token=${parsed.token}`);
        return;
      }
      if (activeSession) {
        navigate(`/verify-attendance?session=${activeSession.sessionId}&token=${scannedText}`);
      } else {
        navigate(`/verify-attendance?session=ILAB-CURRENT&token=${scannedText}`);
      }
    } catch (err) {
      if (activeSession) {
        navigate(`/verify-attendance?session=${activeSession.sessionId}&token=${scannedText}`);
      }
    }
  };

  const verifyToken = async (sessionId, token) => {
    setScanState('VERIFYING');
    setErrorMessage('');

    const res = await apiRequest('/attendance/verify', 'POST', {
      sessionId,
      token,
      deviceInfo: 'Mobile Browser Camera'
    });

    if (res.success && res.record) {
      setResultRecord(res.record);
      setScanState('SUCCESS');
    } else {
      setErrorMessage(res.message || 'Attendance verification failed.');
      const code = res.errorCode;
      if (code === 'INVALID_TOKEN') setScanState('INVALID');
      else if (code === 'EXPIRED_TOKEN') setScanState('EXPIRED');
      else if (code === 'ALREADY_MARKED') setScanState('ALREADY');
      else if (code === 'SESSION_INACTIVE') setScanState('INACTIVE');
      else if (code === 'UNAUTHORIZED') setScanState('UNAUTHORIZED');
      else setScanState('INVALID');
    }
  };

  const handleTestScanActive = () => {
    if (activeSession) {
      verifyToken(activeSession.sessionId, activeSession.token);
    } else {
      verifyToken('ILAB-20260808-101400', 'INIT_TOKEN_88921');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-1 text-xs text-violet-300 font-mono hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </button>
        <span className="text-xs font-mono text-gray-400">SMART QR VERIFICATION</span>
      </div>

      {/* 1. IDLE / SCANNING STATE */}
      {(scanState === 'IDLE' || scanState === 'SCANNING') && (
        <div className="glass-card p-6 border-violet-500/30 text-center space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Scan Lab PC Screen QR</h2>
            <p className="text-xs text-gray-400 mt-1">
              Point your phone camera at the active QR code displayed on the IdeaLab PC projector screen.
            </p>
          </div>

          {/* Camera Viewport */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-violet-500/40 bg-black/60 min-h-[260px] flex items-center justify-center">
            <div id="qr-reader-viewport" className="w-full h-full" />

            {scanState === 'IDLE' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-xs">
                <QrCode className="w-16 h-16 text-violet-400 mb-3 animate-pulse" />
                <button
                  onClick={startScanner}
                  className="px-6 py-3 rounded-xl bg-violet-600 text-white text-xs font-bold font-mono shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
                >
                  START CAMERA SCANNER
                </button>
              </div>
            )}

            {scanState === 'SCANNING' && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-1.5 rounded-full border border-violet-500/40 text-[11px] font-mono text-violet-300">
                Align QR inside the box
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. VERIFYING LOADING STATE */}
      {scanState === 'VERIFYING' && (
        <div className="glass-card p-10 text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-violet-400 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-white">Verifying Attendance...</h3>
          <p className="text-xs text-gray-400 font-mono">
            Validating cryptographically signed session token with backend database.
          </p>
        </div>
      )}

      {/* 3. ✓ ATTENDANCE MARKED SUCCESS SCREEN */}
      {scanState === 'SUCCESS' && resultRecord && (
        <div className="glass-card p-6 border-emerald-500/40 text-center space-y-6 neon-border-purple">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-emerald-400 font-mono">
              ✓ Attendance Marked Successfully
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              Your attendance has been recorded in the IdeaLab database.
            </p>
          </div>

          {/* Verification Badge Details */}
          <div className="glass-card p-4 text-left space-y-2.5 text-xs text-gray-200 border-white/10">
            <div className="flex justify-between pb-2 border-b border-white/10">
              <span className="text-gray-400 font-mono">NAME:</span>
              <span className="font-bold text-white">{resultRecord.studentName}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-white/10">
              <span className="text-gray-400 font-mono">SIC:</span>
              <span className="font-mono text-violet-300 font-bold">{resultRecord.studentId}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-white/10">
              <span className="text-gray-400 font-mono">BRANCH:</span>
              <span className="text-white">{resultRecord.branch}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-white/10">
              <span className="text-gray-400 font-mono">YEAR:</span>
              <span className="text-white">{resultRecord.year}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-white/10">
              <span className="text-gray-400 font-mono">LAB:</span>
              <span className="text-emerald-300 font-bold">{resultRecord.labName}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-white/10">
              <span className="text-gray-400 font-mono">ENTRY TIME:</span>
              <span className="font-mono text-cyan-300 font-bold">{resultRecord.entryTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-mono">STATUS:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                {resultRecord.status}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-bold font-mono text-xs shadow-lg"
          >
            OK • BACK TO DASHBOARD
          </button>
        </div>
      )}

      {/* 4. ❌ INVALID CODE SCREEN */}
      {scanState === 'INVALID' && (
        <div className="glass-card p-8 border-red-500/40 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-400 font-mono">❌ Invalid Code</h2>
            <p className="text-xs text-gray-300 mt-2">
              "{errorMessage || 'The QR code you scanned is not valid.'}"
            </p>
          </div>
          <button
            onClick={() => setScanState('IDLE')}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold font-mono text-xs shadow-lg"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* 5. ⏱ CODE EXPIRED SCREEN */}
      {scanState === 'EXPIRED' && (
        <div className="glass-card p-8 border-amber-500/40 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-400 font-mono">⏱ Code Expired</h2>
            <p className="text-xs text-gray-300 mt-2">
              This QR code is no longer valid. Please scan the new QR code displayed on the IdeaLab screen.
            </p>
          </div>
          <button
            onClick={() => setScanState('IDLE')}
            className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold font-mono text-xs shadow-lg"
          >
            SCAN AGAIN
          </button>
        </div>
      )}

      {/* 6. ✓ ALREADY MARKED SCREEN */}
      {scanState === 'ALREADY' && (
        <div className="glass-card p-8 border-violet-500/40 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/40 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-violet-300 font-mono">✓ Already Marked</h2>
            <p className="text-xs text-gray-300 mt-2">
              You have already marked your attendance for this session.
            </p>
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold font-mono text-xs shadow-lg"
          >
            OK
          </button>
        </div>
      )}

      {/* 7. SESSION NOT ACTIVE SCREEN */}
      {scanState === 'INACTIVE' && (
        <div className="glass-card p-8 border-cyan-500/40 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-cyan-300 font-mono">Session Not Active</h2>
            <p className="text-xs text-gray-300 mt-2">
              The attendance session is currently not active. Please ask your faculty to start a session.
            </p>
          </div>
          <button
            onClick={() => setScanState('IDLE')}
            className="w-full py-3 bg-cyan-600 text-white rounded-xl font-bold font-mono text-xs shadow-lg"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* 8. UNAUTHORIZED STUDENT SCREEN */}
      {scanState === 'UNAUTHORIZED' && (
        <div className="glass-card p-8 border-red-500/40 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-400 font-mono">Unauthorized Student</h2>
            <p className="text-xs text-gray-300 mt-2">
              You are not eligible for this attendance session.
            </p>
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full py-3 bg-gray-700 text-white rounded-xl font-bold font-mono text-xs"
          >
            BACK TO PROFILE
          </button>
        </div>
      )}
    </div>
  );
}
