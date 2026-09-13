'use client';

export default function CourtIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 300 160" className="w-full max-w-md" xmlns="http://www.w3.org/2000/svg">
        {/* Background surround */}
        <rect width="300" height="160" fill="#2E7D32" rx="8" />
        {/* Court surface */}
        <rect x="25" y="15" width="250" height="130" fill="#4CAF50" />
        {/* Doubles court outline */}
        <rect x="25" y="15" width="250" height="130" fill="none" stroke="white" strokeWidth="2" />
        {/* Singles sidelines */}
        <line x1="25" y1="31" x2="275" y2="31" stroke="white" strokeWidth="1.5" />
        <line x1="25" y1="129" x2="275" y2="129" stroke="white" strokeWidth="1.5" />
        {/* Service lines */}
        <line x1="83" y1="31" x2="83" y2="129" stroke="white" strokeWidth="1.5" />
        <line x1="217" y1="31" x2="217" y2="129" stroke="white" strokeWidth="1.5" />
        {/* Center service lines */}
        <line x1="83" y1="80" x2="150" y2="80" stroke="white" strokeWidth="1.5" />
        <line x1="150" y1="80" x2="217" y2="80" stroke="white" strokeWidth="1.5" />
        {/* Center marks on baselines */}
        <line x1="25" y1="80" x2="31" y2="80" stroke="white" strokeWidth="1.5" />
        <line x1="269" y1="80" x2="275" y2="80" stroke="white" strokeWidth="1.5" />
        {/* Net */}
        <line x1="150" y1="10" x2="150" y2="150" stroke="white" strokeWidth="2.5" strokeOpacity="0.7" />
        {/* Net posts */}
        <circle cx="150" cy="10" r="2.5" fill="#555" />
        <circle cx="150" cy="150" r="2.5" fill="#555" />
        {/* Tennis ball */}
        <circle cx="185" cy="100" r="6" fill="#CDDC39" stroke="#8BC34A" strokeWidth="0.8" />
        <path d="M181.5,95.5 Q185,100 181.5,104.5" stroke="white" strokeWidth="0.8" fill="none" />
        <path d="M188.5,95.5 Q185,100 188.5,104.5" stroke="white" strokeWidth="0.8" fill="none" />
      </svg>
    </div>
  );
}
