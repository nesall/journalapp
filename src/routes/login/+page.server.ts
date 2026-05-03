import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import sql from '$lib/db';
import { verifyPassword, createSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(302, '/journal');
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' });
    }

    const users = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return fail(400, { error: 'Invalid email or password' });
    }

    const valid = await verifyPassword(password, users[0].password_hash);
    if (!valid) {
      return fail(400, { error: 'Invalid email or password' });
    }

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