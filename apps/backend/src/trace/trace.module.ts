import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { TraceController } from './trace.controller.js';
import { TraceRepository } from './trace.repository.js';

/** 全流程追溯只读模块：聚合既有业务事实，不复制生产或库存数据。 */
@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [TraceController],
  providers: [TraceRepository],
})
export class TraceModule {}
