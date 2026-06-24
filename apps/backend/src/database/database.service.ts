import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPool, type Pool, type PoolConnection, type RowDataPacket } from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = createPool({
      host: requiredEnv('DB_HOST'),
      port: positiveIntegerEnv('DB_PORT'),
      user: requiredEnv('DB_USER'),
      password: requiredEnv('DB_PASSWORD', true),
      database: requiredEnv('DB_NAME'),
      charset: 'utf8mb4',
      connectionLimit: positiveIntegerEnv('DB_CONNECTION_LIMIT'),
    });
  }

  async query<T extends RowDataPacket[]>(sql: string, params: QueryParam[] = []) {
    const [rows] = await this.pool.query<T>(sql, params);
    return rows;
  }

  async execute(sql: string, params: QueryParam[] = []) {
    const [result] = await this.pool.execute(sql, params);
    return result;
  }

  async transaction<T>(callback: (connection: PoolConnection) => Promise<T>) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

export type QueryParam = string | number | boolean | Date | null;

const requiredEnv = (name: string, allowEmpty = false) => {
  const value = process.env[name];

  if (value === undefined || (!allowEmpty && value.trim() === '')) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const positiveIntegerEnv = (name: string) => {
  const value = Number(requiredEnv(name));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return value;
};
