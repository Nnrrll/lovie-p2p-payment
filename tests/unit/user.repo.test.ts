import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { UserRepository } from '../../src/repositories/user.repo.js';
import { createTestClient, resetDatabase, seedDemoUsers } from '../helpers/db.js';

const client = createTestClient();
const repo = new UserRepository(client);

describe('UserRepository', () => {
  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await resetDatabase(client);
    await seedDemoUsers(client);
  });

  afterAll(async () => {
    await client.end();
  });

  it('finds users by email identifier', async () => {
    const user = await repo.findByIdentifier('alice@lovie.com');
    expect(user?.email).toBe('alice@lovie.com');
  });

  it('finds users by phone identifier', async () => {
    const user = await repo.findByIdentifier('+1 (555) 555-0102');
    expect(user?.email).toBe('bob@lovie.com');
  });

  it('returns null for unknown identifiers', async () => {
    const user = await repo.findByIdentifier('nobody@example.com');
    expect(user).toBeNull();
  });
});
