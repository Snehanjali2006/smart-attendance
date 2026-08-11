import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import {
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  ArrowLeft,
  RefreshCcw,
  Navigation
} from 'lucide-react';
import BackgroundParticles from '../components/BackgroundParticles';

export default function AttendanceVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const sessionId = searchParams.get('session') || '';
  const token = searchParams.get('token') || '';

  // Wizard Steps: LOGIN -> CAMERA -> LOCATION -> CODE -> RESULT
  const [step, setStep] = useState(user ? 'CAMERA' : 'LOGIN');

  // Login Form
  const [studentIdInput, setStudentIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [studentCategory, setStudentCategory] = useState('SIC');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Camera State
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  
  // Debug State
  const [debugInfo, setDebugInfo] = useState({
    permission: 'UNKNOWN',
    streamActive: 'INACTIVE',
    videoReady: 'NO',
    videoWidth: 0,
    videoHeight: 0,
    secureContext: window.isSecureContext ? 'YES' : 'NO',
    trackState: 'NONE',
    capturedBytes: 0
  });

  // Location State
  const [location, setLocation] = useState(null); // { lat, lng }
  const [locationError, setLocationError] = useState('');

  // Code Entry State
  const [enteredCode, setEnteredCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Result State
  const [verifyState, setVerifyState] = useState('IDLE'); 
  const [resultRecord, setResultRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [distanceInfo, setDistanceInfo] = useState(null);

  // Keep streamRef in sync
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // Stop camera when component unmounts or leaves camera step
  useEffect(() => {
    if (step !== 'CAMERA' && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraReady(false);
      setDebugInfo(prev => ({ ...prev, streamActive: 'INACTIVE', videoReady: 'NO', trackState: 'STOPPED' }));
    }
  }, [step, stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // LOGIN STEP
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
        setLoginError('Only student accounts can mark attendance.');
        return;
      }
      login(res.user, res.token);
      setStep('CAMERA');
    } else {
      setLoginError(res.message || 'Login failed.');
    }
  };

  // CAMERA STEP
  const startCamera = async (forceFallback = false) => {
    setCameraError('');
    setPhotoDataUrl('');
    setCameraReady(false);
    
    const isSecure = window.isSecureContext;
    setDebugInfo(prev => ({ ...prev, secureContext: isSecure ? 'YES' : 'NO', permission: 'REQUESTING...', trackState: 'NONE', capturedBytes: 0 }));

    if (!isSecure) {
      setCameraError('Camera requires HTTPS or localhost.');
      setDebugInfo(prev => ({ ...prev, permission: 'DENIED (Insecure)' }));
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported by this browser.');
      setDebugInfo(prev => ({ ...prev, permission: 'DENIED (Unsupported)' }));
      return;
    }

    const constraints = forceFallback 
      ? { video: true, audio: false }
      : { 
          video: { 
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: false 
        };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      const tracks = mediaStream.getVideoTracks();
      const trackInfo = tracks.length > 0 ? `${tracks[0].readyState} (${tracks.length} tracks)` : 'NO TRACKS';
      setDebugInfo(prev => ({ ...prev, permission: 'GRANTED', streamActive: 'ACTIVE', trackState: trackInfo }));

      const video = videoRef.current;
      if (!video) {
        setCameraError('Video element not found.');
        return;
      }

      video.srcObject = mediaStream;

      // Wait for loadedmetadata THEN wait for an actual rendered frame
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(() => {
            const w = video.videoWidth;
            const h = video.videoHeight;
            setDebugInfo(prev => ({ ...prev, videoWidth: w, videoHeight: h, videoReady: (w > 0 && h > 0) ? 'METADATA' : 'NO' }));

            // Now wait for an actual painted frame
            if (typeof video.requestVideoFrameCallback === 'function') {
              // Best method: wait for browser to paint a real frame
              video.requestVideoFrameCallback(() => {
                setDebugInfo(prev => ({ ...prev, videoReady: 'YES (frame callback)' }));
                setCameraReady(true);
                resolve();
              });
            } else {
              // Fallback: wait 500ms after play for frame to render
              setTimeout(() => {
                setDebugInfo(prev => ({ ...prev, videoReady: 'YES (timeout fallback)' }));
                setCameraReady(true);
                resolve();
              }, 500);
            }
          }).catch(reject);
        };
        video.onerror = reject;
      });

    } catch (error) {
      console.error('Camera error:', error);
      
      let errorMsg = `Failed to open camera: ${error.message || error.name}`;
      setDebugInfo(prev => ({ ...prev, permission: 'DENIED', streamActive: 'ERROR: ' + error.name }));

      if (error.name === 'NotAllowedError') {
        errorMsg = 'Camera permission denied.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera found.';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Camera is being used by another application.';
      } else if (error.name === 'OverconstrainedError' && !forceFallback) {
        console.log('Retrying camera without specific constraints...');
        startCamera(true);
        return;
      } else if (error.name === 'SecurityError') {
        errorMsg = 'Camera requires a secure HTTPS connection.';
      } else if (error.name === 'AbortError') {
        errorMsg = 'Camera could not be started. Please try again.';
      }
      
      setCameraError(errorMsg);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;

    if (!video) {
      setCameraError('Video element not found.');
      return;
    }

    if (!video.srcObject) {
      setCameraError('Camera stream not available.');
      return;
    }

    // Check track is actually live
    const tracks = video.srcObject.getVideoTracks();
    console.log('Track info:', tracks.map(t => ({ enabled: t.enabled, readyState: t.readyState, settings: t.getSettings() })));
    if (tracks.length === 0 || tracks[0].readyState !== 'live') {
      setCameraError('Camera track is not live. Please restart camera.');
      setDebugInfo(prev => ({ ...prev, trackState: tracks.length > 0 ? tracks[0].readyState : 'NO TRACKS' }));
      return;
    }

    if (video.readyState < 2) {
      setCameraError('Video is not ready. readyState=' + video.readyState);
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Invalid video dimensions: ' + video.videoWidth + 'x' + video.videoHeight);
      return;
    }

    // Create a NEW canvas (not a hidden DOM one which can fail on mobile)
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      setCameraError('Canvas context unavailable.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.92);

    console.log('Captured image length:', imageData.length, 'Canvas:', canvas.width, 'x', canvas.height);

    if (!imageData || !imageData.startsWith('data:image/jpeg') || imageData.length < 5000) {
      setCameraError('Invalid/blank captured image. Length=' + imageData.length);
      setDebugInfo(prev => ({ ...prev, capturedBytes: imageData.length }));
      return;
    }

    // Validate image loads correctly
    const testImg = new Image();
    testImg.onload = () => {
      console.log('Validated image dimensions:', testImg.width, 'x', testImg.height);
      if (testImg.width === 0 || testImg.height === 0) {
        setCameraError('Captured image has zero dimensions.');
        return;
      }
      setDebugInfo(prev => ({ ...prev, capturedBytes: imageData.length, videoWidth: video.videoWidth, videoHeight: video.videoHeight }));
      setPhotoDataUrl(imageData);
    };
    testImg.onerror = () => {
      setCameraError('Captured image failed to load as valid image.');
    };
    testImg.src = imageData;
  };

  const retakePhoto = () => {
    setPhotoDataUrl('');
    setCameraError('');
    // Stream was kept alive during capture, so just clear the preview
    if (!stream) {
      startCamera();
    }
  };

  const usePhoto = () => {
    if (!photoDataUrl) {
      setCameraError('No photo captured yet.');
      return;
    }
    // NOW stop the stream safely
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStep('LOCATION');
    getLocation();
  };

  // LOCATION STEP
  const getLocation = () => {
    setLocationError('');
    setLocation(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setTimeout(() => setStep('CODE'), 1500); // Small delay to show "Got location"
      },
      (error) => {
        setLocationError('Location access denied or unavailable. Please allow location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // FINAL SUBMIT (CODE STEP)
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!enteredCode) {
      setErrorMessage('Please enter the number.');
      setVerifyState('INVALID_CODE');
      setStep('RESULT');
      return;
    }

    setVerifying(true);
    setErrorMessage('');

    const res = await apiRequest('/attendance/verify', 'POST', {
      sessionId,
      token,
      code: enteredCode,
      deviceInfo: 'Mobile Web Browser',
      latitude: location.lat,
      longitude: location.lng,
      photo: photoDataUrl
    });
    
    setVerifying(false);
    setStep('RESULT');

    if (res.success && res.record) {
      setResultRecord(res.record);
      setVerifyState('SUCCESS');
    } else {
      setErrorMessage(res.message || 'Verification failed.');
      const code = res.errorCode;
      if (code === 'OUTSIDE_GEOFENCE') {
        setVerifyState('GEOFENCE_FAILED');
        setDistanceInfo({ distance: res.distance, allowed: res.allowedRadius });
      }
      else if (code === 'INVALID_CODE') setVerifyState('INVALID_CODE');
      else if (code === 'EXPIRED_TOKEN') setVerifyState('EXPIRED');
      else if (code === 'ALREADY_MARKED') setVerifyState('ALREADY');
      else if (code === 'SESSION_INACTIVE') setVerifyState('INACTIVE');
      else if (code === 'UNAUTHORIZED') setVerifyState('UNAUTHORIZED');
      else if (code === 'FACE_MISMATCH') setVerifyState('FACE_MISMATCH');
      else if (code === 'NO_FACE_DETECTED') setVerifyState('NO_FACE_DETECTED');
      else if (code === 'MULTIPLE_FACES_DETECTED') setVerifyState('MULTIPLE_FACES_DETECTED');
      else if (code === 'FACE_NOT_REGISTERED') setVerifyState('FACE_NOT_REGISTERED');
      else setVerifyState('INVALID_CODE');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden font-mono">
      <BackgroundParticles />

      <div className="w-full max-w-md glass-card p-6 md:p-8 border-violet-500/30 neon-border-purple z-10 shadow-2xl relative">
        <div className="text-center mb-6">
          <img src="/aicte-logo.jpg" alt="AICTE IDEALab Logo" className="w-12 h-12 object-contain rounded-2xl mx-auto shadow-lg shadow-violet-500/30 mb-3 bg-white p-1" />
          <h1 className="text-xl font-black text-white tracking-tight">
            ATTENDANCE VERIFICATION
          </h1>
        </div>

        {/* STEP 1: LOGIN */}
        {step === 'LOGIN' && (
          <div className="space-y-5">
            <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-xl text-center">
              <span className="text-[11px] text-violet-300 font-bold block">
                🔒 LOGIN TO CONTINUE
              </span>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleMobileLogin} className="space-y-4 text-xs">
              <div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button type="button" onClick={() => setStudentCategory('SIC')} className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all border ${studentCategory === 'SIC' ? 'bg-violet-600/30 border-violet-500 text-white shadow-md' : 'bg-white/5 border-white/10 text-gray-400'}`}>SIC</button>
                  <button type="button" onClick={() => setStudentCategory('SC')} className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all border ${studentCategory === 'SC' ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md' : 'bg-white/5 border-white/10 text-gray-400'}`}>SC</button>
                </div>
                <input
                  type="text" required value={studentIdInput} onChange={(e) => setStudentIdInput(e.target.value)}
                  placeholder="Student ID / SIC"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white mb-4 focus:outline-none focus:border-violet-500"
                />
                <input
                  type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <button type="submit" disabled={loginLoading} className="w-full py-3 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-lg hover:opacity-95 flex justify-center gap-2">
                {loginLoading ? 'Authenticating...' : 'CONTINUE'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: CAMERA */}
        {step === 'CAMERA' && (
          <div className="space-y-4 text-center">
            <span className="text-[10px] text-gray-400 tracking-wider">ATTENDANCE CAMERA</span>
            <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-violet-400" /> LIVE CAMERA PREVIEW
            </h2>

            {cameraError && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl">
                {cameraError}
              </div>
            )}

            {/* START CAMERA BUTTON — only when no stream and no captured photo */}
            {!photoDataUrl && !stream && (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400 mb-4">Camera status: WAITING FOR START</p>
                <button onClick={() => startCamera(false)} className="w-full py-3 bg-cyan-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5" /> [ START CAMERA ]
                </button>
              </div>
            )}

            {/* DEBUG UI */}
            <div className="text-left bg-black/50 p-3 rounded-lg border border-gray-700 text-[10px] text-green-400 font-mono space-y-1">
              <div>Camera permission: {debugInfo.permission}</div>
              <div>Camera stream: {debugInfo.streamActive}</div>
              <div>Video ready: {debugInfo.videoReady}</div>
              <div>Video width: {debugInfo.videoWidth}</div>
              <div>Video height: {debugInfo.videoHeight}</div>
              <div>Secure context: {debugInfo.secureContext}</div>
              <div>Track state: {debugInfo.trackState}</div>
              <div>Captured image size: {debugInfo.capturedBytes} bytes</div>
            </div>

            {/* LIVE VIDEO — stream active, no captured photo yet */}
            {!photoDataUrl && stream && (
              <div className="relative mt-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                  className="rounded-2xl border-2 border-violet-500/50 bg-black"
                />
                
                {cameraReady ? (
                  <div className="absolute top-2 left-2 bg-emerald-500/80 text-white text-[10px] font-bold px-2 py-1 rounded">✓ CAMERA READY</div>
                ) : (
                  <div className="absolute top-2 left-2 bg-orange-500/80 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">CAMERA STARTING...</div>
                )}
                
                <div className="mt-4 text-center">
                  <button
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className={`py-3 px-6 font-bold text-xs rounded-full shadow-lg w-full ${cameraReady ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-600 text-gray-300 opacity-50 cursor-not-allowed'}`}
                  >
                    [ CAPTURE PHOTO ]
                  </button>
                </div>
              </div>
            )}

            {/* CAPTURED PHOTO PREVIEW */}
            {photoDataUrl && (
              <div className="mt-4 space-y-4">
                <p className="text-[10px] text-emerald-400 font-bold">CAPTURED PHOTO:</p>
                <img src={photoDataUrl} alt="Captured attendance photo" className="w-full rounded-2xl border-2 border-emerald-500/50" style={{ objectFit: 'cover' }} />
                <div className="flex gap-2">
                  <button onClick={retakePhoto} className="flex-1 py-3 bg-white/10 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> [ RETAKE ]
                  </button>
                  <button onClick={usePhoto} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                    [ USE THIS PHOTO ]
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: LOCATION */}
        {step === 'LOCATION' && (
          <div className="space-y-6 text-center">
            <span className="text-[10px] text-gray-400 tracking-wider">Step 2 of 3</span>
            <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" /> Location Verification
            </h2>

            {locationError ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl">
                  {locationError}
                </div>
                <button onClick={getLocation} className="w-full py-3 bg-cyan-600 text-white font-bold rounded-xl">
                  TRY AGAIN
                </button>
              </div>
            ) : location ? (
              <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-emerald-300 font-bold text-sm">Location Secured</p>
              </div>
            ) : (
              <div className="p-6 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-4">
                <Navigation className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                <p className="text-cyan-300 font-bold text-sm">Getting your current location...</p>
                <p className="text-xs text-gray-400">Please allow location access if prompted.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: CODE ENTRY */}
        {step === 'CODE' && (
          <div className="space-y-6 text-center">
            <span className="text-[10px] text-gray-400 tracking-wider">Final Step</span>
            <h2 className="text-lg font-bold text-white">Lab Verification Code</h2>
            
            <form onSubmit={handleVerifySubmit} className="space-y-5">
              <div className="p-4 bg-white/5 border border-violet-500/30 rounded-2xl">
                <p className="text-[10px] text-gray-400 mb-2">Enter the number displayed on the Lab PC:</p>
                <input
                  type="text" maxLength={4} required autoFocus
                  value={enteredCode} onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder="__"
                  className="w-32 bg-slate-900 border-2 border-violet-500 rounded-xl px-4 py-3 text-center text-4xl font-black text-white tracking-widest focus:outline-none focus:border-cyan-400 font-mono mx-auto"
                />
              </div>

              <button type="submit" disabled={verifying || !enteredCode} className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-500 text-white text-xs font-bold rounded-xl">
                {verifying ? 'Verifying...' : 'VERIFY & MARK ATTENDANCE'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 5: RESULT */}
        {step === 'RESULT' && (
          <div className="text-center space-y-6">
            
            {/* SUCCESS */}
            {verifyState === 'SUCCESS' && resultRecord && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-emerald-400">✓ ATTENDANCE MARKED</h2>
                </div>
                <div className="glass-card p-4 text-left space-y-2 text-[10px] text-gray-200">
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-gray-400">STUDENT:</span><span className="font-bold">{resultRecord.studentName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-gray-400">DISTANCE:</span><span className="text-cyan-300 font-bold">{resultRecord.distance}m (Verified)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-gray-400">ENTRY TIME:</span><span className="text-white">{resultRecord.entryTime}</span>
                  </div>
                </div>
                <button onClick={() => navigate('/student/dashboard')} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs">
                  GO TO DASHBOARD
                </button>
              </>
            )}

            {/* GEOFENCE FAILED */}
            {verifyState === 'GEOFENCE_FAILED' && distanceInfo && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-400">❌ ATTENDANCE NOT ALLOWED</h2>
                  <p className="text-xs text-gray-300 mt-2">You are outside the IdeaLab attendance area.</p>
                </div>
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-left text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-gray-400">Your distance:</span><span className="text-white font-bold">{distanceInfo.distance} meters</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Max allowed:</span><span className="text-white font-bold">{distanceInfo.allowed} meters</span></div>
                </div>
                <button onClick={() => setStep('LOCATION')} className="w-full py-3 bg-white/10 text-white rounded-xl font-bold text-xs">
                  RETRY LOCATION VERIFICATION
                </button>
              </>
            )}

            {/* FACE NOT REGISTERED */}
            {verifyState === 'FACE_NOT_REGISTERED' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-10 h-10 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-400">❌ FACE NOT REGISTERED</h2>
                  <p className="text-xs text-gray-300 mt-2">{errorMessage}</p>
                </div>
                <Link to="/student" className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold w-full text-xs text-center mt-4">
                  RETURN TO DASHBOARD
                </Link>
              </>
            )}

            {/* FACE MISMATCH */}
            {verifyState === 'FACE_MISMATCH' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-400">❌ FACE MISMATCH</h2>
                  <p className="text-xs text-gray-300 mt-2">{errorMessage}</p>
                </div>
                <button onClick={() => setStep('CAMERA')} className="w-full mt-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs">
                  TRY AGAIN (RETAKE PHOTO)
                </button>
              </>
            )}

            {/* NO FACE DETECTED / MULTIPLE FACES */}
            {(verifyState === 'NO_FACE_DETECTED' || verifyState === 'MULTIPLE_FACES_DETECTED') && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 mx-auto flex items-center justify-center">
                  {verifyState === 'NO_FACE_DETECTED' ? <Camera className="w-10 h-10 text-orange-400" /> : <UserCheck className="w-10 h-10 text-orange-400" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-orange-400">
                    ⚠ {verifyState === 'NO_FACE_DETECTED' ? 'NO FACE DETECTED' : 'MULTIPLE FACES DETECTED'}
                  </h2>
                  <p className="text-xs text-gray-300 mt-2">{errorMessage}</p>
                </div>
                <button onClick={() => setStep('CAMERA')} className="w-full mt-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs">
                  RETAKE PHOTO
                </button>
              </>
            )}

            {/* OTHER ERRORS (INVALID CODE / EXPIRED / ALREADY MARKED) */}
            {['INVALID_CODE', 'EXPIRED', 'ALREADY', 'INACTIVE', 'UNAUTHORIZED'].includes(verifyState) && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 mx-auto flex items-center justify-center">
                  {verifyState === 'ALREADY' ? <CheckCircle2 className="w-10 h-10 text-violet-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-400">
                    {verifyState === 'INVALID_CODE' && '❌ INVALID CODE'}
                    {verifyState === 'EXPIRED' && '⏱ EXPIRED QR'}
                    {verifyState === 'ALREADY' && '✓ ALREADY MARKED'}
                    {(verifyState === 'INACTIVE' || verifyState === 'UNAUTHORIZED') && '❌ NOT ALLOWED'}
                  </h2>
                  <p className="text-xs text-gray-300 mt-2">{errorMessage}</p>
                </div>
                <button
                  onClick={() => verifyState === 'INVALID_CODE' ? setStep('CODE') : navigate('/student/dashboard')}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-all"
                >
                  {verifyState === 'INVALID_CODE' ? 'TRY AGAIN' : 'GO TO DASHBOARD'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
