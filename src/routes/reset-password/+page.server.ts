import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import sql from '$lib/db';
import { hashPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token');
  if (!token) redirect(302, '/forgot-password');

  const rows = await sql`
        SELECT id FROM password_reset_tokens
        WHERE token = ${token}
        AND expires_at > NOW()
        AND used_at IS NULL
    `;

  if (rows.length === 0) return { invalid: true };
  return { token };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const token = data.get('token')?.toString();
    const password = data.get('password')?.toString();
    const confirm = data.get('confirm')?.toString();

    if (!token || !password) return fail(400, { error: 'Missing fields' });
    if (password.length < 8) return fail(400, { error: 'Password must be at least 8 characters' });
    if (password !== confirm) return fail(400, { error: 'Passwords do not match' });

    const rows = await sql`
            SELECT user_id FROM password_reset_tokens
            WHERE token = ${token}
            AND expires_at > NOW()
            AND used_at IS NULL
        `;

    if (rows.length === 0) return fail(400, { error: 'Invalid or expired reset link' });

    const hash = await hashPassword(password);

    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${rows[0].user_id}`;
    await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ${token}`;

    // invalidate all sessions for security
    await sql`DELETE FROM sessions WHERE user_id = ${rows[0].user_id}`;

    redirect(302, '/login');
  }
};