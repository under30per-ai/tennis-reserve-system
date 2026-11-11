'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useTrials from '@/hooks/useTrials';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { TRIAL_STATUS_LABELS, TRIAL_STATUS_COLORS, LEVEL_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { TrialApplication, TrialStatus } from '@/types';

export default function TrialDetailPage() {
  const { getTrial, updateTrialStatus } = useTrials();
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [application, setApplication] = useState<TrialApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    getTrial(id).then((a) => {
      setApplication(a);
      setAdminNotes(a?.adminNotes ?? '');
      setLoading(false);
    });
  }, [id, getTrial]);

  const handleStatusUpdate = async (status: TrialStatus) => {
    try {
      await updateTrialStatus(id, status, adminNotes);
      const updated = await getTrial(id);
      setApplication(updated);
      toast.success('ステータスを更新しました');
    } catch {
      toast.error('更新に失敗しました');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!application) return <p className="text-gray-500">申込が見つかりません</p>;

  const colors = TRIAL_STATUS_COLORS[application.status as TrialStatus];

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>← 戻る</Button>

      <Card>
        <div className="flex items-start justify-between mb-4">
          <CardTitle>体験レッスン申込詳細</CardTitle>
          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {TRIAL_STATUS_LABELS[application.status as TrialStatus]}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">氏名:</span> <span className="font-medium">{application.name}</span></div>
          <div><span className="text-gray-500">フリガナ:</span> <span className="font-medium">{application.nameKana}</span></div>
          <div><span className="text-gray-500">メール:</span> <span className="font-medium">{application.email}</span></div>
          <div><span className="text-gray-500">電話:</span> <span className="font-medium">{application.phone}</span></div>
          <div><span className="text-gray-500">希望レベル:</span> <span className="font-medium">{LEVEL_LABELS[application.preferredLevel]}</span></div>
          <div><span className="text-gray-500">希望日時:</span> <span className="font-medium">{application.preferredDate} {application.preferredTime}</span></div>
          <div className="sm:col-span-2"><span className="text-gray-500">申込日:</span> <span className="font-medium">{formatDate(application.createdAt, 'yyyy/MM/dd HH:mm')}</span></div>
          {application.message && (
            <div className="sm:col-span-2"><span className="text-gray-500">メッセージ:</span> <p className="mt-1 bg-gray-50 p-3 rounded-lg">{application.message}</p></div>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>審査</CardTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-net-gray mb-1">管理者メモ</label>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleStatusUpdate('approved')}>承認</Button>
            <Button variant="danger" onClick={() => handleStatusUpdate('rejected')}>不承認</Button>
            <Button variant="secondary" onClick={() => handleStatusUpdate('completed')}>完了</Button>
            <Button variant="ghost" onClick={() => handleStatusUpdate('no_show')}>未参加</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
