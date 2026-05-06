import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import sql from '$lib/db';

export const PATCH: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401);
  const { id, title, body, mood, entry_date } = await request.json();
  if (!body?.trim()) error(400, 'Body required');

  await sql`
		UPDATE entries SET
			title = ${title ?? null},
			body = ${body},
			mood = ${mood ?? null},
      entry_date = ${entry_date},
			updated_at = NOW()
		WHERE id = ${id}
		AND user_id = ${locals.user.id}
	`;

  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401);
  const { id } = await request.json();

  await sql`
		DELETE FROM entries
		WHERE id = ${id}
		AND user_id = ${locals.user.id}
	`;

  return json({ success: true });
};