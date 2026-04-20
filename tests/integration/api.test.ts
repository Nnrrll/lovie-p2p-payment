import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app/index.js';
import { createTestClient, resetDatabase, seedDemoUsers } from '../helpers/db.js';

const client = createTestClient();

describe('API integration', () => {
  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await resetDatabase(client);
    await seedDemoUsers(client);
  });

  afterAll(async () => {
    await client.end();
    await app.close();
  });

  it('logs in, creates a request, and lists it in the sender dashboard', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'alice@lovie.com' },
    });

    expect(login.statusCode).toBe(200);
    const sessionToken = login.json().session_token as string;

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/payment-requests',
      headers: { authorization: `Bearer ${sessionToken}` },
      payload: {
        recipient_identifier: 'bob@lovie.com',
        amount: 31.25,
        currency: 'USD',
        memo: 'API create test',
      },
    });

    expect(created.statusCode).toBe(201);
    expect(created.json().status).toBe('PENDING');

    const outgoing = await app.inject({
      method: 'GET',
      url: '/api/v1/payment-requests/outgoing?status=PENDING',
      headers: { authorization: `Bearer ${sessionToken}` },
    });

    expect(outgoing.statusCode).toBe(200);
    expect(outgoing.json().total).toBe(1);
    expect(outgoing.json().requests[0].recipient.email).toBe('bob@lovie.com');
  });

  it('settles an incoming request and updates status for both users', async () => {
    const alice = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'alice@lovie.com' },
    });
    const bob = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'bob@lovie.com' },
    });

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/payment-requests',
      headers: { authorization: `Bearer ${alice.json().session_token}` },
      payload: {
        recipient_identifier: 'bob@lovie.com',
        amount: 12,
        currency: 'USD',
        memo: 'Settlement check',
      },
    });

    const paid = await app.inject({
      method: 'POST',
      url: `/api/v1/payment-requests/${created.json().request_id}/pay`,
      headers: { authorization: `Bearer ${bob.json().session_token}` },
    });

    expect(paid.statusCode).toBe(200);
    expect(paid.json().status).toBe('PAID');

    const detail = await app.inject({
      method: 'GET',
      url: `/api/v1/payment-requests/${created.json().request_id}`,
      headers: { authorization: `Bearer ${alice.json().session_token}` },
    });

    expect(detail.statusCode).toBe(200);
    expect(detail.json().status).toBe('PAID');
  });

  it('rejects unauthenticated payment-request access', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/payment-requests/outgoing',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('Unauthorized');
  });
});
