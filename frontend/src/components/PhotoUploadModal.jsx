import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { apiUpload } from '../utils/api';

export default function PhotoUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  endpoint,
  title = "Upload Profile Photo" 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB.');
      return;
    }

    // Validate type
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setError('Please upload a valid image (JPEG, PNG, WebP).');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('photo', selectedFile);

    const res = await apiUpload(endpoint, 'PATCH', formData);
    
    setUploading(false);

    if (res.success) {
      onSuccess(res.photo);
      handleClear();
      onClose();
    } else {
      setError(res.message || 'Failed to upload photo.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="glass-card max-w-md w-full p-6 border-indigo-500/40 relative font-mono">
        <button
          onClick={() => { handleClear(); onClose(); }}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            ⚠️ {error}
          </div>
        )}

        {!previewUrl ? (
          <div 
            className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400/50 hover:bg-white/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="text-gray-300 text-sm font-bold">Click to select an image</p>
            <p className="text-gray-500 text-xs mt-1">JPEG, PNG, WebP (Max 2MB)</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider font-bold">Preview</p>
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-white/10"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={uploading}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-xs"
              >
                Retake / Choose Another
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30"
              >
                {uploading ? 'Saving...' : 'Save Photo'}
              </button>
            </div>
          </div>
        )}

        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
        />
      </div>
    </div>
  );
}
