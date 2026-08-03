/** 追溯闭环状态：由后端按物料、生产、质量和库存事实统一计算。 */
export type TraceClosureStatus = 'closed' | 'in_progress' | 'abnormal' | 'incomplete';

/** 追溯中心搜索结果，一条记录对应一个生产批次。 */
export interface TraceSearchItem {
  workOrderId: string;
  orderNo: string;
  batchId: string;
  batchNo: string;
  productCode: string;
  productModel: string;
  productName: string;
  customerOrderNo: string | null;
  customerName: string | null;
  plannedQuantity: string;
  batchStatus: string;
  closureStatus: TraceClosureStatus;
  issueCount: number;
}

/** 批次追溯概览，保存追溯链路顶部展示所需的稳定业务字段。 */
export interface TraceBatchOverview extends TraceSearchItem {
  workOrderStatus: string;
  routeName: string | null;
  routeVersion: string | null;
  ownerName: string | null;
  planStartDate: string | null;
  planEndDate: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  productUnit: string | null;
}

/** 物料需求及实际物料批次操作汇总。 */
export interface TraceMaterialItem {
  requirementId: string;
  materialCode: string;
  materialModel: string;
  materialName: string;
  planQuantity: string;
  unit: string | null;
  materialBatchNo: string | null;
  supplierName: string | null;
  reservedQuantity: string;
  issuedQuantity: string;
  returnedQuantity: string;
  netIssuedQuantity: string;
}

/** 工序执行事实，按实际工艺路线顺序返回。 */
export interface TraceStepItem {
  stepRecordId: string;
  stepOrder: number;
  stepCode: string;
  stepName: string;
  responsibleUserName: string | null;
  status: string;
  outputQuantity: string | null;
  abnormalQuantity: string | null;
  startedAt: string | null;
  completedAt: string | null;
  sopFileName: string | null;
}

/** 检验及其返工闭环信息。 */
export interface TraceQualityItem {
  inspectionId: string;
  inspectionNo: string | null;
  inspectionType: string;
  inspectionName: string | null;
  result: string;
  disposition: string | null;
  inspectQuantity: string | null;
  passQuantity: string | null;
  failQuantity: string | null;
  inspectorName: string | null;
  inspectedAt: string;
  reworkId: string | null;
  reworkNo: string | null;
  reworkStatus: string | null;
  reworkResult: string | null;
  recheckInspectionId: string | null;
}

/** 报废事实记录。 */
export interface TraceScrapItem {
  id: string;
  scrapNo: string | null;
  scrapObjectType: string;
  scrapQuantity: string;
  unit: string | null;
  scrapStage: string;
  reasonType: string | null;
  operatedAt: string;
}

/** 成品或半成品库存流转记录。 */
export interface TraceFlowItem {
  id: string;
  flowNo: string | null;
  inventoryBatchNo: string;
  objectType: string;
  flowType: string;
  quantity: string;
  partnerName: string | null;
  externalDocNo: string | null;
  flowDate: string;
}

/** 一个生产批次的完整追溯闭环。 */
export interface TraceBatchDetail {
  overview: TraceBatchOverview;
  issues: string[];
  materials: TraceMaterialItem[];
  steps: TraceStepItem[];
  quality: TraceQualityItem[];
  scraps: TraceScrapItem[];
  flows: TraceFlowItem[];
}
