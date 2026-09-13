'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import CourtBackground from '@/components/tennis/CourtBackground';
import NetDivider from '@/components/tennis/NetDivider';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'member' | 'admin'>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(email, password, activeTab);
    if (success) {
      toast.success('ログインしました');
      router.push(activeTab === 'admin' ? '/admin' : '/dashboard');
    } else {
      setError('メールアドレスまたはパスワードが正しくありません');
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

            <Button type="submit" className="w-full">
              ログイン
            </Button>

            <NetDivider className="!my-4" />

            <div className="text-xs text-gray-400 text-center space-y-1">
              <p>デモアカウント:</p>
              <p>会員: member@tennis.jp / member</p>
              <p>管理者: admin@tennis.jp / admin</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
