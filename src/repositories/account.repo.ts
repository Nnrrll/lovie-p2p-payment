import type { Pool, PoolClient } from 'pg';
import type { Account } from '../types/index.js';

export class AccountRepository {
  constructor(private readonly db: Pool | PoolClient) {}

  async create(userId: string, initialBalance: number, currency: string): Promise<Account> {
    const result = await this.db.query(
      `
        INSERT INTO accounts (user_id, balance, currency)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [userId, initialBalance, currency],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByUserId(
    userId: string,
    options?: { forUpdate?: boolean },
  ): Promise<Account | null> {
    const lockClause = options?.forUpdate ? ' FOR UPDATE' : '';
    const result = await this.db.query(
      `SELECT * FROM accounts WHERE user_id = $1 LIMIT 1${lockClause}`,
      [userId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async updateBalance(
    accountId: string,
    newBalance: number,
    expectedVersion: number,
  ): Promise<Account> {
    const result = await this.db.query(
      `
        UPDATE accounts
        SET balance = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP
        WHERE account_id = $2 AND version = $3
        RETURNING *
      `,
      [newBalance, accountId, expectedVersion],
    );

    if (result.rows.length === 0) {
      throw new Error('Optimistic locking failure');
    }

    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: Record<string, unknown>): Account {
    return {
      account_id: String(row.account_id),
      user_id: String(row.user_id),
      balance: Number(row.balance),
      currency: String(row.currency),
      version: Number(row.version),
      updated_at: new Date(String(row.updated_at)),
    };
  }
}
