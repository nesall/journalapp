import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import sql from '$lib/db';
import storage from '$lib/server/storage';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const POST: RequestHandler = async ({ request, locals, params }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const entryId = formData.get('entry_id')?.toString();

  if (!file) error(400, 'No file provided');
  if (!entryId) error(400, 'No entry_id provided');
  if (!ALLOWED_TYPES.includes(file.type)) error(400, 'Invalid file type');
  if (file.size > MAX_SIZE) error(400, 'File too large (max 10MB)');

  // verify entry belongs to user and topic
  const entries = await sql`
        SELECT id FROM entries
        WHERE id = ${entryId}
        AND topic_id = ${params.topicId}
        AND user_id = ${locals.user.id}
    `;
  if (entries.length === 0) error(404, 'Entry not found');

  const buffer = Buffer.from(await file.arrayBuffer());
  const { key, thumbnailKey } = await storage.uploadWithThumbnail(buffer, file.name, file.type);
  const url = storage.getUrl(key);
  const thumbnailUrl = storage.getUrl(thumbnailKey);

  const media = await sql`
        INSERT INTO entry_media (entry_id, type, url, thumbnail_url, metadata)
        VALUES (
            ${entryId},
            'image',
            ${key},
            ${thumbnailKey},
            ${JSON.stringify({ originalName: file.name, mimeType: file.type, size: file.size })}
        )
        RETURNING id, type, url, thumbnail_url
    `;

  return json({ id: media[0].id, type: media[0].type, url, thumbnailUrl });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { mediaId } = await request.json();
  if (!mediaId) error(400, 'No mediaId provided');

  // verify ownership via join
  const rows = await sql`
        SELECT m.id, m.url FROM entry_media m
        JOIN entries e ON e.id = m.entry_id
        WHERE m.id = ${mediaId}
        AND e.user_id = ${locals.user.id}
    `;
  if (rows.length === 0) error(404, 'Media not found');

  await storage.delete(rows[0].url);
  await sql`DELETE FROM entry_media WHERE id = ${mediaId}`;

  return json({ success: true });
};