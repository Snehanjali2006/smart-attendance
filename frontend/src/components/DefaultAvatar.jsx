import React from 'react';
import { User } from 'lucide-react';

export default function DefaultAvatar({ size = 40 }) {
  return (
    <div 
      className="flex items-center justify-center bg-gray-700/30 rounded-full flex-shrink-0" 
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      title="Photo Not Uploaded"
    >
      <User className="text-gray-400" style={{ width: size * 0.6, height: size * 0.6 }} />
    </div>
  );
}
