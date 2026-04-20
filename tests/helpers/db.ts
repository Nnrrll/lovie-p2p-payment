import { Client } from 'pg';
import { AccountRepository } from '../../src/repositories/account.repo.js';
import { UserRepository } from '../../src/repositories/user.repo.js';

export function createTestClient() {
  return new Client({
    user: process.env.DB_USER ?? 'lovie_user',
    host: process.env.DB_HOST ?? 'localhost',
    database: process.env.DB_NAME ?? 'lovie_payments',
    password: process.env.DB_PASSWORD ?? 'lovie_password',
    port: Number(process.env.DB_PORT ?? '5432'),
  });
}

export async function resetDatabase(client: Client) {
  await client.query('TRUNCATE payment_requests, accounts, users CASCADE');
}

export async function seedDemoUsers(client: Client) {
  const userRepo = new UserRepository(client);
  const accountRepo = new AccountRepository(client);

  const alice = await userRepo.create('alice@lovie.com', '+15555550101');
  const bob = await userRepo.create('bob@lovie.com', '+15555550102');
  const charlie = await userRepo.create('charlie@lovie.com', '+15555550103');

  await accountRepo.create(alice.user_id, 1000, 'USD');
  await accountRepo.create(bob.user_id, 450, 'USD');
  await accountRepo.create(charlie.user_id, 120, 'USD');

  return {
    alice,
    bob,
    charlie,
  };
}
