import fs from 'node:fs';
import type { Pool, Client } from 'pg';
import pool from './index.js';
type DbClient = Pool | Client;

type DemoUser = {
  email: string;
  phone: string;
  balance: number;
};

const demoUsers: DemoUser[] = [
  { email: 'alice@lovie.com', phone: '+15555550101', balance: 1250 },
  { email: 'bob@lovie.com', phone: '+15555550102', balance: 420 },
  { email: 'charlie@lovie.com', phone: '+15555550103', balance: 980 },
  { email: 'denise@lovie.com', phone: '+15555550104', balance: 315 },
];

export async function applySchema(db: DbClient = pool) {
  const schema = fs.readFileSync('schema.sql', 'utf-8');
  await db.query(schema);
}

export async function seedDemoDataIfEmpty(db: DbClient = pool) {
  const userCountResult = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
  const userCount = Number(userCountResult.rows[0]?.count ?? '0');

  if (userCount > 0) {
    return false;
  }

  const userIds = new Map<string, string>();

  for (const user of demoUsers) {
    const result = await db.query<{ user_id: string }>(
      `
        INSERT INTO users (email, phone)
        VALUES ($1, $2)
        RETURNING user_id
      `,
      [user.email, user.phone],
    );

    const userId = result.rows[0]?.user_id;
    if (!userId) {
      throw new Error(`Failed to seed demo user ${user.email}`);
    }
    userIds.set(user.email, userId);

    await db.query(
      `
        INSERT INTO accounts (user_id, balance, currency)
        VALUES ($1, $2, 'USD')
      `,
      [userId, user.balance],
    );
  }

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inSixDays = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  await db.query(
    `
      INSERT INTO payment_requests (requester_id, recipient_id, amount, currency, status, memo, created_at, expires_at)
      VALUES ($1, $2, 42.50, 'USD', 'PENDING', 'Dinner split', $3, $4)
    `,
    [userIds.get('alice@lovie.com'), userIds.get('bob@lovie.com'), now, inThreeDays],
  );

  await db.query(
    `
      INSERT INTO payment_requests (requester_id, recipient_id, amount, currency, status, memo, created_at, expires_at)
      VALUES ($1, $2, 18.75, 'USD', 'PAID', 'Coffee run', $3, $4)
    `,
    [userIds.get('bob@lovie.com'), userIds.get('alice@lovie.com'), yesterday, inSixDays],
  );

  await db.query(
    `
      INSERT INTO payment_requests (requester_id, recipient_id, amount, currency, status, memo, created_at, expires_at)
      VALUES ($1, $2, 90.00, 'USD', 'DECLINED', 'Concert tickets', $3, $4)
    `,
    [userIds.get('charlie@lovie.com'), userIds.get('alice@lovie.com'), yesterday, inThreeDays],
  );

  await db.query(
    `
      INSERT INTO payment_requests (requester_id, recipient_id, amount, currency, status, memo, created_at, expires_at)
      VALUES ($1, $2, 55.00, 'USD', 'EXPIRED', 'Expired demo request', $3, $4)
    `,
    [userIds.get('denise@lovie.com'), userIds.get('alice@lovie.com'), tenDaysAgo, threeDaysAgo],
  );

  return true;
}

export async function bootstrapDatabase(db: DbClient = pool) {
  await applySchema(db);
  return seedDemoDataIfEmpty(db);
}
