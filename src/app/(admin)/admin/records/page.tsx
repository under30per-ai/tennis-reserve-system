'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { startOfWeek, endOfWeek, addWeeks, format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import useLessonInstances from '@/hooks/useLessonInstances';
import useLessonRecords from '@/hooks/useLessonRecords';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { LevelBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';
import { DAY_LABELS } from '@/lib/constants';

export default function RecordsPage() {
  const router = useRouter();
  const { instances, getInstanceWithDetails } = useLessonInstances();
  const { getRecordForInstance } = useLessonRecords();
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const { weekStart, weekEnd, weekLabel } = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset);
    const ws = startOfWeek(base, { weekStartsOn: 1 });
    const we = endOfWeek(base, { weekStartsOn: 1 });
    return {
      weekStart: ws,
      weekEnd: we,
      weekLabel: `${format(ws, 'M/d', { locale: ja })} - ${format(we, 'M/d', { locale: ja })}`,
    };
  }, [weekOffset]);

  const weekInstances = useMemo(() => {
    const wsStr = format(weekStart, 'yyyy-MM-dd');
    const weStr = format(weekEnd, 'yyyy-MM-dd');
    return instances
      .filter(i => i.date >= wsStr && i.date <= weStr && !i.isCancelled)
      .map(i => {
        const details = getInstanceWithDetails(i.id);
        const record = getRecordForInstance(i.id);
        return { instance: i, details, record };
      })
      .filter(item => item.details !== null)
      .sort((a, b) => {
        const dateCompare = a.instance.date.localeCompare(b.instance.date);
        if (dateCompare !== 0) return dateCompare;
        return a.instance.startTime.localeCompare(b.instance.startTime);
      });
  }, [instances, weekStart, weekEnd, getInstanceWithDetails, getRecordForInstance]);

  // Search results: when searching, show all instances matching the query across all dates
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();

    return instances
      .filter(i => !i.isCancelled)
      .map(i => {
        const details = getInstanceWithDetails(i.id);
        const record = getRecordForInstance(i.id);
        return { instance: i, details, record };
      })
      .filter(item => {
        if (!item.details) return false;
        const lessonTitle = item.details.lessonSlot.title.toLowerCase();
        const coachName = item.details.coach.name.toLowerCase();
        const theme = item.record?.theme?.toLowerCase() || '';
        const content = item.record?.content?.toLowerCase() || '';
        return lessonTitle.includes(q) || coachName.includes(q) || theme.includes(q) || content.includes(q);
      })
      .sort((a, b) => {
        const dateCompare = b.instance.date.localeCompare(a.instance.date);
        if (dateCompare !== 0) return dateCompare;
        return a.instance.startTime.localeCompare(b.instance.startTime);
      });
  }, [searchQuery, instances, getInstanceWithDetails, getRecordForInstance]);

  const isSearching = searchQuery.trim().length > 0;
  const displayItems = isSearching ? (searchResults ?? []) : weekInstances;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-net-gray">レッスン記録</h1>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:max-w-sm">
          <Input
            placeholder="レッスン名・コーチ名・テーマ・内容で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Week navigation - hidden during search */}
      {!isSearching && (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w - 1)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <span className="text-sm font-medium text-net-gray min-w-[100px] text-center">{weekLabel}</span>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(w => w + 1)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>今週</Button>
          )}
        </div>
      )}

      {isSearching && (
        <p className="text-sm text-gray-500">検索結果: {displayItems.length}件</p>
      )}

      {displayItems.length === 0 ? (
        <Card>
          <EmptyState title={isSearching ? '検索結果がありません' : 'この週のレッスンはありません'} />
        </Card>
      ) : (
        <>
          {/* Desktop: table */}
          <Card padding={false} className="hidden sm:block">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>日付</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>レッスン</TableHead>
                  <TableHead>コーチ</TableHead>
                  <TableHead>コート</TableHead>
                  <TableHead>記録</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </tr>
              </TableHeader>
              <tbody>
                {displayItems.map(({ instance, details, record }) => {
                  if (!details) return null;
                  const date = parseISO(instance.date);
                  const dayLabel = DAY_LABELS[date.getDay()];
                  return (
                    <TableRow
                      key={instance.id}
                      onClick={() => router.push(`/admin/records/${instance.id}`)}
                    >
                      <TableCell>
                        <span className="text-sm">
                          {format(date, 'M/d', { locale: ja })}({dayLabel})
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{instance.startTime} - {instance.endTime}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{details.lessonSlot.title}</span>
                          <LevelBadge level={details.lessonSlot.level} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{details.coach.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{details.court.name}</span>
                      </TableCell>
                      <TableCell>
                        {record ? (
                          <Badge variant="success">記録あり</Badge>
                        ) : (
                          <Badge variant="default">未記録</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={record ? 'outline' : 'primary'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/records/${instance.id}`);
                          }}
                        >
                          {record ? '編集' : '記録する'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </Card>

          {/* Mobile: card list */}
          <div className="sm:hidden space-y-3">
            {displayItems.map(({ instance, details, record }) => {
              if (!details) return null;
              const date = parseISO(instance.date);
              const dayLabel = DAY_LABELS[date.getDay()];
              return (
                <Card
                  key={instance.id}
                  className="cursor-pointer active:bg-gray-50"
                  onClick={() => router.push(`/admin/records/${instance.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3 min-w-0">
                      <div className="text-center flex-shrink-0">
                        <p className="text-sm font-bold text-court-green">
                          {format(date, 'M/d', { locale: ja })}
                        </p>
                        <p className="text-xs text-gray-400">{dayLabel}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-net-gray">{details.lessonSlot.title}</p>
                          <LevelBadge level={details.lessonSlot.level} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {instance.startTime}-{instance.endTime} / {details.coach.name}
                        </p>
                        <p className="text-xs text-gray-400">{details.court.name}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {record ? (
                        <Badge variant="success">記録あり</Badge>
                      ) : (
                        <Badge variant="default">未記録</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
