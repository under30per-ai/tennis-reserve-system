'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import CourtBackground from '@/components/tennis/CourtBackground';


export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'member' | 'admin'>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const success = await login(email, password, activeTab);
      if (success) {
        toast.success('ログインしました');
        router.push(activeTab === 'admin' ? '/admin' : '/dashboard');
      } else {
        setError('メールアドレスまたはパスワードが正しくありません');
      }
    } catch {
      setError('ログイン中にエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <CourtBackground opacity={0.06} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-court-green rounded-full p-4 shadow-lg">
              <TennisBallIcon size={48} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-net-dark">テニススクール</h1>
          <p className="text-sm text-gray-500 mt-1">予約管理システム</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-court-grass/10 overflow-hidden">
          <div className="px-6 pt-6">
            <Tabs
              tabs={[
                { key: 'member', label: '会員ログイン' },
                { key: 'admin', label: '管理者ログイン' },
              ]}
              activeTab={activeTab}
              onChange={(key) => {
                setActiveTab(key as 'member' | 'admin');
                setError('');
                setEmail('');
                setPassword('');
              }}
            />
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@tennis.jp"
              required
            />
            <Input
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              required
            />

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'ログイン中...' : 'ログイン'}
            </Button>

            <div className="text-center">
              <Link href="/register" className="text-sm text-court-green hover:underline">
                新規会員登録はこちら
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
