import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { AccountRepository } from '../../src/repositories/account.repo.js';
import { PaymentRequestRepository } from '../../src/repositories/payment-request.repo.js';
import { PaymentRequestService } from '../../src/services/payment-request.service.js';
import { createTestClient, resetDatabase, seedDemoUsers } from '../helpers/db.js';

const client = createTestClient();
const pool = new Pool({
  user: process.env.DB_USER ?? 'lovie_user',
  host: process.env.DB_HOST ?? 'localhost',
  database: process.env.DB_NAME ?? 'lovie_payments',
  password: process.env.DB_PASSWORD ?? 'lovie_password',
  port: Number(process.env.DB_PORT ?? '5432'),
});
const service = new PaymentRequestService(pool, 'http://localhost:5173');
const requestRepo = new PaymentRequestRepository(client, 'http://localhost:5173');
const accountRepo = new AccountRepository(client);

describe('PaymentRequestService', () => {
  let aliceId: string;
  let bobId: string;
  let charlieId: string;

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await resetDatabase(client);
    const users = await seedDemoUsers(client);
    aliceId = users.alice.user_id;
    bobId = users.bob.user_id;
    charlieId = users.charlie.user_id;
  });

  afterAll(async () => {
    await client.end();
    await pool.end();
  });

  it('creates a pending request and supports phone lookup', async () => {
    const request = await service.createRequest({
      requesterId: aliceId,
      recipientIdentifier: '+1 (555) 555-0102',
      amount: '42.50',
      currency: 'USD',
      memo: 'Dinner split',
    });

    expect(request.status).toBe('PENDING');
    expect(request.recipient.email).toBe('bob@lovie.com');
    expect(request.shareable_link).toContain(`/requests/${request.request_id}`);
  });

  it('rejects self requests and invalid amounts', async () => {
    await expect(
      service.createRequest({
        requesterId: aliceId,
        recipientIdentifier: 'alice@lovie.com',
        amount: 10,
        currency: 'USD',
        memo: 'Self',
      }),
    ).rejects.toThrow('Users cannot request money from themselves');

    await expect(
      service.createRequest({
        requesterId: aliceId,
        recipientIdentifier: 'bob@lovie.com',
        amount: 0,
        currency: 'USD',
        memo: 'Zero',
      }),
    ).rejects.toThrow('Amount must be greater than zero');

    await expect(
      service.createRequest({
        requesterId: aliceId,
        recipientIdentifier: 'bob@lovie.com',
        amount: '12.345',
        currency: 'USD',
        memo: 'Too precise',
      }),
    ).rejects.toThrow('Amount must be a positive number with up to 2 decimal places');
  });

  it('pays a pending request and moves balances atomically', async () => {
    const created = await service.createRequest({
      requesterId: aliceId,
      recipientIdentifier: 'bob@lovie.com',
      amount: 25,
      currency: 'USD',
      memo: 'Lunch',
    });

    const paid = await service.payRequest(created.request_id, bobId);
    const aliceAccount = await accountRepo.findByUserId(aliceId);
    const bobAccount = await accountRepo.findByUserId(bobId);

    expect(paid.status).toBe('PAID');
    expect(aliceAccount?.balance).toBe(1025);
    expect(bobAccount?.balance).toBe(425);
  });

  it('blocks insufficient funds and expired requests', async () => {
    const expensive = await service.createRequest({
      requesterId: aliceId,
      recipientIdentifier: 'charlie@lovie.com',
      amount: 200,
      currency: 'USD',
      memo: 'Trip',
    });

    await expect(service.payRequest(expensive.request_id, charlieId)).rejects.toThrow(
      'Insufficient funds',
    );

    const expired = await requestRepo.create({
      requester_id: aliceId,
      recipient_id: bobId,
      amount: 10,
      currency: 'USD',
      memo: 'Expired',
      expires_at: new Date(Date.now() - 60_000),
    });

    await expect(service.payRequest(expired.request_id, bobId)).rejects.toThrow(
      'Expired requests cannot be actioned',
    );
  });

  it('declines incoming requests and cancels outgoing requests', async () => {
    const first = await service.createRequest({
      requesterId: aliceId,
      recipientIdentifier: 'bob@lovie.com',
      amount: 18,
      currency: 'USD',
      memo: 'Coffee',
    });

    const second = await service.createRequest({
      requesterId: aliceId,
      recipientIdentifier: 'charlie@lovie.com',
      amount: 15,
      currency: 'USD',
      memo: 'Taxi',
    });

    const declined = await service.declineRequest(first.request_id, bobId);
    const cancelled = await service.cancelRequest(second.request_id, aliceId);

    expect(declined.status).toBe('DECLINED');
    expect(cancelled.status).toBe('CANCELLED');
  });
});
