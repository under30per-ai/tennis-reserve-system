'use client';

export default function NetDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`relative my-6 ${className}`}>
      <div className="h-0.5 bg-court-green" />
      <div
        className="h-3 opacity-15"
        style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, #2E7D32 0px, #2E7D32 1px, transparent 1px, transparent 8px),
            repeating-linear-gradient(0deg, #2E7D32 0px, #2E7D32 1px, transparent 1px, transparent 6px)
          `,
        }}
      />
      <div className="h-0.5 bg-court-green/30" />
    </div>
  );
}
