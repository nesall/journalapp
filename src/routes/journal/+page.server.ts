import type { Actions, PageServerLoad } from './$types';
import sql from '$lib/db';
import { type Topic } from '$lib/types';
import { fail } from '@sveltejs/kit';
import { parseSearchQuery } from '$lib/utils';
import storage from '$lib/server/storage';

export const load: PageServerLoad = async ({ locals, url }) => {
    const q = url.searchParams.get('q')?.trim() ?? '';

    const { text, tag } = parseSearchQuery(q);
    const topics = (text || tag)
        ? await sql<Topic[]>`
        SELECT DISTINCT t.id, t.name, t.icon, t.color, t.created_at
        FROM topics t
        WHERE t.user_id = ${locals.user!.id}
        AND (
            ${text ? sql`t.name ILIKE ${'%' + text + '%'} OR` : sql``}
            EXISTS (
                SELECT 1 FROM entries e
                LEFT JOIN topic_tags tt ON tt.id = e.tag_id
                WHERE e.topic_id = t.id
                AND e.user_id = ${locals.user!.id}
                AND (
                    ${text ? sql`(e.title ILIKE ${'%' + text + '%'} OR e.body ILIKE ${'%' + text + '%'})` : sql`TRUE`}
                    ${tag ? sql`AND tt.name ILIKE ${'%' + tag + '%'}` : sql``}
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

        // fetch all media for all entries in this topic
        const media = await sql`
        SELECT m.url, m.thumbnail_url FROM entry_media m
        JOIN entries e ON e.id = m.entry_id
        WHERE e.topic_id = ${id}
        AND e.user_id = ${locals.user!.id}
    `;

        await sql`
        DELETE FROM topics
        WHERE id = ${id} AND user_id = ${locals.user!.id}
    `;

        // delete files
        for (const m of media) {
            await storage.delete(m.url);
            if (m.thumbnail_url) await storage.delete(m.thumbnail_url);
        }

        return { success: true };
    }
};