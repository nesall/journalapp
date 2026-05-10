import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { randomBytes } from 'crypto';
import sql from '$lib/db';
import { sendPasswordResetEmail } from '$lib/server/email';
import { BASE_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) return { redirect: '/journal' };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();

    console.log('Forgot password request for:', email);

    if (!email) return fail(400, { error: 'Email is required' });

    // always return success to prevent email enumeration
    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (users.length > 0) {
      const token = randomBytes(32).toString('hex');
      await sql`
                INSERT INTO password_reset_tokens (user_id, token, expires_at)
                VALUES (
                    ${users[0].id},
                    ${token},
                    NOW() + INTERVAL '1 hour'
                )
            `;
      const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    return { success: true };
  }
};