'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import { registerMember } from '@/app/actions/members';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import CourtBackground from '@/components/tennis/CourtBackground';
import NetDivider from '@/components/tennis/NetDivider';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [nameKana, setNameKana] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }

    setSubmitting(true);

    try {
      const result = await registerMember({ name, nameKana, email, phone, password });
      if (!result.success) {
        setError(result.error);
        return;
      }

      const loggedIn = await login(email, password, 'member');
      if (loggedIn) {
        toast.success('会員登録が完了しました');
        router.push('/dashboard');
      } else {
        setError('登録は完了しましたが、ログインに失敗しました。ログイン画面からお試しください。');
      }
    } catch {
      setError('登録中にエラーが発生しました');
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
          <h1 className="text-2xl font-bold text-net-dark">新規会員登録</h1>
          <p className="text-sm text-gray-500 mt-1">テニススクール予約管理システム</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-court-grass/10 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input
              label="氏名"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              required
            />
            <Input
              label="フリガナ"
              type="text"
              value={nameKana}
              onChange={(e) => setNameKana(e.target.value)}
              placeholder="ヤマダ タロウ"
              required
            />
            <Input
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@tennis.jp"
              required
            />
            <Input
              label="電話番号"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="090-1234-5678"
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
            <Input
              label="パスワード（確認）"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="パスワード（確認）"
              required
            />

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? '登録中...' : '会員登録'}
            </Button>

            <NetDivider className="!my-4" />

            <div className="text-center">
              <Link href="/login" className="text-sm text-court-green hover:underline">
                ログイン画面に戻る
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
