'use client';

import { useState } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "h-8 w-auto", showText = false }: LogoProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError || showText) {
    return (
      <div className={`flex items-center space-x-2 ${className.includes('h-') ? '' : 'h-8'}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        {showText && <span className="text-lg font-bold text-blue-600">SPYCE</span>}
      </div>
    );
  }

  return (
    <img 
      src="/spyce-logo-simple.svg" 
      alt="Spyce Intelligence" 
      className={className}
      onError={() => setImageError(true)}
    />
  );
} 