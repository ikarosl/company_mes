/** 启用状态的跨模块统一字面量，避免各端重复定义。 */
export type BusinessEnabledStatus = 'active' | 'inactive';

/** 所有分页查询共享的可选参数。 */
export interface PageQuery {
  page?: number;
  pageSize?: number;
}

/** 后端分页接口的统一响应数据结构。 */
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
