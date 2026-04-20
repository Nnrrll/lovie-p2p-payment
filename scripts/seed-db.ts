import { Client } from 'pg';

const client = new Client(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      }
    : {
        user: process.env.DB_USER ?? 'lovie_user',
        host: process.env.DB_HOST ?? 'localhost',
        database: process.env.DB_NAME ?? 'lovie_payments',
        password: process.env.DB_PASSWORD ?? 'lovie_password',
        port: Number(process.env.DB_PORT ?? '5432'),
      },
);

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

async function seedDatabase() {
  try {
    await client.connect();
    await client.query('TRUNCATE payment_requests, accounts, users CASCADE');

    const userIds = new Map<string, string>();

    for (const user of demoUsers) {
      const result = await client.query(
        `
          INSERT INTO users (email, phone)
          VALUES ($1, $2)
          RETURNING user_id
        `,
        [user.email, user.phone],
      );

      const userId = result.rows[0].user_id as string;
      userIds.set(user.email, userId);

      await client.query(
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

    await client.query(
      `
        INSERT INTO payment_requests (requester_id, recipient_id, amount, currency, status, memo, created_at, expires_at)
        VALUES ($1, $2, 42.50, 'USD', 'PENDING', 'Dinner split', $3, $4)
      `,
      [userIds.get('alice@lovie.com'), userIds.get('bob@lovie.com'), now, inThreeDays],
    );

    await client.query(
      `
        INSERT INTO payment_requests (requester_id, recipient_id, amount, currency, status, memo, created_at, expires_at)
        VALUES ($1, $2, 18.75, 'USD', 'PAID', 'Coffee run', $3, $4)
      `,
      [userIds.get('bob@lovie.com'), userIds.get('alice@lovie.com'), yesterday, inSixDays],
    );

    await client.query(
      `
        INSERT INTO payment_requests (requester_id, recipient_id, amount, currency, status, memo, created_at, expires_at)
        VALUES ($1, $2, 90.00, 'USD', 'DECLINED', 'Concert tickets', $3, $4)
      `,
      [userIds.get('charlie@lovie.com'), userIds.get('alice@lovie.com'), yesterday, inThreeDays],
    );

    await client.query(
      `
        INSERT INTO payment_requests (requester_id, recipient_id, amount, currency, status, memo, created_at, expires_at)
        VALUES ($1, $2, 55.00, 'USD', 'EXPIRED', 'Groceries', $3, $4)
      `,
      [userIds.get('denise@lovie.com'), userIds.get('alice@lovie.com'), tenDaysAgo, threeDaysAgo],
    );

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding the database:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seedDatabase();
