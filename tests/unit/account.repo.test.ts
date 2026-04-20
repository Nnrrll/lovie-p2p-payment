import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountRepository } from '../../src/repositories/account.repo.js';
import { createTestClient, resetDatabase, seedDemoUsers } from '../helpers/db.js';

const client = createTestClient();
const repo = new AccountRepository(client);

describe('AccountRepository', () => {
  let aliceId: string;

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await resetDatabase(client);
    const users = await seedDemoUsers(client);
    aliceId = users.alice.user_id;
  });

  afterAll(async () => {
    await client.end();
  });

  it('finds an account by user id', async () => {
    const account = await repo.findByUserId(aliceId);
    expect(account?.balance).toBe(1000);
    expect(account?.currency).toBe('USD');
  });

  it('enforces optimistic locking on balance updates', async () => {
    const account = await repo.findByUserId(aliceId);
    expect(account).not.toBeNull();

    await repo.updateBalance(account!.account_id, 980, account!.version);

    await expect(repo.updateBalance(account!.account_id, 970, account!.version)).rejects.toThrow(
      'Optimistic locking failure',
    );
  });
});
