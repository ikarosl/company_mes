import {
  BUSINESS_API,
  type CreateInspectionPayload,
  type InspectionListItem,
  type PendingProcessInspectionItem,
  type InspectionTargetOption,
  type PageResult,
  type ReworkListItem,
  type CreateReworkPayload,
  type UpdateReworkPayload,
  type AssignReworkHandlerPayload,
  type SubmitReworkResultPayload,
  type CreateReworkRecheckPayload,
  type UpdateInspectionPayload,
  type SubmitProcessInspectionPayload,
} from '@company/api-contract';
import { requestData, type QueryParams } from './shared/request-data';
export const qualityApi = {
  /** 查询检测端由需检工序动态派生的待检任务。 */
  listPendingProcessTasks: (params?: QueryParams) =>
    requestData<PageResult<PendingProcessInspectionItem>>({
      url: BUSINESS_API.inspectorTasks,
      method: 'GET',
      params,
    }),
  /** 提交过程检验结果，成功后对应待检任务自动消失。 */
  submitProcessInspection: (id: string, data: SubmitProcessInspectionPayload) =>
    requestData<InspectionListItem>({
      url: `${BUSINESS_API.inspectorTasks}/${id}/result`,
      method: 'PUT',
      data,
    }),
  list: (params?: QueryParams) =>
    requestData<PageResult<InspectionListItem>>({
      url: BUSINESS_API.qualityInspections,
      method: 'GET',
      params,
    }),
  targets: (params?: QueryParams) =>
    requestData<InspectionTargetOption[]>({
      url: `${BUSINESS_API.qualityInspections}/targets`,
      method: 'GET',
      params,
    }),
  create: (data: CreateInspectionPayload) =>
    requestData<InspectionListItem>({ url: BUSINESS_API.qualityInspections, method: 'POST', data }),
  update: (id: string, data: UpdateInspectionPayload) =>
    requestData<InspectionListItem>({
      url: `${BUSINESS_API.qualityInspections}/${id}`,
      method: 'PUT',
      data,
    }),
  /** 从不合格或部分合格的检验记录发起返工。 */
  createRework: (inspectionId: string, data: Omit<CreateReworkPayload, 'sourceInspectionId'>) =>
    requestData<ReworkListItem>({
      url: `${BUSINESS_API.qualityInspections}/${inspectionId}/rework`,
      method: 'POST',
      data,
    }),
  /** 分页查询返工记录。 */
  listReworks: (params?: QueryParams) =>
    requestData<PageResult<ReworkListItem>>({
      url: BUSINESS_API.qualityReworks,
      method: 'GET',
      params,
    }),
  /** 查询单条返工记录详情。 */
  getRework: (id: string) =>
    requestData<ReworkListItem>({ url: `${BUSINESS_API.qualityReworks}/${id}`, method: 'GET' }),
  /** 编辑尚未开始的返工要求。 */
  updateRework: (id: string, data: UpdateReworkPayload) =>
    requestData<ReworkListItem>({ url: `${BUSINESS_API.qualityReworks}/${id}`, method: 'PUT', data }),
  /** 指定返工负责人并进入处理中状态。 */
  assignReworkHandler: (id: string, data: AssignReworkHandlerPayload) =>
    requestData<ReworkListItem>({ url: `${BUSINESS_API.qualityReworks}/${id}/owner`, method: 'PUT', data }),
  /** 填写返工执行结果并等待复检。 */
  submitReworkResult: (id: string, data: SubmitReworkResultPayload) =>
    requestData<ReworkListItem>({ url: `${BUSINESS_API.qualityReworks}/${id}/result`, method: 'PUT', data }),
  /** 创建返工后的复检记录并关闭返工闭环。 */
  reinspectRework: (id: string, data: CreateReworkRecheckPayload) =>
    requestData<{ rework: ReworkListItem; recheckInspectionId: string }>({
      url: `${BUSINESS_API.qualityReworks}/${id}/reinspect`,
      method: 'POST',
      data,
    }),
};
