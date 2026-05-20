import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import sql from '$lib/db';

export const PATCH: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401);

  const { order } = await request.json();
  // order = [{ id, sort_order }, ...]

  for (const { id, sort_order } of order) {
    await sql`
            UPDATE entry_media SET sort_order = ${sort_order}
            WHERE id = ${id}
            AND entry_id IN (
                SELECT id FROM entries WHERE user_id = ${locals.user.id}
            )
        `;
  }

  return json({ success: true });
};