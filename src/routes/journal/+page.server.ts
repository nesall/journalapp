import type { PageServerLoad } from './$types';
import sql from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const topics = await sql`
		SELECT id, name, icon, color
		FROM topics
		WHERE user_id = ${locals.user!.id}
		ORDER BY created_at ASC
	`;

	return { topics };
};