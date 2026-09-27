'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, parseISO } from 'date-fns';
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
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { DAY_LABELS } from '@/lib/constants';
import { LessonInstanceWithDetails, LessonRecord } from '@/types';

interface DisplayItem {
  instance: LessonInstanceWithDetails;
  record: LessonRecord | null;
}

export default function RecordsPage() {
  const router = useRouter();
  const { getInstancesWithDetailsForDateRange } = useLessonInstances();
  const { getRecordForInstance } = useLessonRecords();
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

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

  const [weekInstances, setWeekInstances] = useState<DisplayItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    const wsStr = format(weekStart, 'yyyy-MM-dd');
    const weStr = format(weekEnd, 'yyyy-MM-dd');
    getInstancesWithDetailsForDateRange(wsStr, weStr).then(async allInstances => {
      if (cancelled) return;
      const items = await Promise.all(
        allInstances.map(async inst => {
          const record = await getRecordForInstance(inst.id);
          return { instance: inst, record };
        })
      );
      if (!cancelled) {
        setWeekInstances(items);
        setDataLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [weekStart, weekEnd, getInstancesWithDetailsForDateRange, getRecordForInstance]);

  // Search results: when searching, fetch a broad range and filter
  const [searchResults, setSearchResults] = useState<DisplayItem[] | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    let cancelled = false;
    const q = searchQuery.toLowerCase();
    const searchFrom = format(subWeeks(new Date(), 52), 'yyyy-MM-dd');
    const searchTo = format(addWeeks(new Date(), 4), 'yyyy-MM-dd');
    getInstancesWithDetailsForDateRange(searchFrom, searchTo).then(async allInstances => {
      if (cancelled) return;
      const items = await Promise.all(
        allInstances.map(async inst => {
          const record = await getRecordForInstance(inst.id);
          return { instance: inst, record };
        })
      );
      if (!cancelled) {
        setSearchResults(
          items
            .filter(item => {
              const lessonTitle = item.instance.lessonSlot.title.toLowerCase();
              const coachName = item.instance.coach.name.toLowerCase();
              const theme = item.record?.theme?.toLowerCase() || '';
              const content = item.record?.content?.toLowerCase() || '';
              return lessonTitle.includes(q) || coachName.includes(q) || theme.includes(q) || content.includes(q);
            })
            .sort((a, b) => {
              const dateCompare = b.instance.date.localeCompare(a.instance.date);
              if (dateCompare !== 0) return dateCompare;
              return a.instance.startTime.localeCompare(b.instance.startTime);
            })
        );
      }
    });
    return () => { cancelled = true; };
  }, [searchQuery, getInstancesWithDetailsForDateRange, getRecordForInstance]);

  const isSearching = searchQuery.trim().length > 0;
  const displayItems = isSearching ? (searchResults ?? []) : weekInstances;

  if (!isSearching && dataLoading) return <LoadingSpinner />;

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
            onChange={e => { setSearchQuery(e.target.value); if (!e.target.value.trim()) setSearchResults(null); }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults(null); }}
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
                {displayItems.map(({ instance, record }) => {
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
                          <span className="text-sm">{instance.lessonSlot.title}</span>
                          <LevelBadge level={instance.lessonSlot.level} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{instance.coach.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{instance.court.name}</span>
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
            {displayItems.map(({ instance, record }) => {
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
                          <p className="text-sm font-medium text-net-gray">{instance.lessonSlot.title}</p>
                          <LevelBadge level={instance.lessonSlot.level} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {instance.startTime}-{instance.endTime} / {instance.coach.name}
                        </p>
                        <p className="text-xs text-gray-400">{instance.court.name}</p>
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
