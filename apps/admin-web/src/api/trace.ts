import { BUSINESS_API, type TraceBatchDetail, type TraceSearchItem } from '@company/api-contract';
import { requestData } from './shared/request-data';

/** 全流程追溯只读接口。 */
export const traceApi = {
  /** 跨工单、批次、物料批次、检验及流转单据统一查询。 */
  search: (keyword?: string) => requestData<TraceSearchItem[]>({
    url: `${BUSINESS_API.trace}/search`, method: 'GET', params: { keyword },
  }),
  /** 获取单个生产批次的完整闭环证据链。 */
  getBatch: (batchId: string) => requestData<TraceBatchDetail>({
    url: `${BUSINESS_API.trace}/batches/${batchId}`, method: 'GET',
  }),
};
