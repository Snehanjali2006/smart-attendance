import React, { useRef, useState, useEffect } from 'react';
import { Camera, Check, RotateCcw, X, AlertTriangle } from 'lucide-react';

export default function StudentRegisterFace({ isOpen, onClose, onSave }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (isOpen && !stream && !previewData) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsStarting(true);
    setError('');
    setPreviewData(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please allow camera permissions.');
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera is still starting. Please wait a moment.');
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
    if (!dataUrl || dataUrl.length < 50) {
      setError('Could not capture a valid image. Please retake the photo.');
      return;
    }

    setPreviewData(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setPreviewData(null);
    startCamera();
  };

  const handleSave = () => {
    onSave(previewData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-orange-500" />
            Register Student Face
          </h2>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 hover:bg-white/10 rounded-full text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-start gap-3 w-full">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
            {previewData ? (
              <img src={previewData} alt="Captured Face" className="w-full h-full object-cover" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Face Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 sm:w-64 sm:h-80 border-4 border-orange-500/50 rounded-[40%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all"></div>
                </div>
                <div className="absolute top-6 left-0 right-0 text-center pointer-events-none">
                  <span className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10 shadow-lg">
                    Place face inside the frame
                  </span>
                </div>
                
                {isStarting && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white/70">
                    Starting camera...
                  </div>
                )}
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          {previewData ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Check className="w-5 h-5" /> Use This Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { stopCamera(); onClose(); }}
                className="px-5 py-2.5 text-white/70 hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={isStarting || error}
                className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <Camera className="w-5 h-5" /> Capture Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
