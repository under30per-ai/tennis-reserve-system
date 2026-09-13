'use client';

export default function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-court-grass/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-court-green animate-spin" />
      </div>
    </div>
  );
}
