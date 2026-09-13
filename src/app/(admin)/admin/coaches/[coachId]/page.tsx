'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useCoaches from '@/hooks/useCoaches';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { LEVEL_LABELS } from '@/lib/constants';
import { Coach, LessonLevel } from '@/types';

export default function EditCoachPage() {
  const { getCoach, updateCoach } = useCoaches();
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const coachId = params.coachId as string;

  const [coach, setCoach] = useState<Coach | null>(null);

  useEffect(() => {
    const c = getCoach(coachId);
    if (c) setCoach(c);
  }, [coachId, getCoach]);

  if (!coach) return <LoadingSpinner />;

  const toggleSpecialty = (level: LessonLevel) => {
    setCoach(c => c ? { ...c, specialties: c.specialties.includes(level) ? c.specialties.filter(s => s !== level) : [...c.specialties, level] } : c);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCoach(coachId, coach);
    toast.success('コーチ情報を更新しました');
    router.push('/admin/coaches');
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>コーチ編集: {coach.name}</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="氏名" value={coach.name} onChange={e => setCoach(c => c ? { ...c, name: e.target.value } : c)} required />
            <Input label="フリガナ" value={coach.nameKana} onChange={e => setCoach(c => c ? { ...c, nameKana: e.target.value } : c)} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="メールアドレス" type="email" value={coach.email} onChange={e => setCoach(c => c ? { ...c, email: e.target.value } : c)} required />
            <Input label="電話番号" value={coach.phone} onChange={e => setCoach(c => c ? { ...c, phone: e.target.value } : c)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-net-gray mb-2">担当レベル</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(LEVEL_LABELS) as [LessonLevel, string][]).map(([key, label]) => (
                <button key={key} type="button" onClick={() => toggleSpecialty(key)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${coach.specialties.includes(key) ? 'bg-court-green text-white border-court-green' : 'bg-white text-gray-600 border-gray-300 hover:border-court-grass'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Input label="自己紹介" value={coach.bio} onChange={e => setCoach(c => c ? { ...c, bio: e.target.value } : c)} />
          <Input label="資格 (カンマ区切り)" value={coach.certifications.join(', ')} onChange={e => setCoach(c => c ? { ...c, certifications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : c)} />
          <div className="flex gap-3 pt-2">
            <Button type="submit">更新</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
