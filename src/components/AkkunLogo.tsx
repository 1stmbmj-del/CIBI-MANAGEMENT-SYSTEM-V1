import React from 'react';

interface AkkunLogoProps {
  className?: string;
}

export default function AkkunLogo({ className = "h-11 w-auto" }: AkkunLogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 120 48" 
      className={className}
      id="akkun-vector-logo"
    >
      <g transform="translate(4, 4)">
        {/* Cube 1 (Left and bottom) */}
        <path d="M 12 20 L 20 16 L 28 20 L 20 24 Z" fill="#86efac" stroke="#15803d" strokeWidth="0.5" />
        <path d="M 12 20 L 20 24 L 20 32 L 12 28 Z" fill="#15803d" stroke="#15803d" strokeWidth="0.5" />
        <path d="M 20 24 L 28 20 L 28 28 L 20 32 Z" fill="#166534" stroke="#15803d" strokeWidth="0.5" />
        
        {/* Cube 2 (Right and bottom) */}
        <path d="M 28 20 L 36 16 L 44 20 L 36 24 Z" fill="#86efac" stroke="#15803d" strokeWidth="0.5" />
        <path d="M 28 20 L 36 24 L 36 32 L 28 28 Z" fill="#15803d" stroke="#15803d" strokeWidth="0.5" />
        <path d="M 36 24 L 44 20 L 44 28 L 36 32 Z" fill="#166534" stroke="#15803d" strokeWidth="0.5" />

        {/* Cube 3 (Center top) */}
        <path d="M 20 12 L 28 8 L 36 12 L 28 16 Z" fill="#4ade80" stroke="#15803d" strokeWidth="0.5" />
        <path d="M 20 12 L 28 16 L 28 24 L 20 20 Z" fill="#16a34a" stroke="#15803d" strokeWidth="0.5" />
        <path d="M 28 16 L 36 12 L 36 20 L 28 24 Z" fill="#15803d" stroke="#15803d" strokeWidth="0.5" />
      </g>
      <text x="50" y="22" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="900" fill="#15803d" letterSpacing="-0.8">AKKUN</text>
      <text x="50" y="32" fontFamily="Arial, Helvetica, sans-serif" fontSize="6.2" fontWeight="900" fill="#334155" letterSpacing="0.4">LENDING CORPORATION</text>
    </svg>
  );
}
