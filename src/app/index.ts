import crypto from 'node:crypto';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import pool from '../db/index.js';
import { AccountRepository } from '../repositories/account.repo.js';
import { UserRepository } from '../repositories/user.repo.js';
import { PaymentRequestService } from '../services/payment-request.service.js';
import { HttpError, getErrorMessage, isHttpError } from '../lib/http-error.js';
import { isValidEmail } from '../lib/validation.js';
import type { Session } from '../types/index.js';

type LoginBody = {
  email?: string;
};

type CreatePaymentRequestBody = {
  recipient_identifier?: string;
  amount?: number | string;
  currency?: string;
  memo?: string | null;
};

const sessions = new Map<string, Session>();
const appBaseUrl = (process.env.APP_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

function buildCorsHook() {
  const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    return undefined;
  }

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const origin = request.headers.origin;
    const wildcardEnabled = allowedOrigins.includes('*');
    const originAllowed = wildcardEnabled || (origin !== undefined && allowedOrigins.includes(origin));

    if (originAllowed) {
      reply.header('Access-Control-Allow-Origin', wildcardEnabled ? '*' : origin);
      reply.header('Vary', 'Origin');
      reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    }

    if (request.method === 'OPTIONS') {
      reply.code(204).send();
    }
  };
}

async function autoCreateDemoUser(email: string) {
  const userRepo = new UserRepository(pool);
  const accountRepo = new AccountRepository(pool);

  let user = await userRepo.findByEmail(email);

  if (user) {
    return user;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const phone = `+1555${Math.floor(Math.random() * 9000000 + 1000000)}`;

    try {
      user = await userRepo.create(email, phone);
      await accountRepo.create(user.user_id, 1000, 'USD');
      return user;
    } catch (error) {
      const message = getErrorMessage(error);

      if (!message.toLowerCase().includes('duplicate')) {
        throw error;
      }
    }
  }

  throw new HttpError(500, 'Unable to create a demo user right now');
}

function getSessionFromRequest(request: FastifyRequest): Session {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    throw new HttpError(401, 'Unauthorized');
  }

  const session = sessions.get(token);

  if (!session) {
    throw new HttpError(401, 'Unauthorized');
  }

  return session;
}

function sendError(reply: FastifyReply, error: unknown) {
  if (isHttpError(error)) {
    return reply.status(error.statusCode).send({ error: error.message });
  }

  const message = getErrorMessage(error);
  return reply.status(500).send({ error: message || 'Internal Server Error' });
}

export function createApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  const userRepo = new UserRepository(pool);
  const accountRepo = new AccountRepository(pool);
  const paymentRequestService = new PaymentRequestService(pool, appBaseUrl);
  const corsHook = buildCorsHook();

  if (corsHook) {
    app.addHook('onRequest', corsHook);
  }

  app.get('/health', async () => ({
    status: 'ok',
    app_base_url: appBaseUrl,
    time: new Date().toISOString(),
  }));

  app.post('/api/v1/auth/login', async (request, reply) => {
    try {
      const body = (request.body ?? {}) as LoginBody;
      const email = body.email?.trim().toLowerCase();

      if (!email || !isValidEmail(email)) {
        throw new HttpError(400, 'Invalid email format');
      }

      const user = await autoCreateDemoUser(email);
      const sessionToken = crypto.randomUUID();

      sessions.set(sessionToken, {
        user_id: user.user_id,
        email: user.email,
        created_at: Date.now(),
      });

      return reply.status(200).send({
        user: {
          user_id: user.user_id,
          email: user.email,
          phone: user.phone,
        },
        session_token: sessionToken,
      });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.get('/api/v1/auth/me', async (request, reply) => {
    try {
      const session = getSessionFromRequest(request);
      const user = await userRepo.findById(session.user_id);

      if (!user) {
        throw new HttpError(401, 'Unauthorized');
      }

      const account = await accountRepo.findByUserId(session.user_id);

      return reply.status(200).send({
        user: {
          user_id: user.user_id,
          email: user.email,
          phone: user.phone,
        },
        account,
      });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/api/v1/payment-requests', async (request, reply) => {
    try {
      const session = getSessionFromRequest(request);
      const body = (request.body ?? {}) as CreatePaymentRequestBody;

      const createdRequest = await paymentRequestService.createRequest({
        requesterId: session.user_id,
        recipientIdentifier: body.recipient_identifier ?? '',
        amount: body.amount ?? 0,
        currency: body.currency ?? 'USD',
        memo: body.memo ?? null,
      });

      return reply.status(201).send(createdRequest);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.get('/api/v1/payment-requests/outgoing', async (request, reply) => {
    try {
      const session = getSessionFromRequest(request);
      const query = (request.query ?? {}) as Record<string, string | undefined>;

      const result = await paymentRequestService.listOutgoing({
        userId: session.user_id,
        status: query.status,
        search: query.search,
        page: query.page,
        limit: query.limit,
      });

      return reply.status(200).send(result);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.get('/api/v1/payment-requests/incoming', async (request, reply) => {
    try {
      const session = getSessionFromRequest(request);
      const query = (request.query ?? {}) as Record<string, string | undefined>;

      const result = await paymentRequestService.listIncoming({
        userId: session.user_id,
        status: query.status,
        search: query.search,
        page: query.page,
        limit: query.limit,
      });

      return reply.status(200).send(result);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.get('/api/v1/payment-requests/:id', async (request, reply) => {
    try {
      const session = getSessionFromRequest(request);
      const params = request.params as { id: string };
      const requestDetails = await paymentRequestService.getRequestForUser(params.id, session.user_id);
      return reply.status(200).send(requestDetails);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/api/v1/payment-requests/:id/pay', async (request, reply) => {
    try {
      const session = getSessionFromRequest(request);
      const params = request.params as { id: string };
      const updatedRequest = await paymentRequestService.payRequest(params.id, session.user_id);
      return reply.status(200).send(updatedRequest);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/api/v1/payment-requests/:id/decline', async (request, reply) => {
    try {
      const session = getSessionFromRequest(request);
      const params = request.params as { id: string };
      const updatedRequest = await paymentRequestService.declineRequest(params.id, session.user_id);
      return reply.status(200).send(updatedRequest);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/api/v1/payment-requests/:id/cancel', async (request, reply) => {
    try {
      const session = getSessionFromRequest(request);
      const params = request.params as { id: string };
      const updatedRequest = await paymentRequestService.cancelRequest(params.id, session.user_id);
      return reply.status(200).send(updatedRequest);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  return app;
}

const app = createApp();

export async function start() {
  const port = Number(process.env.PORT ?? '3000');
  await app.listen({ port, host: '0.0.0.0' });
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  start().catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
}

export default app;
