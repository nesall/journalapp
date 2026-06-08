import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import sql from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(302, '/login');

  const userId = locals.user.id;

  // totals
  const totals = await sql`
        SELECT
            (SELECT COUNT(*) FROM topics WHERE user_id = ${userId}) AS topic_count,
            (SELECT COUNT(*) FROM entries WHERE user_id = ${userId}) AS entry_count,
            (SELECT COUNT(*) FROM entry_media m JOIN entries e ON e.id = m.entry_id WHERE e.user_id = ${userId}) AS image_count,
            (SELECT COALESCE(SUM(LENGTH(body)), 0) FROM entries WHERE user_id = ${userId}) AS total_chars
    `;

  // entries per month (last 12 months)
  const entriesPerMonth = await sql`
        SELECT
            TO_CHAR(entry_date, 'YYYY-MM') AS month,
            COUNT(*) AS count
        FROM entries
        WHERE user_id = ${userId}
        AND entry_date >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
    `;

  // most active topic
  const topicActivity = await sql`
        SELECT t.name, t.icon, COUNT(e.id) AS entry_count
        FROM topics t
        LEFT JOIN entries e ON e.topic_id = t.id
        WHERE t.user_id = ${userId}
        GROUP BY t.id
        ORDER BY entry_count DESC
    `;

  // mood distribution
  const moodDist = await sql`
        SELECT mood, COUNT(*) AS count
        FROM entries
        WHERE user_id = ${userId}
        AND mood IS NOT NULL
        GROUP BY mood
        ORDER BY mood ASC
    `;

  const tagDist = await sql`
    SELECT tt.name, tt.color, COUNT(e.id) AS count
    FROM topic_tags tt
    LEFT JOIN entries e ON e.tag_id = tt.id
    JOIN topics t ON t.id = tt.topic_id
    WHERE t.user_id = ${userId}
    GROUP BY tt.id
    ORDER BY count DESC
`;

  // avg words per entry
  const avgWords = await sql`
        SELECT ROUND(AVG(LENGTH(body) - LENGTH(REPLACE(body, ' ', '')) + 1)) AS avg_words
        FROM entries
        WHERE user_id = ${userId}
        AND LENGTH(body) > 0
    `;

  return {
    totals: totals[0],
    entriesPerMonth,
    topicActivity,
    moodDist,
    tagDist,
    avgWords: avgWords[0]?.avg_words ?? 0
  };
};