'use client';

import { useState } from 'react';
import useTickets from '@/hooks/useTickets';
import useMembers from '@/hooks/useMembers';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';

export default function MemberTicketsPage() {
  const { ticketTypes, memberTickets, loading, issueMemberTicket } = useTickets({ eagerLoad: true });
  const { members, loading: membersLoading } = useMembers({ eagerLoad: true });
  const toast = useToast();
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const handleIssue = async () => {
    if (!selectedMember || !selectedType) {
      toast.error('会員とチケット種別を選択してください');
      return;
    }
    try {
      await issueMemberTicket(selectedMember, selectedType);
      toast.success('チケットを発行しました');
      setSelectedMember('');
      setSelectedType('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '発行に失敗しました');
    }
  };

  if (loading || membersLoading) return <LoadingSpinner />;

  const activeTypes = ticketTypes.filter((t) => t.isActive);
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>チケット発行</CardTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-net-gray mb-1">会員</label>
            <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">会員を選択</option>
              {members.filter((m) => m.isActive).map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-net-gray mb-1">チケット種別</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">種別を選択</option>
              {activeTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.lessonCount}回 / {t.validDays}日 / &yen;{t.price.toLocaleString()})</option>
              ))}
            </select>
          </div>
          <Button onClick={handleIssue}>発行</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>発行済チケット一覧</CardTitle>
        {memberTickets.length === 0 ? (
          <EmptyState title="発行済チケットはありません" />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">会員</th>
                  <th className="pb-2 pr-4">種別</th>
                  <th className="pb-2 pr-4">残回数</th>
                  <th className="pb-2 pr-4">有効期限</th>
                  <th className="pb-2">状態</th>
                </tr>
              </thead>
              <tbody>
                {memberTickets.map((t) => {
                  const member = memberMap.get(t.memberId);
                  const isExpired = new Date(t.expiresAt) < new Date();
                  return (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{member?.name ?? '不明'}</td>
                      <td className="py-2 pr-4">{t.ticketType.name}</td>
                      <td className="py-2 pr-4">{t.remainingCount} / {t.ticketType.lessonCount}</td>
                      <td className="py-2 pr-4">{formatDate(t.expiresAt, 'yyyy/MM/dd')}</td>
                      <td className="py-2">
                        {isExpired ? (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">期限切れ</span>
                        ) : t.isActive ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">有効</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">無効</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
