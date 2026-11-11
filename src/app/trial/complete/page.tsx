import Link from 'next/link';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';

export default function TrialCompletePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-court-grass/10 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-net-dark mb-2">お申込みありがとうございます</h1>
        <p className="text-sm text-gray-500 mb-6">体験レッスンのお申込みを受け付けました。内容を確認の上、担当者よりご連絡いたします。</p>
        <Link href="/" className="inline-flex items-center gap-2 text-court-green hover:underline text-sm">
          <TennisBallIcon size={16} />
          トップページに戻る
        </Link>
      </div>
    </div>
  );
}
