import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import sql from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(302, '/login');

  const topics = await sql`
        SELECT t.id, t.name, t.icon,
            COUNT(DISTINCT e.id) AS entry_count
        FROM topics t
        LEFT JOIN entries e ON e.topic_id = t.id
        WHERE t.user_id = ${locals.user.id}
        GROUP BY t.id
        ORDER BY t.created_at ASC
    `;

  const tags = await sql`
        SELECT tt.id, tt.name, tt.color, tt.topic_id,
            COUNT(e.id) AS entry_count
        FROM topic_tags tt
        LEFT JOIN entries e ON e.tag_id = tt.id
        WHERE tt.topic_id = ANY(${topics.map((t: any) => t.id)})
        GROUP BY tt.id
        ORDER BY tt.name ASC
    `;

  return { topics, tags };
};