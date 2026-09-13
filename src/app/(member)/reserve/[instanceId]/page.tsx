'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import useLessonInstances from '@/hooks/useLessonInstances';
import useReservations from '@/hooks/useReservations';
import useMembers from '@/hooks/useMembers';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LevelBadge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NetDivider from '@/components/tennis/NetDivider';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import { formatDate, getAvailabilityLabel } from '@/lib/utils';
import { DAY_LABELS } from '@/lib/constants';

export default function ReserveConfirmPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const instanceId = params.instanceId as string;
  const fromInstanceId = searchParams.get('fromInstanceId');
  const isTransferMode = !!fromInstanceId;
  const router = useRouter();
  const { user } = useAuth();
  const { getInstanceWithDetails } = useLessonInstances();
  const { makeReservation, transferReservation } = useReservations();
  const { getMember } = useMembers();
  const toast = useToast();

  const member = user?.memberId ? getMember(user.memberId) : null;
  const transferDisabled = isTransferMode && (!member || member.remainingTransfers <= 0);

  const instance = getInstanceWithDetails(instanceId);

  if (!instance) return <LoadingSpinner />;

  const avail = getAvailabilityLabel(instance.availableSpots, instance.maxCapacity);
  const isFull = instance.availableSpots <= 0;
  const dayOfWeek = new Date(instance.date).getDay();

  const handleReserve = () => {
    if (!user?.memberId) return;
    try {
      if (isTransferMode) {
        transferReservation(user.memberId, fromInstanceId, instanceId);
        toast.success('振替が完了しました');
        router.push('/transfer');
      } else {
        const res = makeReservation(user.memberId, instanceId);
        if (res.status === 'waitlisted') {
          toast.warning('キャンセル待ちとして登録されました');
        } else {
          toast.success('予約が確定しました');
        }
        router.push('/reserve/complete');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isTransferMode ? '振替に失敗しました' : '予約に失敗しました'));
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card>
        <div className="text-center mb-4">
          <TennisBallIcon size={48} className="mx-auto mb-2" />
          <CardTitle>{isTransferMode ? '振替確認' : '予約確認'}</CardTitle>
        </div>

        <NetDivider className="!my-4" />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">レッスン</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{instance.lessonSlot.title}</span>
              <LevelBadge level={instance.lessonSlot.level} />
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">日付</span>
            <span className="font-medium">{formatDate(instance.date, 'yyyy年M月d日')}（{DAY_LABELS[dayOfWeek]}）</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">時間</span>
            <span className="font-medium">{instance.startTime} - {instance.endTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">コーチ</span>
            <span className="font-medium">{instance.coach.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">コート</span>
            <span className="font-medium">{instance.court.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">空き状況</span>
            <span className={`font-medium ${avail.color}`}>{avail.label}</span>
          </div>
        </div>

        <NetDivider className="!my-4" />

        {isFull && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800 font-medium">定員に達しています</p>
            <p className="text-xs text-yellow-600">キャンセル待ちとして登録されます</p>
          </div>
        )}

        {transferDisabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">振替回数の上限に達しています</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleReserve} disabled={transferDisabled}>
            {isTransferMode ? '振替を確定する' : isFull ? 'キャンセル待ちに登録' : '予約を確定する'}
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>戻る</Button>
        </div>
      </Card>
    </div>
  );
}
