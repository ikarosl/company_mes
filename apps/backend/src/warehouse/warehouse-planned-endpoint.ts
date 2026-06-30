import { NotImplementedException } from '@nestjs/common';

/**
 * 统一库存方案的阶段性占位返回。
 *
 * 当前迁移阶段先落路由和权限边界，避免前端菜单联调时出现 404。
 * 真实库存对象、单据和流水写入逻辑会在后续阶段按 `docs/newSqlDesign.md` 分模块实现。
 */
export const plannedWarehouseEndpoint = (featureName: string, context?: unknown): never => {
  void context;
  throw new NotImplementedException(`${featureName}接口已按统一库存方案预留，待后续迁移实现`);
};
