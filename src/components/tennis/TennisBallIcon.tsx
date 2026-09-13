'use client';

export default function TennisBallIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#CDDC39" stroke="#8BC34A" strokeWidth="2" />
      <path d="M 20 15 Q 50 45, 20 85" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 80 15 Q 50 45, 80 85" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
