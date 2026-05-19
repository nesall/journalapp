import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, cookies }) => {
  const sessionId = cookies.get('session_id');
  if (!sessionId || !locals.user) return json({ ok: false }, { status: 401 });
  return json({ ok: true });
};
