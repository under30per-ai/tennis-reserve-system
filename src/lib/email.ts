import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationCode(email: string, code: string) {
  await resend.emails.send({
    from: 'テニススクール <onboarding@resend.dev>',
    to: email,
    subject: '【テニススクール】会員登録の確認コード',
    html: `<p>確認コード: <strong>${code}</strong></p><p>このコードは10分間有効です。</p>`,
  });
}
