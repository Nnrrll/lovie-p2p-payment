import type { Pool, PoolClient } from 'pg';
import { isValidEmail, normalizePhone } from '../lib/validation.js';
import type { User } from '../types/index.js';

export class UserRepository {
  constructor(private readonly db: Pool | PoolClient) {}

  async findById(userId: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE user_id = $1 LIMIT 1', [userId]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE phone = $1 LIMIT 1', [phone]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const trimmedIdentifier = identifier.trim();

    if (isValidEmail(trimmedIdentifier)) {
      return this.findByEmail(trimmedIdentifier.toLowerCase());
    }

    const phone = normalizePhone(trimmedIdentifier);
    return phone ? this.findByPhone(phone) : null;
  }

  async create(email: string, phone: string): Promise<User> {
    const result = await this.db.query(
      `
        INSERT INTO users (email, phone)
        VALUES (LOWER($1), $2)
        RETURNING *
      `,
      [email, phone],
    );

    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: Record<string, unknown>): User {
    return {
      user_id: String(row.user_id),
      email: String(row.email),
      phone: String(row.phone),
      status: row.status as User['status'],
      created_at: new Date(String(row.created_at)),
    };
  }
}
