import type { Handle } from '@sveltejs/kit';
import sql from '$lib/db';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');

	if (sessionId) {
		const rows = await sql`
			SELECT u.id, u.email, u.display_name
			FROM sessions s
			JOIN users u ON u.id = s.user_id
			WHERE s.id = ${sessionId}
			AND s.expires_at > NOW()
		`;
		event.locals.user = rows[0] ?? null;
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};