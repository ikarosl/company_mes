import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AuditContextService } from './audit-context.service.js';
import { sanitizeAuditData } from './audit-data.js';
import { readAuditMeta, readErrorCode, readHttpStatus } from './audit.interceptor.js';

describe('operation log audit helpers', () => {
  it('redacts sensitive values recursively', () => {
    expect(
      sanitizeAuditData({
        username: 'operator',
        password: 'plain-text',
        nested: {
          accessToken: 'token-value',
          quantity: 12,
        },
      }),
    ).toEqual({
      username: 'operator',
      password: '[REDACTED]',
      nested: {
        accessToken: '[REDACTED]',
        quantity: 12,
      },
    });
  });

  it('records all configured target ids for nested routes', () => {
    const meta = readAuditMeta(
      {
        method: 'PUT',
        path: '/worker/tasks/2/steps/1',
        params: { id: '2', recordId: '1' },
        headers: {},
      },
      {
        module: 'production',
        action: '员工工序报工',
        targetType: 'batch_step_record',
        targetParams: {
          productionBatchId: 'id',
          stepRecordId: 'recordId',
        },
      },
    );

    expect(meta.targetId).toBe('2');
    expect(meta.targetIds).toEqual({
      productionBatchId: '2',
      stepRecordId: '1',
    });
  });

  it('extracts status and error code for failed requests', () => {
    const error = new BadRequestException('invalid quantity');
    expect(readHttpStatus(error)).toBe(400);
    expect(readErrorCode(error)).toBe('BadRequestException');
  });

  it('keeps concurrent audit snapshots isolated', async () => {
    const context = new AuditContextService();
    const first = context.run(async () => {
      context.setBeforeData({ id: 1 });
      await Promise.resolve();
      return context.getSnapshot();
    });
    const second = context.run(async () => {
      context.setBeforeData({ id: 2 });
      await Promise.resolve();
      return context.getSnapshot();
    });

    await expect(first).resolves.toEqual({ beforeData: { id: 1 } });
    await expect(second).resolves.toEqual({ beforeData: { id: 2 } });
  });
});
