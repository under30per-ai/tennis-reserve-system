'use client';

export default function CourtBackground({ className = '', opacity = 0.08 }: { className?: string; opacity?: number }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} style={{ opacity }}>
      <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        {/* Court surface */}
        <rect x="20" y="10" width="360" height="180" fill="#4CAF50" stroke="white" strokeWidth="3" rx="2" />
        {/* Singles sidelines */}
        <line x1="20" y1="32.5" x2="380" y2="32.5" stroke="white" strokeWidth="2" />
        <line x1="20" y1="167.5" x2="380" y2="167.5" stroke="white" strokeWidth="2" />
        {/* Service lines */}
        <line x1="103" y1="32.5" x2="103" y2="167.5" stroke="white" strokeWidth="2" />
        <line x1="297" y1="32.5" x2="297" y2="167.5" stroke="white" strokeWidth="2" />
        {/* Center service lines */}
        <line x1="103" y1="100" x2="200" y2="100" stroke="white" strokeWidth="2" />
        <line x1="200" y1="100" x2="297" y2="100" stroke="white" strokeWidth="2" />
        {/* Center marks on baselines */}
        <line x1="20" y1="100" x2="28" y2="100" stroke="white" strokeWidth="2" />
        <line x1="372" y1="100" x2="380" y2="100" stroke="white" strokeWidth="2" />
        {/* Net */}
        <line x1="200" y1="5" x2="200" y2="195" stroke="white" strokeWidth="3" />
      </svg>
    </div>
  );
}
