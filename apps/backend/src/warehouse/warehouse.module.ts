import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogModule } from '../operation-log/operation-log.module.js';
import { InboundOrderController } from './inbound-orders/inbound-order.controller.js';
import { InboundOrderRepository } from './inbound-orders/inbound-order.repository.js';
import { InventoryRepository } from './inventory/inventory.repository.js';
import { MaterialInventoryController } from './inventory/material-inventory.controller.js';
import { WarehouseItemController } from './items/warehouse-item.controller.js';
import { WarehouseItemRepository } from './items/warehouse-item.repository.js';
import { OutboundOrderController } from './outbound-orders/outbound-order.controller.js';
import { OutboundOrderRepository } from './outbound-orders/outbound-order.repository.js';
import { ReturnOrderController } from './return-orders/return-order.controller.js';
import { ReturnOrderRepository } from './return-orders/return-order.repository.js';
import { ItemScrapController } from './scraps/item-scrap.controller.js';
import { ItemScrapRepository } from './scraps/item-scrap.repository.js';
import { StockCheckController } from './stock-checks/stock-check.controller.js';
import { StockCheckRepository } from './stock-checks/stock-check.repository.js';

@Module({
  imports: [AuthModule, DatabaseModule, OperationLogModule],
  controllers: [
    WarehouseItemController,
    MaterialInventoryController,
    InboundOrderController,
    OutboundOrderController,
    ReturnOrderController,
    ItemScrapController,
    StockCheckController,
  ],
  providers: [
    WarehouseItemRepository,
    InventoryRepository,
    InboundOrderRepository,
    OutboundOrderRepository,
    ReturnOrderRepository,
    ItemScrapRepository,
    StockCheckRepository,
  ],
})
export class WarehouseModule {}
