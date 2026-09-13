'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import useMembers from '@/hooks/useMembers';
import useLessonRecords from '@/hooks/useLessonRecords';
import useMemberKarte from '@/hooks/useMemberKarte';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { LevelBadge } from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  LEVEL_LABELS,
  MEMBERSHIP_LABELS,
  DAY_LABELS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
} from '@/lib/constants';
import { Member, LessonLevel, MembershipType } from '@/types';
import clsx from 'clsx';

type Tab = 'profile' | 'history' | 'analysis';

export default function MemberDetailPage() {
  const { getMember, updateMember } = useMembers();
  const { getMemberLessonHistory } = useLessonRecords();
  const { summary, isGenerating, generateKarte } = useMemberKarte();
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;

  const [member, setMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  useEffect(() => {
    const m = getMember(memberId);
    if (m) setMember(m);
  }, [memberId, getMember]);

  const history = useMemo(() => getMemberLessonHistory(memberId), [memberId, getMemberLessonHistory]);

  if (!member) return <LoadingSpinner />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMember(memberId, member);
    toast.success('会員情報を更新しました');
    router.push('/admin/members');
  };

  const handleGenerate = () => {
    generateKarte(member, history);
  };

  const trendLabels = { improving: '上昇傾向', stable: '安定', declining: '停滞気味' };
  const trendColors = { improving: 'text-green-600', stable: 'text-blue-600', declining: 'text-orange-600' };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'プロフィール' },
    { key: 'history', label: 'レッスン履歴' },
    { key: 'analysis', label: 'AI分析' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.push('/admin/members')}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </Button>
      </div>

      {/* Member info card */}
      <Card>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: member.avatarColor }}
          >
            {member.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-net-gray">{member.name}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <LevelBadge level={member.level} />
              <span className="text-sm text-gray-500">{MEMBERSHIP_LABELS[member.membershipType]}</span>
              <span className="text-sm text-gray-500">記録: {history.length}件</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-court-green text-court-green'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <Card>
            <CardTitle>会員編集</CardTitle>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="氏名" value={member.name} onChange={e => setMember(m => m ? { ...m, name: e.target.value } : m)} required />
                <Input label="フリガナ" value={member.nameKana} onChange={e => setMember(m => m ? { ...m, nameKana: e.target.value } : m)} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="メールアドレス" type="email" value={member.email} onChange={e => setMember(m => m ? { ...m, email: e.target.value } : m)} required />
                <Input label="電話番号" value={member.phone} onChange={e => setMember(m => m ? { ...m, phone: e.target.value } : m)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="レベル" value={member.level} onChange={e => setMember(m => m ? { ...m, level: e.target.value as LessonLevel } : m)} options={Object.entries(LEVEL_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                <Select label="会員種別" value={member.membershipType} onChange={e => setMember(m => m ? { ...m, membershipType: e.target.value as MembershipType } : m)} options={Object.entries(MEMBERSHIP_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="ステータス" value={member.isActive ? 'active' : 'inactive'} onChange={e => setMember(m => m ? { ...m, isActive: e.target.value === 'active' } : m)} options={[{ value: 'active', label: 'アクティブ' }, { value: 'inactive', label: '休会中' }]} />
                <Input label="振替残回数" type="number" value={String(member.remainingTransfers)} onChange={e => setMember(m => m ? { ...m, remainingTransfers: parseInt(e.target.value) || 0 } : m)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit">更新</Button>
                <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <>
          {history.length === 0 ? (
            <Card>
              <EmptyState title="レッスン記録がありません" description="レッスン記録が蓄積されると、ここに履歴が表示されます。" />
            </Card>
          ) : (
            <>
              {/* Desktop: table */}
              <Card padding={false} className="hidden md:block">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>日付</TableHead>
                      <TableHead>レッスン</TableHead>
                      <TableHead>テーマ</TableHead>
                      <TableHead>出欠</TableHead>
                      <TableHead>評価</TableHead>
                      <TableHead>良い点</TableHead>
                      <TableHead>改善点</TableHead>
                    </tr>
                  </TableHeader>
                  <tbody>
                    {history.map(entry => {
                      const date = parseISO(entry.lessonInstance.date);
                      const dayLabel = DAY_LABELS[date.getDay()];
                      const attColors = ATTENDANCE_STATUS_COLORS[entry.memberNote.attendance];
                      return (
                        <TableRow key={entry.record.id}>
                          <TableCell>
                            <span className="text-sm whitespace-nowrap">
                              {format(date, 'M/d', { locale: ja })}({dayLabel})
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{entry.lessonSlot.title}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{entry.record.theme}</span>
                          </TableCell>
                          <TableCell>
                            <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', attColors.bg, attColors.text)}>
                              {ATTENDANCE_STATUS_LABELS[entry.memberNote.attendance]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StarRating value={entry.memberNote.performanceRating} readonly size="sm" />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600 max-w-[150px] truncate block">
                              {entry.memberNote.goodPoints || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600 max-w-[150px] truncate block">
                              {entry.memberNote.improvementPoints || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
                </Table>
              </Card>

              {/* Mobile: card list */}
              <div className="md:hidden space-y-3">
                {history.map(entry => {
                  const date = parseISO(entry.lessonInstance.date);
                  const dayLabel = DAY_LABELS[date.getDay()];
                  const attColors = ATTENDANCE_STATUS_COLORS[entry.memberNote.attendance];
                  return (
                    <Card key={entry.record.id}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-court-green">
                              {format(date, 'M/d', { locale: ja })}({dayLabel})
                            </span>
                            <span className="text-xs text-gray-500">{entry.lessonSlot.title}</span>
                          </div>
                          <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', attColors.bg, attColors.text)}>
                            {ATTENDANCE_STATUS_LABELS[entry.memberNote.attendance]}
                          </span>
                        </div>
                        <p className="text-sm text-net-gray">{entry.record.theme}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">評価:</span>
                          <StarRating value={entry.memberNote.performanceRating} readonly size="sm" />
                        </div>
                        {entry.memberNote.goodPoints && (
                          <p className="text-xs text-green-700">
                            <span className="font-medium">良い点:</span> {entry.memberNote.goodPoints}
                          </p>
                        )}
                        {entry.memberNote.improvementPoints && (
                          <p className="text-xs text-orange-700">
                            <span className="font-medium">改善点:</span> {entry.memberNote.improvementPoints}
                          </p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Analysis tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  分析中...
                </span>
              ) : (
                'サマリーを生成'
              )}
            </Button>
          </div>

          {summary && (
            <div className="space-y-4">
              {/* Stats overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">総記録数</p>
                    <p className="text-2xl font-bold text-net-gray">{summary.totalLessons}</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">出席率</p>
                    <p className="text-2xl font-bold text-net-gray">{summary.attendanceRate}%</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">平均評価</p>
                    <p className="text-2xl font-bold text-net-gray">{summary.averageRating}</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">傾向</p>
                    <p className={clsx('text-lg font-bold', trendColors[summary.trend])}>
                      {trendLabels[summary.trend]}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Progress summary */}
              <Card>
                <h3 className="text-base font-bold text-net-gray mb-2">進捗サマリー</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{summary.progressSummary}</p>
              </Card>

              {/* Strengths and challenges side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <h3 className="text-base font-bold text-green-700 mb-2">強み</h3>
                  <ul className="space-y-1.5">
                    {summary.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card>
                  <h3 className="text-base font-bold text-orange-700 mb-2">課題</h3>
                  <ul className="space-y-1.5">
                    {summary.challenges.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {c}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <h3 className="text-base font-bold text-blue-700 mb-2">推奨事項</h3>
                <ul className="space-y-1.5">
                  {summary.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {r}
                    </li>
                  ))}
                </ul>
              </Card>

              <p className="text-xs text-gray-400 text-center">
                生成日時: {format(parseISO(summary.generatedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
