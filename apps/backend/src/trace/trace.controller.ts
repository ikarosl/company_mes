import { PERMISSIONS } from '@company/constants';
import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermission } from '../auth/require-permission.decorator.js';
import { readId } from '../shared/request-utils.js';
import { TraceRepository } from './trace.repository.js';

/** 全流程追溯查询接口，仅提供只读证据链。 */
@UseGuards(PermissionGuard)
@RequirePermission(PERMISSIONS.trace.view)
@Controller('trace')
export class TraceController {
  constructor(@Inject(TraceRepository) private readonly trace: TraceRepository) {}

  /** 按工单、批次、产品、物料批次、检验单和库存流转单据统一检索。 */
  @Get('search')
  search(@Query('keyword') keyword?: string) {
    return this.trace.search(keyword?.trim() ?? '');
  }

  /** 返回生产批次从用料到库存流转的完整闭环详情。 */
  @Get('batches/:id')
  getBatch(@Param('id') id: string) {
    return this.trace.getBatch(readId(id));
  }
}
