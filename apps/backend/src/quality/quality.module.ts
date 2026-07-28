import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogModule } from '../operation-log/operation-log.module.js';
import { InspectionController } from './inspections/inspection.controller.js';
import { InspectionRepository } from './inspections/inspection.repository.js';
import { InspectorTaskController } from './inspections/inspector-task.controller.js';
import { ReworkController } from './reworks/rework.controller.js';
import { ReworkRepository } from './reworks/rework.repository.js';

@Module({
  imports: [AuthModule, DatabaseModule, OperationLogModule],
  controllers: [InspectionController, InspectorTaskController, ReworkController],
  providers: [InspectionRepository, ReworkRepository],
})
export class QualityModule {}
