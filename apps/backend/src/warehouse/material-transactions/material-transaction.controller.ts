import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import type {
  MaterialInboundPayload,
  MaterialOutboundPayload,
  MaterialReturnPayload,
} from '@company/api-contract';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { Audit } from '../../operation-log/audit.decorator.js';
import { readPagination } from '../../shared/request-utils.js';
import { MaterialTransactionRepository } from './material-transaction.repository.js';

@UseGuards(PermissionGuard)
@Controller('warehouse/material-transactions')
export class MaterialTransactionController {
  constructor(
    @Inject(MaterialTransactionRepository)
    private readonly transactions: MaterialTransactionRepository,
  ) {}

  @RequirePermission(PERMISSIONS.warehouse.materialTransactions.view)
  @Get()
  list(
    @Query('keyword') keyword?: string,
    @Query('transactionType') transactionType?: string,
    @Query('materialBatchNo') materialBatchNo?: string,
    @Query('supplierName') supplierName?: string,
    @Query('productionBatchNo') productionBatchNo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.transactions.list(
      { keyword, transactionType, materialBatchNo, supplierName, productionBatchNo },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.warehouse.materialTransactions.view)
  @Get('demands')
  listDemandOptions() {
    return this.transactions.listDemandOptions();
  }

  @RequirePermission(PERMISSIONS.warehouse.materialTransactions.inbound)
  @Audit({
    module: 'warehouse',
    action: '物料入库',
    targetType: 'material_transaction',
    businessKeyBodyField: 'materialBatchNo',
  })
  @Post('inbound')
  inbound(@Body() body: MaterialInboundPayload, @CurrentUser('id') userId: string) {
    return this.transactions.inbound(body, Number(userId));
  }

  @RequirePermission(PERMISSIONS.warehouse.materialTransactions.outbound)
  @Audit({
    module: 'warehouse',
    action: '生产领料出库',
    targetType: 'material_transaction',
  })
  @Post('outbound')
  outbound(@Body() body: MaterialOutboundPayload, @CurrentUser('id') userId: string) {
    return this.transactions.outbound(body, Number(userId));
  }

  @RequirePermission(PERMISSIONS.warehouse.materialTransactions.return)
  @Audit({
    module: 'warehouse',
    action: '生产退料',
    targetType: 'material_transaction',
  })
  @Post('return')
  returnMaterial(@Body() body: MaterialReturnPayload, @CurrentUser('id') userId: string) {
    return this.transactions.returnMaterial(body, Number(userId));
  }
}
