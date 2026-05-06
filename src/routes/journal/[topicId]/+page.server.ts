import type { Actions, PageServerLoad } from './$types';
import { fail, error } from '@sveltejs/kit';
import sql from '$lib/db';
import { type Topic, type Note } from '$lib/types';
import storage from '$lib/server/storage';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const q = url.searchParams.get('q')?.trim() ?? '';

  const topics = await sql<Topic[]>`
		SELECT id, user_id, name, icon, color, created_at
		FROM topics
		WHERE id = ${params.topicId}
		AND user_id = ${locals.user!.id}
	`;

  if (topics.length === 0) error(404, 'Topic not found');

  // const entries = await sql<Note[]>`
  //   SELECT 
  //       e.id, e.title, e.body, e.mood, e.entry_date::text, e.created_at, e.updated_at,
  //       COALESCE(
  //           JSON_AGG(
  //               JSON_BUILD_OBJECT('id', m.id, 'type', m.type, 'url', m.url)
  //           ) FILTER (WHERE m.id IS NOT NULL), 
  //           '[]'
  //       ) AS media
  //   FROM entries e
  //   LEFT JOIN entry_media m ON m.entry_id = e.id
  //   WHERE e.topic_id = ${params.topicId}
  //   AND e.user_id = ${locals.user!.id}
  //   GROUP BY e.id
  //   ORDER BY e.entry_date DESC, e.created_at DESC	`;

const entries = q
		? await sql<Note[]>`
			SELECT
				e.id, e.title, e.body, e.mood,
				e.entry_date::text,
				e.created_at, e.updated_at,
				COALESCE(
					JSON_AGG(
						JSON_BUILD_OBJECT('id', m.id, 'type', m.type, 'url', m.url)
					) FILTER (WHERE m.id IS NOT NULL),
					'[]'
				) AS media
			FROM entries e
			LEFT JOIN entry_media m ON m.entry_id = e.id
			WHERE e.topic_id = ${params.topicId}
			AND e.user_id = ${locals.user!.id}
			AND (
				e.title ILIKE ${'%' + q + '%'}
				OR e.body ILIKE ${'%' + q + '%'}
			)
			GROUP BY e.id
			ORDER BY e.entry_date DESC, e.created_at DESC
		`
		: await sql<Note[]>`
			SELECT
				e.id, e.title, e.body, e.mood,
				e.entry_date::text,
				e.created_at, e.updated_at,
				COALESCE(
					JSON_AGG(
						JSON_BUILD_OBJECT('id', m.id, 'type', m.type, 'url', m.url)
					) FILTER (WHERE m.id IS NOT NULL),
					'[]'
				) AS media
			FROM entries e
			LEFT JOIN entry_media m ON m.entry_id = e.id
			WHERE e.topic_id = ${params.topicId}
			AND e.user_id = ${locals.user!.id}
			GROUP BY e.id
			ORDER BY e.entry_date DESC, e.created_at DESC
		`;

	const resolved = entries.map(e => ({
		...e,
		media: e.media.map((m: { id: string; type: string; url: string }) => ({
			...m,
			url: storage.getUrl(m.url)
		}))
	}));

	return { topic: topics[0], entries: resolved, q };
};

export const actions: Actions = {
  create: async ({ locals, params }) => {
    const rows = await sql`
        INSERT INTO entries (topic_id, user_id, title, body, entry_date)
        VALUES (
            ${params.topicId},
            ${locals.user!.id},
            ${null},
            ${''},
            ${new Date().toISOString().split('T')[0]}
        )
        RETURNING id
    `;
    return { newEntryId: rows[0].id };
  },
};