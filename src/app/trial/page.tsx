'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { applyForTrial } from '@/app/actions/trials';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LEVEL_LABELS, TIME_SLOTS } from '@/lib/constants';
import { LessonLevel } from '@/types';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';

export default function TrialApplicationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', nameKana: '', email: '', phone: '',
    preferredLevel: 'beginner' as LessonLevel,
    preferredDate: '', preferredTime: '10:00', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await applyForTrial(form);
      router.push('/trial/complete');
    } catch {
      setError('申込に失敗しました。もう一度お試しください。');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-court-grass/10 to-white py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-court-green rounded-full mb-3">
            <TennisBallIcon size={28} />
          </div>
          <h1 className="text-xl font-bold text-net-dark">体験レッスン申込</h1>
          <p className="text-sm text-gray-500 mt-1">テニススクールの体験レッスンにお申込みいただけます</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="お名前" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <Input label="フリガナ" value={form.nameKana} onChange={e => setForm(f => ({ ...f, nameKana: e.target.value }))} required />
            </div>
            <Input label="メールアドレス" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <Input label="電話番号" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            <div>
              <label className="block text-sm font-medium text-net-gray mb-1">希望レベル</label>
              <select value={form.preferredLevel} onChange={e => setForm(f => ({ ...f, preferredLevel: e.target.value as LessonLevel }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {(Object.entries(LEVEL_LABELS) as [LessonLevel, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="希望日" type="date" value={form.preferredDate} onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-net-gray mb-1">希望時間</label>
                <select value={form.preferredTime} onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-net-gray mb-1">メッセージ（任意）</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-24 resize-none" placeholder="質問やご要望がありましたらご記入ください" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? '送信中...' : '申込む'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
