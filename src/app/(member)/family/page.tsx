'use client';

import useMyFamily from '@/hooks/useMyFamily';
import Card, { CardTitle } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FAMILY_RELATIONSHIP_LABELS } from '@/lib/constants';
import { getInitials } from '@/lib/utils';

export default function MyFamilyPage() {
  const { familyGroup, loading } = useMyFamily();

  if (loading) return <LoadingSpinner />;

  if (!familyGroup) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-net-dark">家族情報</h1>
        <EmptyState title="家族グループに所属していません" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-net-dark">家族情報</h1>

      <Card>
        <CardTitle>{familyGroup.name}</CardTitle>
        <div className="mt-4 space-y-3">
          {familyGroup.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b last:border-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: m.member.avatarColor }}
              >
                {getInitials(m.member.name)}
              </div>
              <div>
                <p className="font-medium text-sm text-net-gray">{m.member.name}</p>
                <p className="text-xs text-gray-500">{FAMILY_RELATIONSHIP_LABELS[m.relationship]}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
