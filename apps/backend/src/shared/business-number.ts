import type { RowDataPacket } from 'mysql2/promise';
import type { DbExecutor } from './repository.helpers.js';
import { query } from './repository.helpers.js';

/**
 * 业务编号前缀集中配置。
 * 当前采用中文业务名称拼音首字母；正式编号规则确认后只需修改这里或替换生成器。
 */
export const BUSINESS_NUMBER_PREFIX = {
  materialBatch: 'WL',
  workOrder: 'GD',
  productionBatch: 'SCPC',
  productInventoryBatch: 'CP',
  productFlow: 'LL',
  stocktake: 'PD',
  adjustment: 'TZ',
  inspection: 'JY',
  rework: 'FG',
} as const;

type DailyBusinessNumberOptions = {
  prefix: string;
  table: string;
  column: string;
  activeCondition?: string;
  date?: Date;
};

/**
 * 生成“前缀-yyyyMMdd001”的当天递增编号。
 * 表名、字段名只允许由后端固定配置传入，禁止使用接口参数，避免 SQL 标识符注入。
 */
export async function generateDailyBusinessNumber(
  executor: DbExecutor,
  options: DailyBusinessNumberOptions,
) {
  assertSqlIdentifier(options.table);
  assertSqlIdentifier(options.column);

  const dateText = formatCompactDate(options.date ?? new Date());
  const stem = `${options.prefix}-${dateText}`;
  const activeSql = options.activeCondition ? ` AND (${options.activeCondition})` : '';
  const [latest] = await query<(RowDataPacket & { business_no: string })[]>(
    executor,
    `SELECT ${options.column} AS business_no
     FROM ${options.table}
     WHERE ${options.column} LIKE ?${activeSql}
     ORDER BY ${options.column} DESC
     LIMIT 1`,
    [`${stem}%`],
  );

  const previousSequence = latest?.business_no.startsWith(stem)
    ? Number(latest.business_no.slice(stem.length))
    : 0;
  const nextSequence = Number.isInteger(previousSequence) ? previousSequence + 1 : 1;
  return `${stem}${String(nextSequence).padStart(3, '0')}`;
}

/** 格式化业务编号日期，使用服务器本地时区。 */
export function formatCompactDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/** 内部 SQL 标识符白名单校验。 */
function assertSqlIdentifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) {
    throw new Error(`Invalid business number SQL identifier: ${value}`);
  }
}
