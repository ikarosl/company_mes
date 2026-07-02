import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { PERMISSIONS } from '@company/constants';
import type { FinishedInboundPayload, FinishedOutboundPayload } from '@company/api-contract';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { Audit } from '../../operation-log/audit.decorator.js';
import { readPagination } from '../../shared/request-utils.js';
import { FinishedTransactionRepository } from './finished-transaction.repository.js';

@UseGuards(PermissionGuard)
@Controller('warehouse/finished-transactions')
export class FinishedTransactionController {
  constructor(
    @Inject(FinishedTransactionRepository)
    private readonly transactions: FinishedTransactionRepository,
  ) {}

  @RequirePermission(PERMISSIONS.warehouse.finishedTransactions.view)
  @Get()
  list(
    @Query('keyword') keyword?: string,
    @Query('transactionType') transactionType?: string,
    @Query('inventoryBatchNo') inventoryBatchNo?: string,
    @Query('productionBatchNo') productionBatchNo?: string,
    @Query('objectType') objectType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.transactions.list(
      { keyword, transactionType, inventoryBatchNo, productionBatchNo, objectType },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.warehouse.finishedTransactions.view)
  @Get('inventory-options')
  listInventoryOptions(@Query('keyword') keyword?: string, @Query('objectType') objectType?: string) {
    return this.transactions.listInventoryOptions({ keyword, objectType });
  }

  @RequirePermission(PERMISSIONS.warehouse.finishedTransactions.inbound)
  @Audit({
    module: 'warehouse',
    action: '成/半成品入库',
    targetType: 'product_inventory',
    businessKeyBodyField: 'inventoryBatchNo',
  })
  @Post('inbound')
  inbound(@Body() body: FinishedInboundPayload, @CurrentUser('id') userId: string) {
    return this.transactions.inbound(body, Number(userId));
  }

  @RequirePermission(PERMISSIONS.warehouse.finishedTransactions.outbound)
  @Audit({
    module: 'warehouse',
    action: '成/半成品出库',
    targetType: 'product_inventory',
  })
  @Post('outbound')
  outbound(@Body() body: FinishedOutboundPayload, @CurrentUser('id') userId: string) {
    return this.transactions.outbound(body, Number(userId));
  }
}
