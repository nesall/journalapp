import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  console.log(`Sending password reset email to ${email} with link: ${resetUrl}`);
  const res = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Reset your Journal password',
    html: `
            <p>You requested a password reset for your Journal account.</p>
            <p><a href="${resetUrl}">Click here to reset your password</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, ignore this email.</p>
        `
  });
  console.log('Email send response:', res);
}