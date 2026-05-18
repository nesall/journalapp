import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import sql from '$lib/db';
import { hashPassword, verifyPassword, deleteSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(302, '/login');
  return { user: locals.user };
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    const data = await request.formData();
    const display_name = data.get('display_name')?.toString().trim();

    if (!display_name) return fail(400, { profileError: 'Display name is required' });

    await sql`
            UPDATE users SET display_name = ${display_name}
            WHERE id = ${locals.user!.id}
        `;

    return { profileSuccess: true };
  },

  changePassword: async ({ request, locals }) => {
    const data = await request.formData();
    const current = data.get('current_password')?.toString();
    const newPassword = data.get('new_password')?.toString();
    const confirm = data.get('confirm_password')?.toString();

    if (!current || !newPassword) return fail(400, { passwordError: 'All fields are required' });
    if (newPassword.length < 8) return fail(400, { passwordError: 'Password must be at least 8 characters' });
    if (newPassword !== confirm) return fail(400, { passwordError: 'Passwords do not match' });

    const users = await sql`SELECT password_hash FROM users WHERE id = ${locals.user!.id}`;
    const valid = await verifyPassword(current, users[0].password_hash);
    if (!valid) return fail(400, { passwordError: 'Current password is incorrect' });

    const hash = await hashPassword(newPassword);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${locals.user!.id}`;

    // invalidate all other sessions for security
    await sql`
            DELETE FROM sessions
            WHERE user_id = ${locals.user!.id}
        `;

    redirect(302, '/login');
  },

  deleteAccount: async ({ request, locals, cookies }) => {
    const data = await request.formData();
    const password = data.get('delete_confirm_password')?.toString();

    if (!password) return fail(400, { deleteError: 'Password is required' });

    const users = await sql`SELECT password_hash FROM users WHERE id = ${locals.user!.id}`;
    const valid = await verifyPassword(password, users[0].password_hash);
    if (!valid) return fail(400, { deleteError: 'Incorrect password' });

    // fetch all media to delete files
    const media = await sql`
            SELECT m.url, m.thumbnail_url FROM entry_media m
            JOIN entries e ON e.id = m.entry_id
            WHERE e.user_id = ${locals.user!.id}
        `;

    // delete user (cascades to topics, entries, sessions, media rows)
    await sql`DELETE FROM users WHERE id = ${locals.user!.id}`;

    // delete files from storage
    const { default: storage } = await import('$lib/server/storage');
    for (const m of media) {
      await storage.delete(m.url);
      if (m.thumbnail_url) await storage.delete(m.thumbnail_url);
    }

    cookies.delete('session_id', { path: '/' });
    redirect(302, '/login');
  }
};