import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import sql from '$lib/db';

const SALT_ROUNDS = 12;
const SESSION_TTL_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString('hex');
  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (
      ${sessionId},
      ${userId},
      NOW() + ${SESSION_TTL_DAYS} * INTERVAL '1 day'
    )`;
  return sessionId;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}