'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';
import { registerMember, verifyEmail, resendVerificationCode } from '@/app/actions/members';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import TennisBallIcon from '@/components/tennis/TennisBallIcon';
import CourtBackground from '@/components/tennis/CourtBackground';
import NetDivider from '@/components/tennis/NetDivider';

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [name, setName] = useState('');
  const [nameKana, setNameKana] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
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

      setStep('verify');
      toast.success('確認コードを送信しました');
    } catch {
      setError('登録中にエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await verifyEmail({ email, code: verificationCode });
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
      setError('認証中にエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);

    try {
      const result = await resendVerificationCode(email);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success('確認コードを再送しました');
    } catch {
      setError('再送中にエラーが発生しました');
    } finally {
      setResending(false);
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
          {step === 'form' ? (
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
                {submitting ? '送信中...' : '確認コードを送信'}
              </Button>

              <NetDivider className="!my-4" />

              <div className="text-center">
                <Link href="/login" className="text-sm text-court-green hover:underline">
                  ログイン画面に戻る
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="p-6 space-y-4">
              <div className="text-center text-sm text-gray-600 mb-2">
                <p><strong>{email}</strong> に確認コードを送信しました。</p>
                <p>メールに記載された6桁のコードを入力してください。</p>
              </div>

              <Input
                label="確認コード"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
              />

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? '認証中...' : '認証する'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-court-green hover:underline disabled:opacity-50"
                >
                  {resending ? '再送中...' : 'コードを再送する'}
                </button>
              </div>

              <NetDivider className="!my-4" />

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(''); setVerificationCode(''); }}
                  className="text-sm text-gray-500 hover:underline"
                >
                  登録情報を修正する
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
