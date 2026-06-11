import { toRequestError } from '@company/request';
import type { PageQuery, PageResult } from '@company/api-contract';
import { httpClient } from './http-client';

export type QueryParams = PageQuery & {
  keyword?: string;
  status?: string;
  batchId?: string;
  result?: string;
  assignedUserId?: string;
  recordType?: string;
  materialBatchId?: string;
  materialBatchNo?: string;
  supplierName?: string;
  batchNo?: string;
  logType?: string;
  module?: string;
  userId?: string;
  productAttribute?: string;
  productType?: string;
  categoryId?: string;
  acquireMethod?: string;
  routeId?: string;
};

export const requestData = async <T>(config: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: QueryParams;
  data?: unknown;
}) => {
  try {
    const response = await httpClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw toRequestError(error);
  }
};

export const requestPageItems = async <T>(config: {
  url: string;
  method: 'GET';
  params?: QueryParams;
}) => {
  const page = await requestData<PageResult<T>>(config);
  return page.items;
};
