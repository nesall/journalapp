import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import sql from '$lib/db';
import { hashPassword, createSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(302, '/journal');
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();
    const display_name = data.get('display_name')?.toString().trim();

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters' });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return fail(400, { error: 'Email already registered' });
    }

    const password_hash = await hashPassword(password);
    const users = await sql`
			INSERT INTO users (email, password_hash, display_name)
			VALUES (${email}, ${password_hash}, ${display_name ?? null})
			RETURNING id
		`;

    const sessionId = await createSession(users[0].id);
    cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true in production
      maxAge: 60 * 60 * 24 * 30
    });

    redirect(302, '/journal');
  }
};