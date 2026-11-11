'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import useMyEvents from '@/hooks/useMyEvents';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { LEVEL_LABELS } from '@/lib/constants';
import type { EventWithDetails } from '@/types';

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const { getEvent, registerForEvent, cancelRegistration, myRegistrations } = useMyEvents();
  const toast = useToast();
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getEvent(id).then((e) => { setEvent(e); setLoading(false); });
  }, [id, getEvent]);

  if (loading) return <LoadingSpinner />;
  if (!event) return <p className="text-gray-500">イベントが見つかりません</p>;

  const myReg = myRegistrations.find(
    (r) => r.eventId === id && (r.status === 'registered' || r.status === 'waitlisted')
  );

  const handleRegister = async () => {
    setSubmitting(true);
    try {
      await registerForEvent(id);
      const updated = await getEvent(id);
      setEvent(updated);
      toast.success('イベントに申込みました');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '申込に失敗しました');
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    if (!myReg) return;
    setSubmitting(true);
    try {
      await cancelRegistration(myReg.id);
      const updated = await getEvent(id);
      setEvent(updated);
      toast.success('申込をキャンセルしました');
    } catch {
      toast.error('キャンセルに失敗しました');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between mb-2">
          <CardTitle>{event.title}</CardTitle>
          {event.targetLevel && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">{LEVEL_LABELS[event.targetLevel]}</span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm mt-4">
          <div><span className="text-gray-500">日時:</span> {event.eventDate} {event.startTime}〜{event.endTime}</div>
          {event.court && <div><span className="text-gray-500">コート:</span> {event.court.name}</div>}
          <div><span className="text-gray-500">参加状況:</span> {event.currentParticipants} / {event.maxParticipants}名</div>
          {event.fee > 0 && <div><span className="text-gray-500">参加費:</span> ¥{event.fee.toLocaleString()}</div>}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500 whitespace-pre-wrap">{event.description}</p>
        </div>

        <div className="mt-6">
          {myReg ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-green-600 font-medium">
                {myReg.status === 'registered' ? '参加登録済み' : 'キャンセル待ち中'}
              </span>
              <Button variant="danger" size="sm" onClick={handleCancel} disabled={submitting}>キャンセル</Button>
            </div>
          ) : event.availableSpots > 0 ? (
            <Button onClick={handleRegister} disabled={submitting}>
              {submitting ? '処理中...' : '参加申込'}
            </Button>
          ) : (
            <Button onClick={handleRegister} disabled={submitting} variant="secondary">
              {submitting ? '処理中...' : 'キャンセル待ちで申込'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
