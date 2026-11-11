'use client';

import { useRouter } from 'next/navigation';
import useTrials from '@/hooks/useTrials';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { TRIAL_STATUS_LABELS, TRIAL_STATUS_COLORS, LEVEL_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { TrialStatus } from '@/types';

export default function TrialApplicationsPage() {
  const { applications, loading } = useTrials({ eagerLoad: true });
  const router = useRouter();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-net-dark">体験レッスン申込一覧</h2>

      {applications.length === 0 ? (
        <EmptyState title="体験レッスンの申込はありません" />
      ) : (
        <div className="space-y-3">
          {applications.map((a) => {
            const colors = TRIAL_STATUS_COLORS[a.status as TrialStatus];
            return (
              <Card key={a.id} className="cursor-pointer" onClick={() => router.push(`/admin/trials/${a.id}`)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-net-gray">{a.name} <span className="text-xs text-gray-400 font-normal ml-1">{a.nameKana}</span></p>
                    <p className="text-sm text-gray-500">{a.email} / {a.phone}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                    {TRIAL_STATUS_LABELS[a.status as TrialStatus]}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-sm text-gray-500">
                  <span>希望: {LEVEL_LABELS[a.preferredLevel]}</span>
                  <span>{a.preferredDate} {a.preferredTime}</span>
                  <span>申込日: {formatDate(a.createdAt, 'yyyy/MM/dd')}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
