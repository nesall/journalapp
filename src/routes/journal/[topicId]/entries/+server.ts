import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import sql from '$lib/db';

export const PATCH: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401);
  const { id, title, body, mood, entry_date, tag_id, tag_name, tag_color, topic_id } = await request.json();
  if (!body?.trim()) error(400, 'Body required');

  let resolvedTagId = tag_id ?? null;

  // create tag on the fly if name provided but no id
  if (tag_name?.trim() && !tag_id) {
    const existing = await sql`
        SELECT id FROM topic_tags
        WHERE topic_id = ${topic_id}
        AND LOWER(name) = LOWER(${tag_name.trim()})
    `;
    if (existing.length > 0) {
      resolvedTagId = existing[0].id;
    } else {
      const created = await sql`
            INSERT INTO topic_tags (topic_id, name, color)
            VALUES (${topic_id}, ${tag_name.trim()}, ${tag_color ?? '#6366f1'})
            RETURNING id
        `;
      resolvedTagId = created[0].id;
    }
  }

  await sql`
		UPDATE entries SET
			title = ${title ?? null},
			body = ${body},
			mood = ${mood ?? null},
      entry_date = ${entry_date},
      tag_id = ${resolvedTagId ?? null},
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