import { Inject, Injectable } from '@nestjs/common';
import type { OperationLogListItem, PageResult } from '@company/api-contract';
import { OperationLogService } from '../../operation-log/operation-log.service.js';
import type { PaginationOptions } from '../../shared/request-utils.js';

@Injectable()
export class SystemLogRepository {
  constructor(
    @Inject(OperationLogService) private readonly operationLogService: OperationLogService,
  ) {}

  async listOperationLogs(
    filters: {
      keyword?: string;
      logType?: string;
      module?: string;
      result?: string;
      userId?: string;
      action?: string;
      targetType?: string;
      targetId?: string;
      requestId?: string;
      keyword?: string;
      startedAt?: string;
      endedAt?: string;
    },
    pagination: PaginationOptions,
  ): Promise<PageResult<OperationLogListItem>> {
    return this.operationLogService.list(filters, pagination);
  }
}
