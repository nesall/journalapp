import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import sql from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const icon = data.get('icon')?.toString().trim();
		const color = data.get('color')?.toString().trim();

		if (!name) return fail(400, { error: 'Name is required' });

		await sql`
			INSERT INTO topics (user_id, name, icon, color)
			VALUES (${locals.user!.id}, ${name}, ${icon ?? null}, ${color ?? null})
		`;

		redirect(302, '/journal');
	}
};