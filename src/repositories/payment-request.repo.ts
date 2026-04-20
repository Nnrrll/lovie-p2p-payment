import type { Pool, PoolClient } from 'pg';
import type {
  PaginatedPaymentRequests,
  PaymentRequestDetails,
  PaymentRequestRecord,
  PaymentRequestStatus,
} from '../types/index.js';

export interface CreatePaymentRequestDto {
  requester_id: string;
  recipient_id: string;
  amount: number;
  currency: string;
  memo: string | null;
  expires_at: Date;
}

export interface ListRequestsOptions {
  userId: string;
  status: string | undefined;
  search: string | undefined;
  page: number;
  limit: number;
}

type RequestRow = {
  request_id: string;
  requester_id: string;
  recipient_id: string;
  amount: string | number;
  currency: string;
  status: PaymentRequestStatus;
  memo: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  expires_at: Date | string;
  requester_email: string;
  requester_phone: string;
  recipient_email: string;
  recipient_phone: string;
};

const BASE_SELECT = `
  SELECT
    pr.request_id,
    pr.requester_id,
    pr.recipient_id,
    pr.amount,
    pr.currency,
    pr.status,
    pr.memo,
    pr.created_at,
    pr.updated_at,
    pr.expires_at,
    requester.email AS requester_email,
    requester.phone AS requester_phone,
    recipient.email AS recipient_email,
    recipient.phone AS recipient_phone
  FROM payment_requests pr
  JOIN users requester ON requester.user_id = pr.requester_id
  JOIN users recipient ON recipient.user_id = pr.recipient_id
`;

export class PaymentRequestRepository {
  constructor(
    private readonly db: Pool | PoolClient,
    private readonly appBaseUrl = 'http://localhost:5173',
  ) {}

  async create(dto: CreatePaymentRequestDto): Promise<PaymentRequestRecord> {
    const query = `
      INSERT INTO payment_requests (requester_id, recipient_id, amount, currency, memo, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      dto.requester_id,
      dto.recipient_id,
      dto.amount,
      dto.currency,
      dto.memo,
      dto.expires_at,
    ]);

    return this.mapRecord(result.rows[0]);
  }

  async findById(
    requestId: string,
    options?: { forUpdate?: boolean },
  ): Promise<PaymentRequestRecord | null> {
    const lockClause = options?.forUpdate ? ' FOR UPDATE' : '';
    const result = await this.db.query(
      `SELECT * FROM payment_requests WHERE request_id = $1 LIMIT 1${lockClause}`,
      [requestId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRecord(result.rows[0]);
  }

  async findDetailsByIdForUser(
    requestId: string,
    userId: string,
  ): Promise<PaymentRequestDetails | null> {
    const query = `
      ${BASE_SELECT}
      WHERE pr.request_id = $1
        AND (pr.requester_id = $2 OR pr.recipient_id = $2)
      LIMIT 1
    `;

    const result = await this.db.query(query, [requestId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDetails(result.rows[0] as RequestRow);
  }

  async updateStatus(requestId: string, status: PaymentRequestStatus) {
    await this.db.query(
      `
        UPDATE payment_requests
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE request_id = $2
      `,
      [status, requestId],
    );
  }

  async expireStaleRequests(): Promise<number> {
    const result = await this.db.query(
      `
        UPDATE payment_requests
        SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
        WHERE status = 'PENDING'
          AND expires_at <= CURRENT_TIMESTAMP
      `,
    );

    return result.rowCount ?? 0;
  }

  async findOutgoing(options: ListRequestsOptions): Promise<PaginatedPaymentRequests> {
    return this.listByDirection('outgoing', options);
  }

  async findIncoming(options: ListRequestsOptions): Promise<PaginatedPaymentRequests> {
    return this.listByDirection('incoming', options);
  }

  private async listByDirection(
    direction: 'incoming' | 'outgoing',
    options: ListRequestsOptions,
  ): Promise<PaginatedPaymentRequests> {
    const values: Array<string | number> = [options.userId];
    const filters: string[] = [
      direction === 'incoming' ? 'pr.recipient_id = $1' : 'pr.requester_id = $1',
    ];

    let parameterIndex = 2;

    if (options.status && options.status !== 'ALL') {
      filters.push(`pr.status = $${parameterIndex}`);
      values.push(options.status);
      parameterIndex += 1;
    }

    if (options.search) {
      const participantAlias = direction === 'incoming' ? 'requester' : 'recipient';
      filters.push(
        `(${participantAlias}.email ILIKE $${parameterIndex} OR ${participantAlias}.phone ILIKE $${parameterIndex})`,
      );
      values.push(`%${options.search}%`);
      parameterIndex += 1;
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;
    const countResult = await this.db.query(
      `
        SELECT COUNT(*)::int AS total
        FROM payment_requests pr
        JOIN users requester ON requester.user_id = pr.requester_id
        JOIN users recipient ON recipient.user_id = pr.recipient_id
        ${whereClause}
      `,
      values,
    );

    const offset = (options.page - 1) * options.limit;
    const dataValues = [...values, options.limit, offset];
    const dataQuery = `
      ${BASE_SELECT}
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${parameterIndex} OFFSET $${parameterIndex + 1}
    `;

    const dataResult = await this.db.query(dataQuery, dataValues);

    return {
      requests: dataResult.rows.map((row) => this.mapDetails(row as RequestRow)),
      total: Number(countResult.rows[0]?.total ?? 0),
      page: options.page,
      limit: options.limit,
    };
  }

  private mapRecord(row: Record<string, unknown>): PaymentRequestRecord {
    return {
      request_id: String(row.request_id),
      requester_id: String(row.requester_id),
      recipient_id: String(row.recipient_id),
      amount: Number(row.amount),
      currency: String(row.currency),
      status: row.status as PaymentRequestStatus,
      memo: row.memo === null ? null : String(row.memo),
      created_at: new Date(String(row.created_at)),
      updated_at: new Date(String(row.updated_at)),
      expires_at: new Date(String(row.expires_at)),
    };
  }

  private mapDetails(row: RequestRow): PaymentRequestDetails {
    const createdAt = new Date(row.created_at);
    const updatedAt = new Date(row.updated_at);
    const expiresAt = new Date(row.expires_at);
    const expiresInSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    const isExpired = row.status === 'EXPIRED' || expiresInSeconds === 0;

    return {
      request_id: row.request_id,
      requester_id: row.requester_id,
      recipient_id: row.recipient_id,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      memo: row.memo,
      created_at: createdAt,
      updated_at: updatedAt,
      expires_at: expiresAt,
      requester: {
        user_id: row.requester_id,
        email: row.requester_email,
        phone: row.requester_phone,
      },
      recipient: {
        user_id: row.recipient_id,
        email: row.recipient_email,
        phone: row.recipient_phone,
      },
      shareable_link: `${this.appBaseUrl}/requests/${row.request_id}`,
      is_expired: isExpired,
      expires_in_seconds: isExpired ? 0 : expiresInSeconds,
    };
  }
}
