import React from 'react';

interface SmartSchoolLogoProps {
  className?: string;
  variant?: 'full' | 'mark-only' | 'horizontal';
  inverted?: boolean; // For dark backgrounds
  height?: number | string;
}

export const SmartSchoolLogo: React.FC<SmartSchoolLogoProps> = ({
  className = '',
  variant = 'full',
  inverted = false,
  height = 48,
}) => {
  const brandRed = '#C62828';
  const textColor = inverted ? '#FFFFFF' : '#C62828';

  if (variant === 'mark-only') {
    return (
      <svg
        viewBox="0 0 280 200"
        style={{ height }}
        className={`shrink-0 ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="The Smart School Logo Mark"
      >
        {/* Outer border */}
        <rect x="10" y="10" width="170" height="170" rx="6" stroke="#C62828" strokeWidth="8" fill="none" />
        <rect x="20" y="20" width="150" height="150" rx="3" stroke="#C62828" strokeWidth="2.5" fill="none" />
        {/* Left red solid block */}
        <rect x="24" y="24" width="142" height="142" fill="#C62828" />
        {/* Red arc on the right outside white area */}
        <path d="M 166 40 A 58 58 0 0 1 224 135 A 60 60 0 0 1 216 148" stroke="#C62828" strokeWidth="15" strokeLinecap="round" />
        {/* White loop inside red area */}
        <path d="M 166 40 A 58 58 0 0 0 110 95 A 58 58 0 0 0 166 150" stroke="#FFFFFF" strokeWidth="15" strokeLinecap="round" />
        {/* Inner white circle and 'a' */}
        <circle cx="166" cy="95" r="36" stroke="#FFFFFF" strokeWidth="11" fill="none" />
        <text x="151" y="112" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="40" fill="#FFFFFF">a</text>
        <path d="M 183 80 L 183 120" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 490 280"
        style={{ height }}
        className="w-auto shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="The Smart School — Tomorrow is our Destiny"
      >
        {/* LEFT MARK */}
        {/* Outer red square border */}
        <rect x="12" y="20" width="168" height="168" rx="6" stroke="#C62828" strokeWidth="7" fill="none" />
        <rect x="20" y="28" width="152" height="152" rx="3" stroke="#C62828" strokeWidth="2.5" fill="none" />
        
        {/* Left solid red fill */}
        <path d="M 23 31 L 170 31 L 170 177 L 23 177 Z" fill="#C62828" />

        {/* Right outer arc in red */}
        <path d="M 170 41 A 56 56 0 0 1 226 132 A 58 58 0 0 1 218 145" stroke="#C62828" strokeWidth="15" strokeLinecap="round" />
        
        {/* Left outer arc in white */}
        <path d="M 170 41 A 56 56 0 0 0 116 95 A 56 56 0 0 0 170 149" stroke="#FFFFFF" strokeWidth="15" strokeLinecap="round" />
        
        {/* Inner circle in white */}
        <circle cx="170" cy="95" r="35" stroke="#FFFFFF" strokeWidth="11" fill="none" />
        
        {/* Inner letter 'a' */}
        <text x="155" y="111" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="38" fill="#FFFFFF">a</text>
        <path d="M 186 79 L 186 118" stroke="#FFFFFF" strokeWidth="7.5" strokeLinecap="round" />

        {/* RIGHT TYPOGRAPHY */}
        <g style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 700 }}>
          <text x="246" y="68" fontSize="50" fill={textColor}>The</text>
          <text x="246" y="125" fontSize="52" fill={textColor}>Smart</text>
          <text x="246" y="180" fontSize="52" fill={textColor}>School</text>
        </g>

        {/* HORIZONTAL RULE */}
        <line x1="12" y1="204" x2="475" y2="204" stroke="#C62828" strokeWidth="4.5" />

        {/* MOTTO */}
        <text
          x="14"
          y="232"
          fontFamily="'Montserrat', system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="24"
          letterSpacing="0.6"
          fill={textColor}
        >
          Tomorrow is our Destiny
        </text>

        {/* A Project of The City School */}
        <text
          x="14"
          y="258"
          fontFamily="'Playfair Display', Georgia, cursive, serif"
          fontStyle="italic"
          fontWeight="600"
          fontSize="18"
          fill={inverted ? '#93C5FD' : '#1E40AF'}
        >
          A Project of The City School
        </text>
      </svg>
    </div>
  );
};
