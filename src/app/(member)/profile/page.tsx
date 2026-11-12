'use client';

import { useState } from 'react';
import { useMemberData } from '@/contexts/MemberDataContext';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LevelBadge } from '@/components/ui/Badge';
import Badge from '@/components/ui/Badge';
import NetDivider from '@/components/tennis/NetDivider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MEMBERSHIP_LABELS } from '@/lib/constants';
import { formatDate, getInitials } from '@/lib/utils';
import { Member } from '@/types';
import { updateOwnProfile } from '@/app/actions/members';

export default function ProfilePage() {
  const { member: cachedMember, loading, refreshMember } = useMemberData();
  const toast = useToast();

  const [editMember, setEditMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  if (loading || !cachedMember) return <LoadingSpinner />;

  const member = isEditing && editMember ? editMember : cachedMember;

  const handleSave = async () => {
    if (!editMember) return;
    try {
      await updateOwnProfile({ name: editMember.name, nameKana: editMember.nameKana, phone: editMember.phone });
      toast.success('プロフィールを更新しました');
      setIsEditing(false);
      setEditMember(null);
      await refreshMember();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: member.avatarColor }}>
            {getInitials(member.name)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-net-dark">{member.name}</h1>
            <p className="text-sm text-gray-500">{member.nameKana}</p>
          </div>
        </div>

        <NetDivider className="!my-4" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">レベル</p>
            <LevelBadge level={member.level} />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">会員種別</p>
            <p className="text-sm font-medium">{MEMBERSHIP_LABELS[member.membershipType]}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">入会日</p>
            <p className="text-sm font-medium">{formatDate(member.joinDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">メールアドレス</p>
            <p className="text-sm font-medium">{member.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">ステータス</p>
            <Badge variant={member.isActive ? 'success' : 'error'}>
              {member.isActive ? 'アクティブ' : '休会中'}
            </Badge>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>プロフィール編集</CardTitle>
          {!isEditing && <Button variant="outline" size="sm" onClick={() => { setEditMember({ ...cachedMember }); setIsEditing(true); }}>編集</Button>}
        </div>
        {isEditing ? (
          <div className="space-y-4">
            <Input label="氏名" value={member.name} onChange={e => setEditMember(m => m ? { ...m, name: e.target.value } : m)} />
            <Input label="フリガナ" value={member.nameKana} onChange={e => setEditMember(m => m ? { ...m, nameKana: e.target.value } : m)} />
            <Input label="電話番号" value={member.phone} onChange={e => setEditMember(m => m ? { ...m, phone: e.target.value } : m)} />
            <div className="flex gap-3">
              <Button onClick={handleSave}>保存</Button>
              <Button variant="ghost" onClick={() => { setIsEditing(false); setEditMember(null); }}>キャンセル</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">氏名</p>
              <p className="text-sm">{member.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">フリガナ</p>
              <p className="text-sm">{member.nameKana}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">電話番号</p>
              <p className="text-sm">{member.phone || '未登録'}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
