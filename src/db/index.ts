import { Pool } from 'pg';

const fallbackConfig = {
  user: process.env.DB_USER ?? 'lovie_user',
  host: process.env.DB_HOST ?? 'localhost',
  database: process.env.DB_NAME ?? 'lovie_payments',
  password: process.env.DB_PASSWORD ?? 'lovie_password',
  port: Number(process.env.DB_PORT ?? '5432'),
};

const connectionString = process.env.DATABASE_URL;
const ssl =
  process.env.DATABASE_SSL === 'true' || connectionString?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined;

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl,
        max: 10,
      }
    : {
        ...fallbackConfig,
        max: 10,
      },
);

export default pool;
