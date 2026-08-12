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

// Haversine Distance Calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = degrees => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// TGPCET College coordinates
const IDEA_LAB_LAT = 20.960705;
const IDEA_LAB_LNG = 79.014667;
const ALLOWED_RADIUS = 500;

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
  const [locationStatus, setLocationStatus] = useState('IDLE'); 
  const [locationInfo, setLocationInfo] = useState({ lat: null, lng: null, accuracy: null, distance: null });
  const [locationErrorMsg, setLocationErrorMsg] = useState('');

  // GPS Multi-Reading State
  const [gpsReadings, setGpsReadings] = useState([]);
  const [readingCount, setReadingCount] = useState(0);
  const watchIdRef = useRef(null);
  const scanTimerRef = useRef(null);
  const gpsReadingsRef = useRef([]);

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
      // Cleanup GPS watch and timer
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }
    };
  }, []);

  // Diagnostics for video element
  useEffect(() => {
    if (step === 'CAMERA') {
      console.log("Camera component mounted / step changed to CAMERA");
      console.log("Video element:", videoRef.current);
    }
  }, [step]);

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
      setCameraError(`Camera access requires HTTPS on mobile.\nCurrent connection: ${window.location.protocol.toUpperCase().replace(':', '')}\nRequired: HTTPS`);
      setDebugInfo(prev => ({ ...prev, permission: 'DENIED (Insecure)' }));
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported by this browser.');
      setDebugInfo(prev => ({ ...prev, permission: 'DENIED (Unsupported)' }));
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setCameraError('Video element not mounted.');
      return;
    }
    console.log("Video element found before starting:", video);

    const constraints = forceFallback 
      ? { video: true, audio: false }
      : { 
          video: { 
            facingMode: { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: false 
        };

    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        if (!forceFallback && err.name !== 'NotAllowedError') {
          console.log('First camera attempt failed, trying fallback...', err);
          startCamera(true);
          return;
        }
        throw err;
      }
      setStream(mediaStream);
      console.log("Camera stream obtained:", mediaStream);

      const tracks = mediaStream.getVideoTracks();
      const trackInfo = tracks.length > 0 ? `${tracks[0].readyState} (${tracks.length} tracks)` : 'NO TRACKS';
      setDebugInfo(prev => ({ ...prev, permission: 'GRANTED', streamActive: 'ACTIVE', trackState: trackInfo }));

      video.srcObject = mediaStream;

      // Wait for loadedmetadata THEN wait for an actual rendered frame
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(() => {
            console.log("Video playback started");
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
        errorMsg = 'Camera permission was denied. Please allow camera access.\n\nAndroid Chrome:\nSite Settings → Camera → Allow\n\niPhone Safari:\nWebsite Settings → Camera → Allow';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera was found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'The camera is currently being used by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMsg = 'Preferred camera is unavailable. Trying another camera.';
      } else if (error.name === 'SecurityError') {
        errorMsg = 'Camera access is blocked because this page is not secure.';
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
    setLocationStatus('IDLE');
  };

  // LOCATION STEP — Multi-reading GPS with watchPosition
  const stopGpsScan = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  };

  const classifyLocation = (reading) => {
    const distance = calculateDistance(reading.latitude, reading.longitude, IDEA_LAB_LAT, IDEA_LAB_LNG);
    const accuracy = reading.accuracy;

    setLocationInfo({ lat: reading.latitude, lng: reading.longitude, accuracy, distance });

    // Clearly inside: even worst-case position is within radius
    if (distance + accuracy < ALLOWED_RADIUS) {
      setLocationStatus('INSIDE_LAB');
      return;
    }

    // Clearly outside: even best-case position is outside radius
    if (distance - accuracy > ALLOWED_RADIUS) {
      setLocationStatus('OUTSIDE_LAB');
      return;
    }

    // Boundary overlap — uncertain
    setLocationStatus('UNCERTAIN');
  };

  const finalizeBestReading = () => {
    stopGpsScan();
    const readings = gpsReadingsRef.current;

    if (readings.length === 0) {
      setLocationErrorMsg('Could not obtain any GPS reading. Please ensure Location/GPS is enabled and try again.');
      setLocationStatus('POSITION_UNAVAILABLE');
      return;
    }

    // Select reading with smallest accuracy value (most precise)
    const best = readings.reduce((bestSoFar, current) =>
      current.accuracy < bestSoFar.accuracy ? current : bestSoFar
    );

    classifyLocation(best);
  };

  const getLocation = () => {
    // Reset state
    stopGpsScan();
    setLocationStatus('SCANNING');
    setLocationErrorMsg('');
    setLocationInfo({ lat: null, lng: null, accuracy: null, distance: null });
    setGpsReadings([]);
    setReadingCount(0);
    gpsReadingsRef.current = [];

    if (!navigator.geolocation) {
      setLocationErrorMsg('Location is not supported by this browser.');
      setLocationStatus('POSITION_UNAVAILABLE');
      return;
    }

    if (!window.isSecureContext) {
      setLocationErrorMsg('Location verification requires a secure HTTPS connection on mobile.');
      setLocationStatus('POSITION_UNAVAILABLE');
      return;
    }

    const MAX_READINGS = 5;
    const MAX_SCAN_MS = 30000; // 30 seconds
    const GOOD_ACCURACY_THRESHOLD = 30; // Stop early if accuracy is excellent

    const handlePosition = (position) => {
      const reading = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };

      gpsReadingsRef.current = [...gpsReadingsRef.current, reading];
      const currentReadings = gpsReadingsRef.current;
      setGpsReadings([...currentReadings]);
      setReadingCount(currentReadings.length);

      // Update display with best reading so far
      const bestSoFar = currentReadings.reduce((best, cur) =>
        cur.accuracy < best.accuracy ? cur : best
      );
      const dist = calculateDistance(bestSoFar.latitude, bestSoFar.longitude, IDEA_LAB_LAT, IDEA_LAB_LNG);
      setLocationInfo({ lat: bestSoFar.latitude, lng: bestSoFar.longitude, accuracy: bestSoFar.accuracy, distance: dist });

      // Stop early if we got excellent accuracy
      if (bestSoFar.accuracy <= GOOD_ACCURACY_THRESHOLD) {
        stopGpsScan();
        classifyLocation(bestSoFar);
        return;
      }

      // Stop after MAX_READINGS
      if (currentReadings.length >= MAX_READINGS) {
        finalizeBestReading();
        return;
      }
    };

    const handleError = (error) => {
      // If we already have some readings, don't fail — we'll use what we have
      if (gpsReadingsRef.current.length > 0) {
        return;
      }

      stopGpsScan();
      if (error.code === 1) {
        setLocationStatus('PERMISSION_DENIED');
      } else if (error.code === 2) {
        setLocationErrorMsg('Your device could not determine your current location.\n\n• Turn ON GPS/Location\n• Move to an open area\n• Check phone location settings');
        setLocationStatus('POSITION_UNAVAILABLE');
      } else if (error.code === 3) {
        setLocationErrorMsg('Location detection timed out. Please try again.');
        setLocationStatus('TIMEOUT');
      } else {
        setLocationErrorMsg('An unknown error occurred while getting location.');
        setLocationStatus('POSITION_UNAVAILABLE');
      }
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    // Maximum scan duration — use best available after 30 seconds
    scanTimerRef.current = setTimeout(() => {
      if (watchIdRef.current !== null) {
        finalizeBestReading();
      }
    }, MAX_SCAN_MS);
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
      latitude: locationInfo.lat,
      longitude: locationInfo.lng,
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
              <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl whitespace-pre-line">
                {cameraError}
              </div>
            )}

            {/* DEBUG UI */}
            <div className="text-left bg-black/50 p-3 rounded-lg border border-gray-700 text-[10px] text-green-400 font-mono space-y-1">
              <div>Video element: {videoRef.current ? 'CONNECTED' : 'NOT CONNECTED'}</div>
              <div>Camera permission: {debugInfo.permission}</div>
              <div>Camera stream: {debugInfo.streamActive}</div>
              <div>Video ready: {debugInfo.videoReady}</div>
              <div>Video width: {debugInfo.videoWidth}</div>
              <div>Video height: {debugInfo.videoHeight}</div>
              <div>Secure context: {debugInfo.secureContext}</div>
              <div>Track state: {debugInfo.trackState}</div>
              <div>Captured image size: {debugInfo.capturedBytes} bytes</div>
            </div>

            {/* LIVE VIDEO CONTAINER — always rendered if no captured photo */}
            {!photoDataUrl && (
              <div className="relative mt-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', maxWidth: '500px', height: 'auto', minHeight: '250px', objectFit: 'cover', display: 'block', background: '#000' }}
                  className="rounded-2xl border-2 border-violet-500/50 mx-auto"
                />
                
                {stream ? (
                  <>
                    {cameraReady ? (
                      <div className="absolute top-2 left-2 bg-emerald-500/80 text-white text-[10px] font-bold px-2 py-1 rounded">✓ CAMERA READY</div>
                    ) : (
                      <div className="absolute top-2 left-2 bg-orange-500/80 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">CAMERA STARTING...</div>
                    )}
                    
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={!cameraReady}
                        className={`py-3 px-6 font-bold text-xs rounded-full shadow-lg w-full ${cameraReady ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-600 text-gray-300 opacity-50 cursor-not-allowed'}`}
                      >
                        [ CAPTURE PHOTO ]
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 text-center py-4">
                    <p className="text-xs text-gray-400 mb-4">Camera status: WAITING FOR START</p>
                    <button type="button" onClick={() => startCamera(false)} className="w-full py-3 bg-cyan-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                      <Camera className="w-5 h-5" /> [ START CAMERA ]
                    </button>
                  </div>
                )}
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
              <MapPin className="w-5 h-5 text-cyan-400" /> LOCATION VERIFICATION
            </h2>

            {locationStatus === 'IDLE' && (
              <div className="space-y-4">
                <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
                  <p className="text-cyan-300 font-bold text-sm">Your location is required to mark attendance.</p>
                </div>
                <button onClick={getLocation} className="w-full py-3 bg-cyan-600 text-white font-bold rounded-xl">
                  [ CHECK MY LOCATION ]
                </button>
              </div>
            )}

            {locationStatus === 'SCANNING' && (
              <div className="p-6 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-4">
                <Navigation className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                <p className="text-cyan-300 font-bold text-sm">📍 VERIFYING YOUR LOCATION</p>
                <p className="text-xs text-gray-400">Finding your current GPS location...</p>
                
                <div className="p-3 bg-black/40 border border-cyan-500/20 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reading:</span>
                    <span className="text-cyan-300 font-bold">{readingCount}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">GPS accuracy:</span>
                    <span className="text-cyan-300 font-bold">
                      {locationInfo.accuracy !== null ? `${Math.round(locationInfo.accuracy)} m` : 'Waiting...'}
                    </span>
                  </div>
                  {locationInfo.accuracy !== null && locationInfo.accuracy > 200 && (
                    <p className="text-orange-300 text-[10px] mt-1">
                      GPS accuracy is currently low. We are trying to get a better location...
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                  <div 
                    className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((readingCount / 5) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500">Please wait for GPS to stabilize...</p>
              </div>
            )}

            {locationStatus === 'PERMISSION_DENIED' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl">
                  <h3 className="text-red-400 font-bold text-sm mb-2">📍 Location Permission Required</h3>
                  <p className="text-red-300 text-xs">Please allow location access for this website.</p>
                  <p className="text-red-300 text-xs mt-2">Please allow Location permission in your browser settings. Then return to this page and try again.</p>
                </div>
                <button onClick={getLocation} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl">
                  [ TRY AGAIN ]
                </button>
              </div>
            )}

            {(locationStatus === 'POSITION_UNAVAILABLE' || locationStatus === 'TIMEOUT') && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-950/40 border border-orange-500/30 text-orange-300 text-xs rounded-xl whitespace-pre-line text-left">
                  {locationErrorMsg}
                </div>
                <button onClick={getLocation} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl">
                  [ TRY AGAIN ]
                </button>
              </div>
            )}

            {locationStatus === 'UNCERTAIN' && (
              <div className="space-y-4">
                <div className="p-4 bg-black/50 border border-gray-700 rounded-xl text-left text-xs space-y-2">
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white font-bold">📍 Location detected</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">GPS accuracy:</span>
                    <span className="text-white font-bold">{Math.round(locationInfo.accuracy)} m</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">Distance from TGPCET:</span>
                    <span className="text-white font-bold">{locationInfo.distance} m</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">Allowed distance:</span>
                    <span className="text-white font-bold">{ALLOWED_RADIUS} m</span>
                  </div>
                </div>
                <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                  <h3 className="text-amber-400 font-bold text-sm">📍 Location accuracy is not sufficient</h3>
                  <p className="text-amber-300 text-xs mt-1">Your location is near the attendance boundary. Please wait for a more accurate GPS reading.</p>
                </div>
                <button onClick={getLocation} className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl">
                  [ TRY AGAIN ]
                </button>
              </div>
            )}

            {(locationStatus === 'INSIDE_LAB' || locationStatus === 'OUTSIDE_LAB') && (
              <div className="space-y-4">
                <div className="p-4 bg-black/50 border border-gray-700 rounded-xl text-left text-xs space-y-2">
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white font-bold">✓ Location detected</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">GPS accuracy:</span>
                    <span className="text-white font-bold">{Math.round(locationInfo.accuracy)} m</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">Distance from TGPCET:</span>
                    <span className="text-white font-bold">{locationInfo.distance} m</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">Allowed distance:</span>
                    <span className="text-white font-bold">{ALLOWED_RADIUS} m</span>
                  </div>
                </div>

                {locationStatus === 'INSIDE_LAB' ? (
                  <>
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                      <h3 className="text-emerald-400 font-bold text-sm">✓ YOU ARE PRESENT IN TGPCET</h3>
                      <p className="text-emerald-300 text-xs mt-1">You can continue with attendance verification.</p>
                    </div>
                    <button onClick={() => setStep('CODE')} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">
                      [ CONTINUE ]
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl">
                      <h3 className="text-red-400 font-bold text-sm">❌ YOU ARE NOT PRESENT IN TGPCET</h3>
                      <p className="text-red-300 text-xs mt-1">Move within 500 meters of TGPCET.</p>
                    </div>
                    <button onClick={getLocation} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl">
                      [ CHECK LOCATION AGAIN ]
                    </button>
                  </>
                )}
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
