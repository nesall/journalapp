import type { Handle } from '@sveltejs/kit';
import sql from '$lib/db';
import { SESSION_TIMEOUT_MINUTES } from '$env/static/private';
import { getNonExpiredSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');

	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	console.log("hooks.server.ts - event.url", event.url.pathname);

	const isSessionCheck = event.url.pathname.includes('/api/session');

	const session = await getNonExpiredSession(sessionId);
	if (session) {
		event.locals.user = session;
		if (!isSessionCheck) {
			const minutes = parseInt(SESSION_TIMEOUT_MINUTES ?? '30');
			await sql`
            UPDATE sessions SET expires_at = NOW() + INTERVAL '1 minute' * ${minutes}
            WHERE id = ${sessionId}
        `;
		}
	} else {
		event.locals.user = null;
		event.cookies.delete('session_id', { path: '/' });
	}

	return resolve(event);
};