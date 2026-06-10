import type { ResultSetHeader } from 'mysql2';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../database/database.service.js';

export type DbExecutor = DatabaseService | PoolConnection;
export const buildFilters = (
  baseClauses: string[],
  filters: Array<{ clause: string; params: QueryParam[] } | null>,
) => {
  const params: QueryParam[] = [];
  const clauses = [...baseClauses];

  for (const filter of filters) {
    if (filter) {
      clauses.push(filter.clause);
      params.push(...filter.params);
    }
  }

  return {
    where: clauses.join(' AND '),
    params,
  };
};

export const query = async <T extends RowDataPacket[]>(
  executor: DbExecutor,
  sql: string,
  params: QueryParam[] = [],
) => {
  if (executor instanceof DatabaseService) {
    return executor.query<T>(sql, params);
  }

  const [rows] = await executor.query<T>(sql, params);
  return rows;
};

export const execute = async (executor: DbExecutor, sql: string, params: QueryParam[] = []) => {
  if (executor instanceof DatabaseService) {
    return executor.execute(sql, params) as Promise<ResultSetHeader>;
  }

  const [result] = await executor.execute(sql, params);
  return result as ResultSetHeader;
};

export const nullableId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number(value);
};

export const toTinyInt = (value: number | boolean) => Number(value ? 1 : 0);
