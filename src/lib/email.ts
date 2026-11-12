import { Resend } from 'resend';
import type { TrialStatus } from '@/domain/models';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'テニススクール <onboarding@resend.dev>';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendVerificationCode(email: string, code: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: '【テニススクール】会員登録の確認コード',
    html: `<p>確認コード: <strong>${escapeHtml(code)}</strong></p><p>このコードは10分間有効です。</p>`,
  });
}

export async function sendTrialConfirmation(email: string, name: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: '【テニススクール】体験レッスンのお申込みを受け付けました',
    html: `<p>${escapeHtml(name)} 様</p><p>体験レッスンのお申込みありがとうございます。</p><p>内容を確認の上、担当者よりご連絡いたします。</p>`,
  });
}

const TRIAL_STATUS_MESSAGES: Record<TrialStatus, string> = {
  pending: 'お申込みを受け付けました。審査中です。',
  approved: '体験レッスンが承認されました。当日お待ちしております。',
  rejected: '申し訳ございませんが、今回はご希望に添えませんでした。',
  completed: '体験レッスンにご参加いただきありがとうございました。',
  no_show: '体験レッスンにご参加いただけなかったようです。',
};

export async function sendTrialStatusUpdate(email: string, name: string, status: TrialStatus) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: '【テニススクール】体験レッスン申込の状況更新',
    html: `<p>${escapeHtml(name)} 様</p><p>${TRIAL_STATUS_MESSAGES[status]}</p>`,
  });
}
