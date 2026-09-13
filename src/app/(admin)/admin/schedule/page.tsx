'use client';

import { useState, useMemo } from 'react';
import { format, addWeeks, subWeeks } from 'date-fns';
import useLessonInstances from '@/hooks/useLessonInstances';
import useReservations from '@/hooks/useReservations';
import useMembers from '@/hooks/useMembers';
import useToast from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { LevelBadge } from '@/components/ui/Badge';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { getWeekDays, formatWeekRange } from '@/lib/calendar-utils';
import { DAY_LABELS, LEVEL_LABELS, CANCEL_REASONS, CANCEL_REASON_LABELS } from '@/lib/constants';
import { toISODateString } from '@/lib/utils';
import { LessonInstanceWithDetails } from '@/types';

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { getInstancesWithDetailsForDate, cancelInstance } = useLessonInstances();
  const { getReservationsForInstance } = useReservations();
  const { getMember } = useMembers();
  const toast = useToast();
  const [selectedInstance, setSelectedInstance] = useState<LessonInstanceWithDetails | null>(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonOther, setCancelReasonOther] = useState('');

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const participants = useMemo(() => {
    if (!selectedInstance) return [];
    const reservations = getReservationsForInstance(selectedInstance.id);
    return reservations.map(r => {
      const member = getMember(r.memberId);
      return { reservation: r, member };
    }).filter(p => p.member !== null);
  }, [selectedInstance, getReservationsForInstance, getMember]);

  const openInstance = (inst: LessonInstanceWithDetails) => {
    setSelectedInstance(inst);
    setShowCancelForm(false);
    setCancelReason('');
    setCancelReasonOther('');
  };

  const handleCancel = () => {
    if (!selectedInstance || !cancelReason) return;
    const reasonLabel = cancelReason === 'other'
      ? (cancelReasonOther.trim() || 'その他')
      : CANCEL_REASON_LABELS[cancelReason] ?? cancelReason;
    cancelInstance(selectedInstance.id, reasonLabel);
    toast.success('レッスンを中止にしました');
    setSelectedInstance(null);
    setShowCancelForm(false);
    setCancelReason('');
    setCancelReasonOther('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setCurrentDate(d => subWeeks(d, 1))}>← 前週</Button>
        <h2 className="font-bold text-net-dark text-sm sm:text-base">{formatWeekRange(currentDate)}</h2>
        <Button variant="ghost" onClick={() => setCurrentDate(d => addWeeks(d, 1))}>次週 →</Button>
      </div>

      {/* Desktop: grid view */}
      <div className="hidden sm:block overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-px bg-gray-200 rounded-lg overflow-hidden">
            <div className="bg-net-dark text-white p-2 text-center text-xs font-medium">時間/曜日</div>
            {weekDays.map((day, i) => (
              <div key={i} className={`bg-net-dark text-white p-2 text-center text-xs font-medium ${toISODateString(day) === toISODateString(new Date()) ? 'bg-court-green' : ''}`}>
                <p>{DAY_LABELS[day.getDay()]}</p>
                <p>{format(day, 'M/d')}</p>
              </div>
            ))}
            {weekDays.map((day, i) => {
              const instances = getInstancesWithDetailsForDate(toISODateString(day), true);
              return (
                <div key={i} className={`bg-white p-1 min-h-32 ${i === 0 ? 'col-start-2' : ''}`}>
                  {instances.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center mt-4">-</p>
                  ) : (
                    <div className="space-y-1">
                      {instances.map(inst => (
                        <div
                          key={inst.id}
                          onClick={() => openInstance(inst)}
                          className={`p-1.5 rounded text-xs border-l-3 cursor-pointer transition-opacity hover:opacity-80 ${
                            inst.isCancelled
                              ? 'bg-red-50 border-red-400 opacity-60'
                              : inst.lessonSlot.level === 'beginner' ? 'bg-green-50 border-green-400'
                              : inst.lessonSlot.level === 'intermediate' ? 'bg-blue-50 border-blue-400'
                              : inst.lessonSlot.level === 'advanced' ? 'bg-purple-50 border-purple-400'
                              : 'bg-orange-50 border-orange-400'
                          }`}
                        >
                          <p className={`font-medium truncate ${inst.isCancelled ? 'line-through text-red-400' : ''}`}>{inst.lessonSlot.title}</p>
                          <p className={inst.isCancelled ? 'text-red-400' : 'text-gray-500'}>{inst.startTime}-{inst.endTime}</p>
                          {inst.isCancelled ? (
                            <p className="text-red-500 font-medium">中止</p>
                          ) : (
                            <>
                              <p className="text-gray-400">{inst.coach.name}</p>
                              <p className="text-gray-400">{inst.currentBookings}/{inst.maxCapacity}名</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: list view */}
      <div className="sm:hidden space-y-4">
        {weekDays.map((day) => {
          const dateStr = toISODateString(day);
          const instances = getInstancesWithDetailsForDate(dateStr, true);
          const isToday = dateStr === toISODateString(new Date());
          return (
            <div key={dateStr}>
              <div className={`flex items-center gap-2 mb-2 ${isToday ? 'text-court-green' : 'text-net-gray'}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-court-green text-white' : 'bg-gray-100'}`}>
                  {format(day, 'd')}
                </span>
                <span className="text-sm font-medium">{DAY_LABELS[day.getDay()]}曜日</span>
                <span className="text-xs text-gray-400">{format(day, 'M月d日')}</span>
              </div>
              {instances.length === 0 ? (
                <p className="text-xs text-gray-400 ml-10">レッスンなし</p>
              ) : (
                <div className="ml-10 space-y-2">
                  {instances.map(inst => (
                    <Card
                      key={inst.id}
                      className={`cursor-pointer active:bg-gray-50 ${inst.isCancelled ? '!border-red-200 !bg-red-50/50' : ''}`}
                      onClick={() => openInstance(inst)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${inst.isCancelled ? 'line-through text-red-400' : 'text-net-gray'}`}>
                              {inst.lessonSlot.title}
                            </p>
                            <LevelBadge level={inst.lessonSlot.level} />
                            {inst.isCancelled && <Badge variant="error">中止</Badge>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {inst.startTime}-{inst.endTime} / {inst.coach.name}
                          </p>
                          {!inst.isCancelled && (
                            <p className="text-xs text-gray-400">{inst.court.name} / {inst.currentBookings}/{inst.maxCapacity}名</p>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Participants modal */}
      <Modal
        isOpen={!!selectedInstance}
        onClose={() => setSelectedInstance(null)}
        title="レッスン詳細"
        size="md"
      >
        {selectedInstance && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-net-gray">{selectedInstance.lessonSlot.title}</span>
                <LevelBadge level={selectedInstance.lessonSlot.level} />
                {selectedInstance.isCancelled && (
                  <Badge variant="error">中止</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {selectedInstance.date} {selectedInstance.startTime} - {selectedInstance.endTime}
              </p>
              <p className="text-sm text-gray-500">
                コーチ: {selectedInstance.coach.name} / {selectedInstance.court.name}
              </p>
              {selectedInstance.isCancelled && selectedInstance.cancelReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                  <p className="text-sm text-red-700">中止理由: {selectedInstance.cancelReason}</p>
                </div>
              )}
            </div>

            {!selectedInstance.isCancelled && (
              <div>
                <h3 className="text-sm font-bold text-net-gray mb-2">
                  参加者 ({participants.length}/{selectedInstance.maxCapacity}名)
                </h3>
                {participants.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3 text-center">参加者はいません</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {participants.map(({ reservation, member }) => (
                      <li key={reservation.id} className="flex items-center gap-3 py-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: member!.avatarColor }}
                        >
                          {member!.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-net-gray truncate">{member!.name}</p>
                          <p className="text-xs text-gray-400">{LEVEL_LABELS[member!.level]}</p>
                        </div>
                        <Badge variant={reservation.status === 'confirmed' ? 'success' : 'warning'}>
                          {reservation.status === 'confirmed' ? '確定' : 'キャンセル待ち'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {selectedInstance.isCancelled && participants.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-net-gray mb-2">
                  影響を受ける会員 ({participants.length}名)
                </h3>
                <ul className="divide-y divide-gray-100">
                  {participants.map(({ reservation, member }) => (
                    <li key={reservation.id} className="flex items-center gap-3 py-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: member!.avatarColor }}
                      >
                        {member!.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-net-gray truncate">{member!.name}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cancel lesson action */}
            {!selectedInstance.isCancelled && (
              <div className="border-t border-gray-200 pt-4">
                {!showCancelForm ? (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => setShowCancelForm(true)}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    レッスンを中止する
                  </Button>
                ) : (
                  <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-bold text-red-800">レッスン中止</p>
                    <p className="text-xs text-red-600">
                      中止すると予約済みの会員{participants.length > 0 ? `(${participants.length}名)` : ''}に通知されます。
                    </p>
                    <Select
                      label="中止理由"
                      value={cancelReason}
                      onChange={e => {
                        setCancelReason(e.target.value);
                        if (e.target.value !== 'other') setCancelReasonOther('');
                      }}
                      options={CANCEL_REASONS.map(r => ({ value: r.value, label: r.label }))}
                      placeholder="理由を選択してください"
                    />
                    {cancelReason === 'other' && (
                      <Input
                        label="理由の詳細"
                        value={cancelReasonOther}
                        onChange={e => setCancelReasonOther(e.target.value)}
                        placeholder="中止理由を入力..."
                      />
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowCancelForm(false);
                          setCancelReason('');
                          setCancelReasonOther('');
                        }}
                      >
                        戻る
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleCancel}
                        disabled={!cancelReason || (cancelReason === 'other' && !cancelReasonOther.trim())}
                      >
                        中止を確定する
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
