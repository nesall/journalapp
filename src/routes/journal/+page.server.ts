import type { Actions, PageServerLoad } from './$types';
import sql from '$lib/db';
import { type Topic } from '$lib/types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';

	const topics = q
		? await sql<Topic[]>`
        SELECT DISTINCT t.id, t.name, t.icon, t.color, t.created_at
        FROM topics t
        WHERE t.user_id = ${locals.user!.id}
        AND (
            t.name ILIKE ${'%' + q + '%'}
            OR EXISTS (
                SELECT 1 FROM entries e
                WHERE e.topic_id = t.id
                AND e.user_id = ${locals.user!.id}
                AND (
                    e.title ILIKE ${'%' + q + '%'}
                    OR e.body ILIKE ${'%' + q + '%'}
                )
            )
        )
        ORDER BY t.created_at ASC
    `
		: await sql<Topic[]>`
        SELECT id, name, icon, color, created_at
        FROM topics
        WHERE user_id = ${locals.user!.id}
        ORDER BY created_at ASC
    `;

	return { topics, q };

};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const name = data.get('name')?.toString().trim();
		const icon = data.get('icon')?.toString();

		if (!id || !name) return fail(400, { error: 'Missing fields' });

		await sql`
        UPDATE topics SET name = ${name}, icon = ${icon ?? null}
        WHERE id = ${id} AND user_id = ${locals.user!.id}
    `;
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'Missing id' });

		await sql`
        DELETE FROM topics
        WHERE id = ${id} AND user_id = ${locals.user!.id}
    `;
		return { success: true };
	}
};