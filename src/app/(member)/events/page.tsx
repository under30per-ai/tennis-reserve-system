'use client';

import { useRouter } from 'next/navigation';
import useMyEvents from '@/hooks/useMyEvents';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { LEVEL_LABELS } from '@/lib/constants';

export default function MemberEventsPage() {
  const { upcomingEvents, loading } = useMyEvents();
  const router = useRouter();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-net-dark">イベント一覧</h1>

      {upcomingEvents.length === 0 ? (
        <EmptyState title="現在開催予定のイベントはありません" />
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="cursor-pointer" onClick={() => router.push(`/events/${event.id}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-net-gray">{event.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{event.eventDate} {event.startTime}〜{event.endTime}</p>
                </div>
                {event.targetLevel && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">{LEVEL_LABELS[event.targetLevel]}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">残り {event.availableSpots} / {event.maxParticipants}名</span>
                {event.fee > 0 && <span className="text-gray-500">参加費: ¥{event.fee.toLocaleString()}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
