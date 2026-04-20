import { Client } from 'pg';
import { applySchema } from '../src/db/bootstrap.js';

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

async function setupDatabase() {
  try {
    await client.connect();
    await applySchema(client);
    console.log('Database schema applied successfully');
  } catch (error) {
    console.error('Error setting up the database:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

setupDatabase();
