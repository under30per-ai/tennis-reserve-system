'use client';

import { useState, useMemo } from 'react';
import useReservations from '@/hooks/useReservations';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { LevelBadge } from '@/components/ui/Badge';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { RESERVATION_STATUS_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { ReservationStatus } from '@/types';

export default function ReservationsPage() {
  const { getAllWithDetails, cancelReservation } = useReservations();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const allReservations = getAllWithDetails();

  const filtered = useMemo(() => {
    let result = allReservations;
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.member.name.toLowerCase().includes(q) || r.lessonSlot.title.toLowerCase().includes(q));
    }
    return result;
  }, [allReservations, statusFilter, search]);

  const handleCancel = () => {
    if (cancelTarget) {
      cancelReservation(cancelTarget);
      toast.success('予約をキャンセルしました');
      setCancelTarget(null);
    }
  };

  const statusBadgeVariant = (status: ReservationStatus) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      case 'waitlisted': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="会員名・レッスン名で検索..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{ value: 'all', label: '全て' }, ...Object.entries(RESERVATION_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))]} className="sm:max-w-xs" placeholder={false} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="予約が見つかりません" />
        </Card>
      ) : (
        <>
          {/* Desktop: table */}
          <Card padding={false} className="hidden sm:block">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>会員</TableHead>
                  <TableHead>レッスン</TableHead>
                  <TableHead>日付</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </tr>
              </TableHeader>
              <tbody>
                {filtered.slice(0, 50).map(res => (
                  <TableRow key={res.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: res.member.avatarColor }}>{res.member.name.charAt(0)}</div>
                        <span className="text-sm">{res.member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{res.lessonSlot.title}</span>
                        <LevelBadge level={res.lessonSlot.level} />
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm">{formatDate(res.lessonInstance.date)}</span></TableCell>
                    <TableCell><span className="text-sm">{res.lessonInstance.startTime}</span></TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(res.status)}>
                        {RESERVATION_STATUS_LABELS[res.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {res.status === 'confirmed' && (
                        <Button variant="danger" size="sm" onClick={() => setCancelTarget(res.id)}>キャンセル</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Mobile: card list */}
          <div className="sm:hidden space-y-3">
            {filtered.slice(0, 50).map(res => (
              <Card key={res.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: res.member.avatarColor }}>
                      {res.member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-net-gray">{res.member.name}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs text-gray-500">{res.lessonSlot.title}</span>
                        <LevelBadge level={res.lessonSlot.level} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(res.lessonInstance.date)} {res.lessonInstance.startTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge variant={statusBadgeVariant(res.status)}>
                      {RESERVATION_STATUS_LABELS[res.status]}
                    </Badge>
                    {res.status === 'confirmed' && (
                      <Button variant="danger" size="sm" onClick={() => setCancelTarget(res.id)}>キャンセル</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel} title="予約キャンセル" message="この予約をキャンセルしてもよろしいですか？" variant="danger" confirmLabel="キャンセルする" />
    </div>
  );
}
