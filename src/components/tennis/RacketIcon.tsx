'use client';

export default function RacketIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="35" rx="25" ry="30" fill="none" stroke="#2E7D32" strokeWidth="4" />
      <line x1="50" y1="65" x2="50" y2="95" stroke="#2E7D32" strokeWidth="5" strokeLinecap="round" />
      <line x1="35" y1="20" x2="35" y2="50" stroke="#2E7D32" strokeWidth="1.5" opacity="0.4" />
      <line x1="50" y1="8" x2="50" y2="62" stroke="#2E7D32" strokeWidth="1.5" opacity="0.4" />
      <line x1="65" y1="20" x2="65" y2="50" stroke="#2E7D32" strokeWidth="1.5" opacity="0.4" />
      <line x1="28" y1="25" x2="72" y2="25" stroke="#2E7D32" strokeWidth="1.5" opacity="0.4" />
      <line x1="26" y1="35" x2="74" y2="35" stroke="#2E7D32" strokeWidth="1.5" opacity="0.4" />
      <line x1="28" y1="45" x2="72" y2="45" stroke="#2E7D32" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}
