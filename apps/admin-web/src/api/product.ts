import {
  BUSINESS_API,
  type ConfigureProcessRouteProductsPayload,
  type ConfigureProcessRouteStepsPayload,
  type CreateProductCategoryPayload,
  type CreateProductPayload,
  type CreateProcessPayload,
  type CreateProcessRoutePayload,
  type PageResult,
  type ProcessOption,
  type ProcessListItem,
  type ProcessRouteDetail,
  type ProcessRouteListItem,
  type ProductCategoryListItem,
  type ProductListItem,
  type UpdateProductCategoryPayload,
  type UpdateProductPayload,
  type UpdateProcessPayload,
  type UpdateProcessRoutePayload,
  type UploadProcessSopPayload,
} from '@company/api-contract';
import { requestData, type QueryParams } from './shared/request-data';

export const productApi = {
  listProducts: (params?: QueryParams) =>
    requestData<PageResult<ProductListItem>>({
      url: BUSINESS_API.products,
      method: 'GET',
      params,
    }),
  getProduct: (id: string) =>
    requestData<ProductListItem>({
      url: `${BUSINESS_API.products}/${id}`,
      method: 'GET',
    }),
  createProduct: (data: CreateProductPayload) =>
    requestData<ProductListItem>({
      url: BUSINESS_API.products,
      method: 'POST',
      data,
    }),
  updateProduct: (id: string, data: UpdateProductPayload) =>
    requestData<ProductListItem>({
      url: `${BUSINESS_API.products}/${id}`,
      method: 'PUT',
      data,
    }),
  changeProductStatus: (id: string, status: number) =>
    requestData<ProductListItem>({
      url: `${BUSINESS_API.products}/${id}/${status === 1 ? 'enable' : 'disable'}`,
      method: 'PUT',
    }),
  getProductInventory: (id: string) =>
    requestData<{ productId: string; batches: unknown[] }>({
      url: `${BUSINESS_API.products}/${id}/inventory`,
      method: 'GET',
    }),
  getProductRoutes: (id: string) =>
    requestData<{ productId: string; routes: unknown[] }>({
      url: `${BUSINESS_API.products}/${id}/routes`,
      method: 'GET',
    }),
  listRoutes: (params?: QueryParams) =>
    requestData<PageResult<ProcessRouteListItem>>({
      url: BUSINESS_API.routes,
      method: 'GET',
      params,
    }),
  getRoute: (id: string) =>
    requestData<ProcessRouteDetail>({
      url: `${BUSINESS_API.routes}/${id}`,
      method: 'GET',
    }),
  createRoute: (data: CreateProcessRoutePayload) =>
    requestData<ProcessRouteDetail>({
      url: BUSINESS_API.routes,
      method: 'POST',
      data,
    }),
  updateRoute: (id: string, data: UpdateProcessRoutePayload) =>
    requestData<ProcessRouteDetail>({
      url: `${BUSINESS_API.routes}/${id}`,
      method: 'PUT',
      data,
    }),
  deleteRoute: (id: string) =>
    requestData<{ success: boolean }>({
      url: `${BUSINESS_API.routes}/${id}`,
      method: 'DELETE',
    }),
  changeRouteStatus: (id: string, status: number) =>
    requestData<ProcessRouteDetail>({
      url: `${BUSINESS_API.routes}/${id}/${status === 1 ? 'enable' : 'disable'}`,
      method: 'PUT',
    }),
  configureRouteSteps: (id: string, data: ConfigureProcessRouteStepsPayload) =>
    requestData<ProcessRouteDetail>({
      url: `${BUSINESS_API.routes}/${id}/processes`,
      method: 'PUT',
      data,
    }),
  configureRouteProducts: (id: string, data: ConfigureProcessRouteProductsPayload) =>
    requestData<ProcessRouteDetail>({
      url: `${BUSINESS_API.routes}/${id}/products`,
      method: 'PUT',
      data,
    }),
  listProcesses: (params?: QueryParams) =>
    requestData<PageResult<ProcessListItem>>({
      url: BUSINESS_API.processes,
      method: 'GET',
      params,
    }),
  listProcessOptions: () =>
    requestData<ProcessOption[]>({
      url: `${BUSINESS_API.processes}/options`,
      method: 'GET',
    }),
  getProcess: (id: string) =>
    requestData<ProcessListItem>({
      url: `${BUSINESS_API.processes}/${id}`,
      method: 'GET',
    }),
  createProcess: (data: CreateProcessPayload) =>
    requestData<ProcessListItem>({
      url: BUSINESS_API.processes,
      method: 'POST',
      data,
    }),
  updateProcess: (id: string, data: UpdateProcessPayload) =>
    requestData<ProcessListItem>({
      url: `${BUSINESS_API.processes}/${id}`,
      method: 'PUT',
      data,
    }),
  changeProcessStatus: (id: string, status: number) =>
    requestData<ProcessListItem>({
      url: `${BUSINESS_API.processes}/${id}/${status === 1 ? 'enable' : 'disable'}`,
      method: 'PUT',
    }),
  uploadProcessSop: (id: string, data: UploadProcessSopPayload | FormData) =>
    requestData<ProcessListItem>({
      url: `${BUSINESS_API.processes}/${id}/sop`,
      method: 'POST',
      data,
    }),
  listCategories: (params?: QueryParams) =>
    requestData<PageResult<ProductCategoryListItem>>({
      url: BUSINESS_API.productCategories,
      method: 'GET',
      params,
    }),
  getCategory: (id: string) =>
    requestData<ProductCategoryListItem>({
      url: `${BUSINESS_API.productCategories}/${id}`,
      method: 'GET',
    }),
  createCategory: (data: CreateProductCategoryPayload) =>
    requestData<ProductCategoryListItem>({
      url: BUSINESS_API.productCategories,
      method: 'POST',
      data,
    }),
  updateCategory: (id: string, data: UpdateProductCategoryPayload) =>
    requestData<ProductCategoryListItem>({
      url: `${BUSINESS_API.productCategories}/${id}`,
      method: 'PUT',
      data,
    }),
  changeCategoryStatus: (id: string, status: number) =>
    requestData<ProductCategoryListItem>({
      url: `${BUSINESS_API.productCategories}/${id}/${status === 1 ? 'enable' : 'disable'}`,
      method: 'PUT',
    }),
};
