import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPool, type Pool, type PoolConnection, type RowDataPacket } from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = createPool({
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '123456',
      database: process.env.DB_NAME ?? 'company_test',
      charset: 'utf8mb4',
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
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
