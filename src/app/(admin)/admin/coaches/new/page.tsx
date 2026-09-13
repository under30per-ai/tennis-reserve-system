'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useCoaches from '@/hooks/useCoaches';
import useToast from '@/hooks/useToast';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LEVEL_LABELS } from '@/lib/constants';
import { LessonLevel } from '@/types';

export default function NewCoachPage() {
  const { addCoach } = useCoaches();
  const toast = useToast();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', nameKana: '', email: '', phone: '', bio: '', certifications: '' });
  const [specialties, setSpecialties] = useState<LessonLevel[]>([]);

  const toggleSpecialty = (level: LessonLevel) => {
    setSpecialties(prev => prev.includes(level) ? prev.filter(s => s !== level) : [...prev, level]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCoach({
      ...form,
      specialties,
      certifications: form.certifications.split(',').map(c => c.trim()).filter(Boolean),
      isActive: true,
    });
    toast.success('コーチを追加しました');
    router.push('/admin/coaches');
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardTitle>新規コーチ追加</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="氏名" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input label="フリガナ" value={form.nameKana} onChange={e => setForm(f => ({ ...f, nameKana: e.target.value }))} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="メールアドレス" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <Input label="電話番号" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-net-gray mb-2">担当レベル</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(LEVEL_LABELS) as [LessonLevel, string][]).map(([key, label]) => (
                <button key={key} type="button" onClick={() => toggleSpecialty(key)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${specialties.includes(key) ? 'bg-court-green text-white border-court-green' : 'bg-white text-gray-600 border-gray-300 hover:border-court-grass'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Input label="自己紹介" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          <Input label="資格 (カンマ区切り)" value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} placeholder="JTA公認コーチ, 元プロ選手" />
          <div className="flex gap-3 pt-2">
            <Button type="submit">追加</Button>
            <Button variant="ghost" type="button" onClick={() => router.back()}>キャンセル</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
