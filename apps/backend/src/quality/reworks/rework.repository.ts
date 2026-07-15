import type {
  AssignReworkHandlerPayload, CreateReworkPayload, CreateReworkRecheckPayload,
  InspectionDisposition, InspectionObjectType, InspectionResult, InspectionType,
  ReworkListItem, ReworkResult, ReworkStatus, SubmitReworkResultPayload, UpdateReworkPayload,
} from '@company/api-contract';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { AuditContextService } from '../../operation-log/audit-context.service.js';
import { execute, query } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface ReworkFilters { keyword?: string; status?: string; sourceInspectionId?: string; handlerId?: string }
interface ReworkRow extends RowDataPacket {
  id:number; rework_no:string; source_inspection_id:number; source_inspection_no:string|null;
  recheck_inspection_id:number|null; recheck_inspection_no:string|null; product_identifier:string|null;
  defect_item:string; defect_desc:string|null; return_step_name:string|null; handler_id:number|null;
  handler_name:string|null; handling_desc:string|null; status:ReworkStatus; result:ReworkResult;
  closed_at:Date|null; remark:string|null; inspection_type:InspectionType;
  inspection_result:InspectionResult; inspection_disposition:InspectionDisposition|null;
  fail_quantity:string|number|null; production_batch_id:number|null; production_batch_no:string|null;
  material_batch_id:number|null; material_batch_no:string|null; product_model:string|null;
  product_name:string|null; step_name:string|null; created_at:Date; updated_at:Date|null;
}
interface SourceInspectionRow extends RowDataPacket {
  id:number; inspection_object_type:InspectionObjectType; inspection_type:InspectionType;
  batch_id:number|null; material_batch_id:number|null; product_inventory_id:number|null;
  product_id_snapshot:number|null; batch_step_record_id:number|null; fail_quantity:string|number|null;
  result:InspectionResult; disposition:InspectionDisposition|null;
}
const STATUSES = new Set<ReworkStatus>(['pending','doing','wait_recheck','completed','closed']);
const RESULTS = new Set<ReworkResult>(['pass','fail','partial_pass']);

@Injectable()
export class ReworkRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditContextService) private readonly auditContext: AuditContextService,
  ) {}

  async list(filters: ReworkFilters, pagination: PaginationOptions) {
    const { where, params } = buildFilters(filters);
    const [count] = await this.database.query<(RowDataPacket & { total:number })[]>(
      `SELECT COUNT(*) total FROM rework_records rw WHERE ${where}`, params,
    );
    const rows = await this.database.query<ReworkRow[]>(
      `${this.source()} WHERE ${where} ORDER BY rw.created_at DESC,rw.id DESC LIMIT ? OFFSET ?`,
      [...params,pagination.pageSize,pagination.offset],
    );
    return toPageResult(rows.map(mapRework),Number(count?.total??0),pagination);
  }

  async get(id:number) {
    const [row] = await this.database.query<ReworkRow[]>(`${this.source()} WHERE rw.id=? AND rw.is_deleted=0`,[id]);
    if (!row) throw new NotFoundException('返工记录不存在');
    return mapRework(row);
  }

  /** 创建返工并把来源检验的处置方式统一标记为返工。 */
  async create(payload:CreateReworkPayload,userId:number) {
    const sourceId=positiveId(payload.sourceInspectionId,'来源检验记录无效');
    const defectItem=required(payload.defectItem,'请填写不合格项');
    const handlerId=nullablePositiveId(payload.handlerId,'返工处理人无效');
    const id=await this.database.transaction(async connection=>{
      const source=await this.lockSource(connection,sourceId);
      if(source.result==='pass'||number(source.fail_quantity)<=0)
        throw new BadRequestException('只有存在不合格数量的检验记录才能创建返工');
      if(handlerId) await this.assertUser(connection,handlerId);
      const result=await execute(connection,`INSERT INTO rework_records (
        rework_no,source_inspection_id,product_identifier,defect_item,defect_desc,return_step_name,
        handler_id,status,result,remark,created_by,created_at,updated_by,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,'fail',?,?,NOW(),?,NOW())`,[
        makeNo('RW'),sourceId,optional(payload.productIdentifier),defectItem,optional(payload.defectDesc),
        optional(payload.returnStepName),handlerId,handlerId?'doing':'pending',optional(payload.remark),userId,userId,
      ]);
      await execute(connection,`UPDATE inspection_records SET disposition='rework',updated_by=?,updated_at=NOW()
        WHERE id=? AND is_deleted=0`,[userId,sourceId]);
      return result.insertId;
    });
    const after=await this.get(id); this.auditContext.setAfterData(after); return after;
  }

  /** 只有待处理返工单允许编辑问题内容。 */
  async update(id:number,payload:UpdateReworkPayload,userId:number) {
    const before=await this.get(id);
    if(before.status!=='pending') throw new BadRequestException('只有待处理返工单可以编辑');
    this.auditContext.setBeforeData(before);
    await execute(this.database,`UPDATE rework_records SET product_identifier=?,defect_item=?,defect_desc=?,
      return_step_name=?,remark=?,updated_by=?,updated_at=NOW() WHERE id=? AND is_deleted=0`,[
      payload.productIdentifier===undefined?before.productIdentifier:optional(payload.productIdentifier),
      payload.defectItem===undefined?before.defectItem:required(payload.defectItem,'请填写不合格项'),
      payload.defectDesc===undefined?before.defectDesc:optional(payload.defectDesc),
      payload.returnStepName===undefined?before.returnStepName:optional(payload.returnStepName),
      payload.remark===undefined?before.remark:optional(payload.remark),userId,id,
    ]);
    const after=await this.get(id); this.auditContext.setAfterData(after); return after;
  }

  /** 首次分配或改派处理人，并进入处理中。 */
  async assignHandler(id:number,payload:AssignReworkHandlerPayload,userId:number) {
    const handlerId=positiveId(payload.handlerId,'请选择返工处理人');
    const before=await this.get(id);
    if(!['pending','doing'].includes(before.status)) throw new BadRequestException('当前返工状态不允许分配处理人');
    await this.assertUser(this.database,handlerId); this.auditContext.setBeforeData(before);
    await execute(this.database,`UPDATE rework_records SET handler_id=?,status='doing',updated_by=?,updated_at=NOW()
      WHERE id=? AND is_deleted=0`,[handlerId,userId,id]);
    const after=await this.get(id); this.auditContext.setAfterData(after); return after;
  }

  /** 返工处理结果提交后必须进入待复检，不能直接判定最终合格。 */
  async submitResult(id:number,payload:SubmitReworkResultPayload,userId:number) {
    const before=await this.get(id);
    if(before.status!=='doing') throw new BadRequestException('只有处理中的返工单可以提交结果');
    if(!before.handlerId) throw new BadRequestException('请先分配返工处理人');
    const result=readResult(payload.result),handlingDesc=required(payload.handlingDesc,'请填写返工处理说明');
    this.auditContext.setBeforeData(before);
    await execute(this.database,`UPDATE rework_records SET handling_desc=?,result=?,status='wait_recheck',
      remark=COALESCE(?,remark),updated_by=?,updated_at=NOW() WHERE id=? AND is_deleted=0`,
      [handlingDesc,result,optional(payload.remark),userId,id]);
    const after=await this.get(id); this.auditContext.setAfterData(after); return after;
  }

  /** 锁定返工单、创建复检并回填复检关系，保证闭环操作原子完成。 */
  async reinspect(id:number,payload:CreateReworkRecheckPayload,userId:number) {
    const values=normalizeRecheck(payload,userId),before=await this.get(id); this.auditContext.setBeforeData(before);
    const recheckId=await this.database.transaction(async connection=>{
      const [rw]=await query<(RowDataPacket&{source_inspection_id:number;status:ReworkStatus;recheck_inspection_id:number|null})[]>(
        connection,`SELECT source_inspection_id,status,recheck_inspection_id FROM rework_records
        WHERE id=? AND is_deleted=0 FOR UPDATE`,[id]);
      if(!rw) throw new NotFoundException('返工记录不存在');
      if(rw.status!=='wait_recheck') throw new BadRequestException('当前返工单不处于待复检状态');
      if(rw.recheck_inspection_id) throw new BadRequestException('该返工单已经完成复检');
      const source=await this.lockSource(connection,rw.source_inspection_id);
      const inserted=await execute(connection,`INSERT INTO inspection_records (
        batch_id,material_batch_id,product_inventory_id,product_id_snapshot,related_inspection_id,
        inspection_no,inspection_object_type,inspection_type,inspection_name,batch_step_record_id,
        inspect_quantity,pass_quantity,fail_quantity,result,disposition,inspector_id,inspected_at,
        file_url,result_summary,remark,created_by,created_at,updated_by,updated_at
      ) VALUES (?,?,?,?,?,?,?,'recheck',?,?,?,?,?,?,?,?,COALESCE(?,NOW()),?,?,?,?,NOW(),?,NOW())`,[
        source.batch_id,source.material_batch_id,source.product_inventory_id,source.product_id_snapshot,source.id,
        makeNo('RECHECK'),source.inspection_object_type,values.inspectionName,source.batch_step_record_id,
        values.inspectQuantity,values.passQuantity,values.failQuantity,values.result,values.disposition,
        values.inspectorId,values.inspectedAt,values.fileUrl,values.resultSummary,values.remark,userId,userId,
      ]);
      await execute(connection,`UPDATE rework_records SET recheck_inspection_id=?,status=?,closed_at=NOW(),
        updated_by=?,updated_at=NOW() WHERE id=? AND is_deleted=0`,
        [inserted.insertId,values.result==='pass'?'completed':'closed',userId,id]);
      return inserted.insertId;
    });
    const after=await this.get(id); this.auditContext.setAfterData(after);
    return {rework:after,recheckInspectionId:String(recheckId)};
  }

  private async lockSource(executor:Parameters<typeof query>[0],id:number) {
    const [row]=await query<SourceInspectionRow[]>(executor,`SELECT id,inspection_object_type,inspection_type,
      batch_id,material_batch_id,product_inventory_id,product_id_snapshot,batch_step_record_id,
      fail_quantity,result,disposition FROM inspection_records WHERE id=? AND is_deleted=0 FOR UPDATE`,[id]);
    if(!row) throw new BadRequestException('来源检验记录不存在或已删除'); return row;
  }
  private async assertUser(executor:Parameters<typeof query>[0],id:number) {
    const [row]=await query<RowDataPacket[]>(executor,`SELECT id FROM users WHERE id=? AND status=1
      AND deleted_at IS NULL LIMIT 1`,[id]);
    if(!row) throw new BadRequestException('返工处理人不存在或已停用');
  }
  private source(){return `SELECT rw.*,source.inspection_no source_inspection_no,
    recheck.inspection_no recheck_inspection_no,source.inspection_type,source.result inspection_result,
    source.disposition inspection_disposition,source.fail_quantity,source.batch_id production_batch_id,
    pb.batch_no production_batch_no,source.material_batch_id,mb.material_batch_no,p.product_model,p.product_name,
    ps.step_name,handler.display_name handler_name FROM rework_records rw
    JOIN inspection_records source ON source.id=rw.source_inspection_id
    LEFT JOIN inspection_records recheck ON recheck.id=rw.recheck_inspection_id
    LEFT JOIN production_batches pb ON pb.id=source.batch_id LEFT JOIN material_batches mb ON mb.id=source.material_batch_id
    LEFT JOIN products p ON p.id=source.product_id_snapshot LEFT JOIN batch_step_records bsr ON bsr.id=source.batch_step_record_id
    LEFT JOIN process_route_steps prs ON prs.id=bsr.process_route_steps_id LEFT JOIN process_steps ps ON ps.id=prs.process_step_id
    LEFT JOIN users handler ON handler.id=rw.handler_id`;}
}

const buildFilters=(f:ReworkFilters)=>{const c=['rw.is_deleted=0'],p:QueryParam[]=[];
  if(f.status){if(!STATUSES.has(f.status as ReworkStatus))throw new BadRequestException('返工状态无效');c.push('rw.status=?');p.push(f.status)}
  if(f.sourceInspectionId){c.push('rw.source_inspection_id=?');p.push(positiveId(f.sourceInspectionId,'来源检验记录无效'))}
  if(f.handlerId){c.push('rw.handler_id=?');p.push(positiveId(f.handlerId,'处理人无效'))}
  if(f.keyword?.trim()){const l=`%${f.keyword.trim()}%`;c.push('(rw.rework_no LIKE ? OR rw.defect_item LIKE ? OR rw.defect_desc LIKE ? OR rw.product_identifier LIKE ?)');p.push(l,l,l,l)}
  return{where:c.join(' AND '),params:p};};
const mapRework=(r:ReworkRow):ReworkListItem=>({id:String(r.id),reworkNo:r.rework_no,sourceInspectionId:String(r.source_inspection_id),sourceInspectionNo:r.source_inspection_no,recheckInspectionId:nullableString(r.recheck_inspection_id),recheckInspectionNo:r.recheck_inspection_no,productIdentifier:r.product_identifier,defectItem:r.defect_item,defectDesc:r.defect_desc,returnStepName:r.return_step_name,handlerId:nullableString(r.handler_id),handlerName:r.handler_name,handlingDesc:r.handling_desc,status:r.status,result:r.result,closedAt:r.closed_at?.toISOString()??null,remark:r.remark,inspectionType:r.inspection_type,inspectionResult:r.inspection_result,inspectionDisposition:r.inspection_disposition,failQuantity:nullableNumber(r.fail_quantity),productionBatchId:nullableString(r.production_batch_id),productionBatchNo:r.production_batch_no,materialBatchId:nullableString(r.material_batch_id),materialBatchNo:r.material_batch_no,productModel:r.product_model,productName:r.product_name,stepName:r.step_name,createdAt:r.created_at.toISOString(),updatedAt:r.updated_at?.toISOString()??null});
const normalizeRecheck=(p:CreateReworkRecheckPayload,userId:number)=>{const iq=nonNegative(p.inspectQuantity,'检验数量'),pq=nonNegative(p.passQuantity,'合格数量'),fq=nonNegative(p.failQuantity,'不合格数量');if(iq<=0||Math.abs(pq+fq-iq)>.00005)throw new BadRequestException('检验数量必须大于0，且等于合格数量与不合格数量之和');const expected:InspectionResult=fq===0?'pass':pq===0?'fail':'partial_pass';if(p.result!==expected)throw new BadRequestException('检验结果与合格/不合格数量不一致');const allowed:Record<InspectionResult,InspectionDisposition[]>={pass:['accept'],partial_pass:['conditional_accept','rework','scrap','hold'],fail:['reject','rework','scrap','return_supplier','hold']};const disposition=p.disposition??(expected==='pass'?'accept':expected==='fail'?'reject':'conditional_accept');if(!allowed[expected].includes(disposition))throw new BadRequestException('检验结果与处置方式不一致');return{inspectionName:optional(p.inspectionName)??'返工复检',inspectQuantity:iq,passQuantity:pq,failQuantity:fq,result:expected,disposition,inspectorId:p.inspectorId?positiveId(p.inspectorId,'检验人员无效'):userId,inspectedAt:optional(p.inspectedAt),fileUrl:optional(p.fileUrl),resultSummary:optional(p.resultSummary),remark:optional(p.remark)}};
const readResult=(v:string)=>{if(!RESULTS.has(v as ReworkResult))throw new BadRequestException('返工结果无效');return v as ReworkResult};
const positiveId=(v:unknown,m:string)=>{const n=Number(v);if(!Number.isInteger(n)||n<=0)throw new BadRequestException(m);return n};
const nullablePositiveId=(v:unknown,m:string)=>v===null||v===undefined||v===''?null:positiveId(v,m);
const required=(v:unknown,m:string)=>{const s=typeof v==='string'?v.trim():'';if(!s)throw new BadRequestException(m);return s};
const optional=(v:unknown)=>typeof v==='string'&&v.trim()?v.trim():null; const number=(v:unknown)=>Number(v??0);
const nonNegative=(v:unknown,l:string)=>{const n=Number(v);if(!Number.isFinite(n)||n<0)throw new BadRequestException(`${l}必须是非负数`);return Number(n.toFixed(4))};
const nullableString=(v:number|null)=>v===null?null:String(v);const nullableNumber=(v:string|number|null)=>v===null?null:Number(v);
const makeNo=(prefix:string)=>{const d=new Date(),z=(n:number,l=2)=>String(n).padStart(l,'0');return `${prefix}${d.getFullYear()}${z(d.getMonth()+1)}${z(d.getDate())}${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}${z(d.getMilliseconds(),3)}${z(Math.floor(Math.random()*1000),3)}`};
