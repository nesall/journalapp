import type { Handle } from '@sveltejs/kit';
import sql from '$lib/db';
import { SESSION_TIMEOUT_MINUTES } from '$env/static/private';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');

	if (sessionId) {
		const rows = await sql<{ id: string; email: string; display_name: string | null }[]>`
			SELECT u.id, u.email, u.display_name
			FROM sessions s
			JOIN users u ON u.id = s.user_id
			WHERE s.id = ${sessionId}
			AND s.expires_at > NOW()
		`;

		if (0 < rows.length) {
			event.locals.user = rows[0];
			// slide the expiry window on each request
			const minutes = parseInt(SESSION_TIMEOUT_MINUTES ?? '30');
			await sql`
				UPDATE sessions SET expires_at = NOW() + INTERVAL '1 minute' * ${minutes}
				WHERE id = ${sessionId}
				`;
		} else {
			event.locals.user = null;
			event.cookies.delete('session_id', { path: '/' });
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};