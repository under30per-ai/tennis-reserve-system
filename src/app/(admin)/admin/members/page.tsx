'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useMembers from '@/hooks/useMembers';
import useLessonRecords from '@/hooks/useLessonRecords';
import useToast from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { LevelBadge } from '@/components/ui/Badge';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { MEMBERSHIP_LABELS } from '@/lib/constants';
import { formatDate, getInitials } from '@/lib/utils';

export default function MembersPage() {
  const { members, deleteMember } = useMembers();
  const { getMemberLessonHistory } = useLessonRecords();
  const toast = useToast();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(m => m.name.includes(q) || m.nameKana.includes(q) || m.email.includes(q));
  }, [members, search]);

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMember(deleteTarget);
      toast.success('会員を削除しました');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Input placeholder="名前・メールで検索..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Button onClick={() => router.push('/admin/members/new')}>会員追加</Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="会員が見つかりません" description="検索条件を変更してみてください" />
        </Card>
      ) : (
        <>
          {/* Desktop: table */}
          <Card padding={false} className="hidden sm:block">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>会員</TableHead>
                  <TableHead>レベル</TableHead>
                  <TableHead>会員種別</TableHead>
                  <TableHead>入会日</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>記録数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </tr>
              </TableHeader>
              <tbody>
                {filtered.map(member => (
                  <TableRow key={member.id} onClick={() => router.push(`/admin/members/${member.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: member.avatarColor }}>
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="font-medium text-net-gray">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><LevelBadge level={member.level} /></TableCell>
                    <TableCell><span className="text-sm">{MEMBERSHIP_LABELS[member.membershipType]}</span></TableCell>
                    <TableCell><span className="text-sm">{formatDate(member.joinDate)}</span></TableCell>
                    <TableCell>
                      <Badge variant={member.isActive ? 'success' : 'error'}>
                        {member.isActive ? 'アクティブ' : '休会中'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const count = getMemberLessonHistory(member.id).length;
                        return count > 0 ? (
                          <Badge variant="info">{count}件</Badge>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(member.id); }}>
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Mobile: card list */}
          <div className="sm:hidden space-y-3">
            {filtered.map(member => (
              <Card
                key={member.id}
                className="cursor-pointer active:bg-gray-50"
                onClick={() => router.push(`/admin/members/${member.id}`)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: member.avatarColor }}>
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-net-gray truncate">{member.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <LevelBadge level={member.level} />
                        <span className="text-xs text-gray-400">{MEMBERSHIP_LABELS[member.membershipType]}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={member.isActive ? 'success' : 'error'}>
                    {member.isActive ? 'アクティブ' : '休会中'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="会員削除" message="この会員を削除してもよろしいですか？" variant="danger" confirmLabel="削除" />
    </div>
  );
}
