import type { Pool } from 'pg';
import { AccountRepository } from '../repositories/account.repo.js';
import {
  PaymentRequestRepository,
  type ListRequestsOptions,
} from '../repositories/payment-request.repo.js';
import { UserRepository } from '../repositories/user.repo.js';
import { HttpError } from '../lib/http-error.js';
import {
  normalizeCurrency,
  normalizePhone,
  parseListNumber,
  parsePositiveAmount,
  sanitizeMemo,
} from '../lib/validation.js';
import type {
  PaginatedPaymentRequests,
  PaymentRequestDetails,
  PaymentRequestRecord,
} from '../types/index.js';

type CreatePaymentRequestInput = {
  requesterId: string;
  recipientIdentifier: string;
  amount: number | string;
  currency: string;
  memo: string | null;
};

type ListPaymentRequestsInput = {
  userId: string;
  status: string | undefined;
  search: string | undefined;
  page: string | undefined;
  limit: string | undefined;
};

export class PaymentRequestService {
  constructor(
    private readonly db: Pool,
    private readonly appBaseUrl: string,
  ) {}

  async createRequest(input: CreatePaymentRequestInput): Promise<PaymentRequestDetails> {
    const userRepo = new UserRepository(this.db);
    const requestRepo = new PaymentRequestRepository(this.db, this.appBaseUrl);

    const amount = parsePositiveAmount(input.amount);
    const currency = normalizeCurrency(input.currency);
    const memo = sanitizeMemo(input.memo);
    const identifier = input.recipientIdentifier.trim();

    if (!identifier) {
      throw new HttpError(400, 'Recipient email or phone is required');
    }

    const recipient = await userRepo.findByIdentifier(identifier);

    if (!recipient) {
      throw new HttpError(404, 'Recipient not found');
    }

    if (recipient.user_id === input.requesterId) {
      throw new HttpError(400, 'Users cannot request money from themselves');
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const createdRequest = await requestRepo.create({
      requester_id: input.requesterId,
      recipient_id: recipient.user_id,
      amount,
      currency,
      memo,
      expires_at: expiresAt,
    });

    const requestDetails = await requestRepo.findDetailsByIdForUser(
      createdRequest.request_id,
      input.requesterId,
    );

    if (!requestDetails) {
      throw new HttpError(500, 'Created request could not be loaded');
    }

    return requestDetails;
  }

  async listOutgoing(input: ListPaymentRequestsInput): Promise<PaginatedPaymentRequests> {
    return this.listRequests('outgoing', input);
  }

  async listIncoming(input: ListPaymentRequestsInput): Promise<PaginatedPaymentRequests> {
    return this.listRequests('incoming', input);
  }

  async getRequestForUser(requestId: string, userId: string): Promise<PaymentRequestDetails> {
    const requestRepo = new PaymentRequestRepository(this.db, this.appBaseUrl);

    await requestRepo.expireStaleRequests();

    const requestDetails = await requestRepo.findDetailsByIdForUser(requestId, userId);

    if (!requestDetails) {
      throw new HttpError(404, 'Payment request not found');
    }

    return requestDetails;
  }

  async payRequest(requestId: string, recipientUserId: string): Promise<PaymentRequestDetails> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const requestRepo = new PaymentRequestRepository(client, this.appBaseUrl);
      const accountRepo = new AccountRepository(client);

      await requestRepo.expireStaleRequests();

      const request = this.assertPendingRequestCanBeActioned(
        await requestRepo.findById(requestId, { forUpdate: true }),
        requestId,
      );

      if (request.recipient_id !== recipientUserId) {
        throw new HttpError(403, 'Only the assigned recipient can pay this request');
      }

      const payerAccount = await accountRepo.findByUserId(recipientUserId, { forUpdate: true });
      const requesterAccount = await accountRepo.findByUserId(request.requester_id, { forUpdate: true });

      if (!payerAccount || !requesterAccount) {
        throw new HttpError(500, 'Account state is invalid for this payment request');
      }

      if (payerAccount.balance < request.amount) {
        throw new HttpError(409, 'Insufficient funds');
      }

      await accountRepo.updateBalance(
        payerAccount.account_id,
        payerAccount.balance - request.amount,
        payerAccount.version,
      );

      await accountRepo.updateBalance(
        requesterAccount.account_id,
        requesterAccount.balance + request.amount,
        requesterAccount.version,
      );

      await requestRepo.updateStatus(request.request_id, 'PAID');

      await client.query('COMMIT');

      const committedRepo = new PaymentRequestRepository(this.db, this.appBaseUrl);
      const requestDetails = await committedRepo.findDetailsByIdForUser(request.request_id, recipientUserId);

      if (!requestDetails) {
        throw new HttpError(404, 'Payment request not found');
      }

      return requestDetails;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async declineRequest(requestId: string, recipientUserId: string): Promise<PaymentRequestDetails> {
    const requestRepo = new PaymentRequestRepository(this.db, this.appBaseUrl);

    await requestRepo.expireStaleRequests();

    const request = this.assertPendingRequestCanBeActioned(
      await requestRepo.findById(requestId),
      requestId,
    );

    if (request.recipient_id !== recipientUserId) {
      throw new HttpError(403, 'Only the assigned recipient can decline this request');
    }

    await requestRepo.updateStatus(request.request_id, 'DECLINED');

    const requestDetails = await requestRepo.findDetailsByIdForUser(request.request_id, recipientUserId);

    if (!requestDetails) {
      throw new HttpError(404, 'Payment request not found');
    }

    return requestDetails;
  }

  async cancelRequest(requestId: string, requesterUserId: string): Promise<PaymentRequestDetails> {
    const requestRepo = new PaymentRequestRepository(this.db, this.appBaseUrl);

    await requestRepo.expireStaleRequests();

    const request = this.assertPendingRequestCanBeActioned(
      await requestRepo.findById(requestId),
      requestId,
    );

    if (request.requester_id !== requesterUserId) {
      throw new HttpError(403, 'Only the requester can cancel this request');
    }

    await requestRepo.updateStatus(request.request_id, 'CANCELLED');

    const requestDetails = await requestRepo.findDetailsByIdForUser(request.request_id, requesterUserId);

    if (!requestDetails) {
      throw new HttpError(404, 'Payment request not found');
    }

    return requestDetails;
  }

  private async listRequests(
    direction: 'incoming' | 'outgoing',
    input: ListPaymentRequestsInput,
  ): Promise<PaginatedPaymentRequests> {
    const requestRepo = new PaymentRequestRepository(this.db, this.appBaseUrl);

    await requestRepo.expireStaleRequests();

    const options: ListRequestsOptions = {
      userId: input.userId,
      status: input.status?.trim().toUpperCase(),
      search: input.search?.trim(),
      page: parseListNumber(input.page, 1),
      limit: parseListNumber(input.limit, 20, 1, 50),
    };

    return direction === 'incoming'
      ? requestRepo.findIncoming(options)
      : requestRepo.findOutgoing(options);
  }

  private assertPendingRequestCanBeActioned(
    request: PaymentRequestRecord | null,
    requestId: string,
  ): PaymentRequestRecord {
    if (!request) {
      throw new HttpError(404, `Payment request ${requestId} not found`);
    }

    if (request.status === 'EXPIRED') {
      throw new HttpError(403, 'Expired requests cannot be actioned');
    }

    if (request.status !== 'PENDING') {
      throw new HttpError(409, `Only pending requests can be actioned (current status: ${request.status})`);
    }

    if (request.expires_at.getTime() <= Date.now()) {
      throw new HttpError(403, 'Expired requests cannot be actioned');
    }

    return request;
  }
}
