<template>
  <div class="page">
    <section class="panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词"><el-input v-model="query.keyword" clearable placeholder="检验单号、名称或说明" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="query.inspectionType"><el-option label="全部" value="" /><el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="结果"><el-select v-model="query.result"><el-option label="全部" value="" /><el-option label="合格" value="pass" /><el-option label="部分合格" value="partial_pass" /><el-option label="不合格" value="fail" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button></el-form-item>
      </el-form>
    </section>

    <section class="panel">
      <div class="toolbar"><el-button type="primary" :icon="Plus" @click="openCreate">新增检验</el-button><el-button :icon="Refresh" text circle :loading="loading" @click="load" /></div>
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="inspectionNo" label="检验单号" min-width="190" />
        <el-table-column label="类型" width="125"><template #default="{ row }"><el-tag>{{ typeLabel(row.inspectionType) }}</el-tag></template></el-table-column>
        <el-table-column label="检验对象" min-width="230"><template #default="{ row }"><strong>{{ targetLabel(row) }}</strong><div class="muted">{{ row.productModel || '-' }} / {{ row.productName || '-' }}</div></template></el-table-column>
        <el-table-column label="检/合/不合" width="145"><template #default="{ row }">{{ num(row.inspectQuantity) }} / {{ num(row.passQuantity) }} / {{ num(row.failQuantity) }}</template></el-table-column>
        <el-table-column label="结果" width="100"><template #default="{ row }"><el-tag :type="resultMeta(row.result).type">{{ resultMeta(row.result).label }}</el-tag></template></el-table-column>
        <el-table-column label="处置" width="110"><template #default="{ row }">{{ dispositionLabel(row.disposition) }}</template></el-table-column>
        <el-table-column prop="inspectorName" label="检验人" width="110" />
        <el-table-column label="检验时间" width="170"><template #default="{ row }">{{ time(row.inspectedAt) }}</template></el-table-column>
        <el-table-column label="操作" fixed="right" width="190"><template #default="{ row }"><el-button link type="primary" @click="showDetail(row)">详情</el-button><el-button link type="primary" @click="openEdit(row)">编辑</el-button><el-button v-if="canCreateRework(row)" link type="danger" @click="openRework(row)">创建返工</el-button></template></el-table-column>
      </el-table>
      <div class="footer"><span>共 {{ total }} 条</span><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="sizes,prev,pager,next" @change="load" /></div>
    </section>

    <el-dialog v-model="formVisible" :title="editId ? '编辑检验记录' : '新增检验记录'" :width="DialogWidth.xl" @closed="resetForm">
      <el-form label-width="108px" :model="form">
        <div class="grid">
          <el-form-item label="检验类型" required><el-select v-model="form.inspectionType" :disabled="!!editId" @change="typeChanged"><el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item label="检验名称"><el-input v-model="form.inspectionName" /></el-form-item>
          <el-form-item v-if="form.inspectionType === 'incoming_material'" label="物料入库批次" required><el-select v-model="form.materialBatchId" filterable remote :remote-method="materialSearch" @change="targetChanged('material_batch', $event)"><el-option v-for="item in targets.material_batch" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item>
          <el-form-item v-else-if="form.inspectionType === 'recheck'" label="原检验记录" required><el-select v-model="form.relatedInspectionId" filterable remote :remote-method="inspectionSearch" @change="targetChanged('inspection', $event)"><el-option v-for="item in targets.inspection" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item>
          <template v-else>
            <el-form-item v-if="form.inspectionType !== 'package' || !form.productInventoryId" label="生产批次" :required="form.inspectionType !== 'package'"><el-select v-model="form.batchId" clearable filterable remote :remote-method="batchSearch" @change="batchChanged"><el-option v-for="item in targets.production_batch" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item>
            <el-form-item v-if="['process','first_article'].includes(form.inspectionType)" :label="form.inspectionType === 'process' ? '检验工序' : '关联工序'" :required="form.inspectionType === 'process'"><el-select v-model="form.batchStepRecordId" :disabled="!form.batchId"><el-option v-for="item in targets.batch_step" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item>
            <el-form-item v-if="form.inspectionType === 'package'" label="产品库存"><el-select v-model="form.productInventoryId" clearable filterable remote :remote-method="inventorySearch" @change="targetChanged('product_inventory', $event)"><el-option v-for="item in targets.product_inventory" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item>
          </template>
          <el-form-item label="检验数量" required><el-input-number v-model="form.inspectQuantity" :min="0" :precision="4" /></el-form-item>
          <el-form-item label="合格数量" required><el-input-number v-model="form.passQuantity" :min="0" :precision="4" /></el-form-item>
          <el-form-item label="不合格数量" required><el-input-number v-model="form.failQuantity" :min="0" :precision="4" /></el-form-item>
          <el-form-item label="检验结果" required><el-select v-model="form.result"><el-option label="合格" value="pass" /><el-option label="部分合格" value="partial_pass" /><el-option v-if="form.inspectionType !== 'incoming_material'" label="不合格" value="fail" /></el-select></el-form-item>
          <el-form-item label="处置方式" required><el-select v-model="form.disposition"><el-option v-for="item in availableDispositions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item label="检验时间"><el-date-picker v-model="form.inspectedAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" /></el-form-item>
          <el-form-item label="检测文件"><el-input v-model="form.fileUrl" placeholder="检验报告或图片地址" /></el-form-item>
        </div>
        <el-form-item label="结果说明"><el-input v-model="form.resultSummary" type="textarea" :rows="3" /></el-form-item>
        <el-form-item :label="form.inspectionType === 'first_article' ? '首检原因' : '备注'" :required="form.inspectionType === 'first_article'"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="formVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="reworkVisible" title="创建返工单" :width="DialogWidth.lg">
      <el-alert v-if="reworkSource" :title="`来源检验：${reworkSource.inspectionNo || '-'}，不合格数量 ${num(reworkSource.failQuantity)}`" type="warning" :closable="false" show-icon />
      <el-form label-width="108px" :model="reworkForm" class="dialog-form"><el-form-item label="不合格项" required><el-input v-model="reworkForm.defectItem" /></el-form-item><el-form-item label="问题描述"><el-input v-model="reworkForm.defectDesc" type="textarea" :rows="3" /></el-form-item><el-form-item label="返工工序"><el-input v-model="reworkForm.returnStepName" /></el-form-item><el-form-item label="产品标识"><el-input v-model="reworkForm.productIdentifier" /></el-form-item><el-form-item label="备注"><el-input v-model="reworkForm.remark" type="textarea" :rows="2" /></el-form-item></el-form>
      <template #footer><el-button @click="reworkVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="createRework">创建返工单</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="检验详情" :width="DialogWidth.lg"><el-descriptions v-if="active" :column="2" border><el-descriptions-item label="检验单号">{{ active.inspectionNo }}</el-descriptions-item><el-descriptions-item label="类型">{{ typeLabel(active.inspectionType) }}</el-descriptions-item><el-descriptions-item label="对象" :span="2">{{ targetLabel(active) }} / {{ active.productModel }} {{ active.productName }}</el-descriptions-item><el-descriptions-item label="工序">{{ active.stepName || '-' }}</el-descriptions-item><el-descriptions-item label="结果">{{ resultMeta(active.result).label }}</el-descriptions-item><el-descriptions-item label="检/合/不合">{{ num(active.inspectQuantity) }} / {{ num(active.passQuantity) }} / {{ num(active.failQuantity) }}</el-descriptions-item><el-descriptions-item label="返工单数">{{ active.reworkCount }}</el-descriptions-item><el-descriptions-item label="结果说明" :span="2">{{ active.resultSummary || '-' }}</el-descriptions-item><el-descriptions-item label="备注" :span="2">{{ active.remark || '-' }}</el-descriptions-item></el-descriptions></el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Plus, Refresh } from '@element-plus/icons-vue';
import type { InspectionDisposition, InspectionListItem, InspectionResult, InspectionTargetOption, InspectionType, SaveInspectionPayload } from '@company/api-contract';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { qualityApi } from '../../api/quality';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

const typeOptions: Array<{label:string;value:InspectionType}>=[{label:'来料检验',value:'incoming_material'},{label:'首检',value:'first_article'},{label:'过程检验',value:'process'},{label:'成品检验',value:'final'},{label:'包装检验',value:'package'},{label:'测试检验',value:'test'},{label:'复检',value:'recheck'}];
const dispositionOptions:Array<{label:string;value:InspectionDisposition}>=[{label:'接收',value:'accept'},{label:'拒收',value:'reject'},{label:'有条件接收',value:'conditional_accept'},{label:'返工',value:'rework'},{label:'报废',value:'scrap'},{label:'退供应商',value:'return_supplier'},{label:'暂扣',value:'hold'}];
type TargetKind='material_batch'|'production_batch'|'batch_step'|'product_inventory'|'inspection';
const query=reactive({keyword:'',inspectionType:'',result:''}),rows=ref<InspectionListItem[]>([]),total=ref(0),page=ref(1),pageSize=ref(10),loading=ref(false),saving=ref(false),formVisible=ref(false),detailVisible=ref(false),reworkVisible=ref(false),editId=ref<string|null>(null),active=ref<InspectionListItem|null>(null),reworkSource=ref<InspectionListItem|null>(null);
const targets=reactive<Record<TargetKind,InspectionTargetOption[]>>({material_batch:[],production_batch:[],batch_step:[],product_inventory:[],inspection:[]});
const blank=():SaveInspectionPayload=>({inspectionType:'incoming_material',inspectionName:'',batchId:null,materialBatchId:null,productInventoryId:null,relatedInspectionId:null,batchStepRecordId:null,inspectQuantity:null,passQuantity:null,failQuantity:null,result:'pass',disposition:'accept',inspectedAt:null,fileUrl:'',resultSummary:'',remark:''});
const form=reactive(blank()),reworkForm=reactive({defectItem:'',defectDesc:'',returnStepName:'',productIdentifier:'',remark:''});
const availableDispositions=computed(()=>{const map:Record<InspectionResult,InspectionDisposition[]>={pass:['accept'],partial_pass:['conditional_accept','rework','scrap','hold'],fail:form.inspectionType==='incoming_material'?['reject','return_supplier','hold']:['reject','rework','scrap','hold']};return dispositionOptions.filter(item=>map[form.result].includes(item.value));});
watch(()=>form.result,()=>{const first=availableDispositions.value[0];if(first&&!availableDispositions.value.some(item=>item.value===form.disposition))form.disposition=first.value;});

async function load(){loading.value=true;try{const result=await qualityApi.list({...query,page:page.value,pageSize:pageSize.value});rows.value=result.items;total.value=result.total}catch(error){EMessage.error(error,'检验记录加载失败')}finally{loading.value=false}}
function search(){page.value=1;void load()} function resetQuery(){Object.assign(query,{keyword:'',inspectionType:'',result:''});search()}
async function find(kind:TargetKind,keyword=''){try{targets[kind]=await qualityApi.targets({targetType:kind,keyword,batchId:kind==='batch_step'?form.batchId||undefined:undefined})}catch(error){EMessage.error(error,'检验对象加载失败')}}
const materialSearch=(keyword:string)=>find('material_batch',keyword),inspectionSearch=(keyword:string)=>find('inspection',keyword),batchSearch=(keyword:string)=>find('production_batch',keyword),inventorySearch=(keyword:string)=>find('product_inventory',keyword);
function openCreate(){editId.value=null;Object.assign(form,blank());formVisible.value=true;void find('material_batch')}
async function openEdit(row:InspectionListItem){editId.value=row.id;Object.assign(form,{...blank(),...row});formVisible.value=true;await find(row.inspectionType==='incoming_material'?'material_batch':row.inspectionType==='recheck'?'inspection':'production_batch');if(row.batchId&&['process','first_article'].includes(row.inspectionType))await find('batch_step');if(row.inspectionType==='package')await find('product_inventory')}
function showDetail(row:InspectionListItem){active.value=row;detailVisible.value=true} function resetForm(){Object.assign(form,blank());editId.value=null}
function typeChanged(){Object.assign(form,{batchId:null,materialBatchId:null,productInventoryId:null,relatedInspectionId:null,batchStepRecordId:null});void find(form.inspectionType==='incoming_material'?'material_batch':form.inspectionType==='recheck'?'inspection':'production_batch');}
function targetChanged(kind:TargetKind,id:string){const selected=targets[kind].find(item=>item.id===id);if(selected?.quantity!=null){form.inspectQuantity=Number(selected.quantity);form.passQuantity=Number(selected.quantity);form.failQuantity=0}}
function batchChanged(id:string){targetChanged('production_batch',id);form.batchStepRecordId=null;if(['process','first_article'].includes(form.inspectionType))void find('batch_step')}
function validate(){if(form.inspectionType==='incoming_material'&&!form.materialBatchId)return '请选择物料入库批次';if(form.inspectionType==='recheck'&&!form.relatedInspectionId)return '请选择原检验记录';if(!['incoming_material','recheck','package'].includes(form.inspectionType)&&!form.batchId)return '请选择生产批次';if(form.inspectionType==='package'&&!form.batchId&&!form.productInventoryId)return '包装检验必须选择生产批次或产品库存';if(form.inspectionType==='process'&&!form.batchStepRecordId)return '请选择过程检验对应工序';if(form.inspectionType==='first_article'&&!form.remark?.trim())return '请填写首检原因';const inspect=Number(form.inspectQuantity),pass=Number(form.passQuantity),fail=Number(form.failQuantity);if(!Number.isFinite(inspect)||inspect<=0||pass<0||fail<0||Math.abs(pass+fail-inspect)>.00005)return '检验数量必须大于0，且等于合格数量与不合格数量之和';const expected:InspectionResult=fail===0?'pass':pass===0?'fail':'partial_pass';if(form.result!==expected)return '检验结果与合格/不合格数量不一致';return null}
async function save(){const message=validate();if(message)return EMessage.warning(message);saving.value=true;try{editId.value?await qualityApi.update(editId.value,form):await qualityApi.create(form);EMessage.success('检验记录已保存');formVisible.value=false;await load()}catch(error){EMessage.error(error,'检验记录保存失败')}finally{saving.value=false}}
const canCreateRework=(row:InspectionListItem)=>row.result!=='pass'&&Number(row.failQuantity||0)>0;
function openRework(row:InspectionListItem){reworkSource.value=row;Object.assign(reworkForm,{defectItem:row.resultSummary||'',defectDesc:row.resultSummary||'',returnStepName:row.stepName||'',productIdentifier:'',remark:''});reworkVisible.value=true}
async function createRework(){if(!reworkSource.value||!reworkForm.defectItem.trim())return EMessage.warning('请填写不合格项');saving.value=true;try{await qualityApi.createRework(reworkSource.value.id,{...reworkForm});EMessage.success('返工单已创建');reworkVisible.value=false;await load()}catch(error){EMessage.error(error,'返工单创建失败')}finally{saving.value=false}}
const typeLabel=(value:InspectionType)=>typeOptions.find(item=>item.value===value)?.label||value,dispositionLabel=(value:InspectionDisposition|null|undefined)=>dispositionOptions.find(item=>item.value===value)?.label||'-',resultMeta=(value:InspectionResult)=>value==='pass'?{label:'合格',type:'success' as const}:value==='fail'?{label:'不合格',type:'danger' as const}:{label:'部分合格',type:'warning' as const},targetLabel=(row:InspectionListItem)=>row.materialBatchNo?`物料批次：${row.materialBatchNo}`:row.productionBatchNo?`生产批次：${row.productionBatchNo}${row.workOrderNo?` / ${row.workOrderNo}`:''}`:row.productInventoryId?`产品库存：${row.productInventoryId}`:'-',num=(value:number|null|undefined)=>value==null?'-':value,time=(value:string|null|undefined)=>value?new Date(value).toLocaleString('zh-CN',{hour12:false}):'-';
onMounted(load);
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px}.panel{padding:16px;background:#fff;border-radius:8px}.toolbar,.footer{display:flex;align-items:center;justify-content:space-between;gap:16px}.toolbar{margin-bottom:14px}.footer{justify-content:flex-end;margin-top:16px}.muted{color:#909399;font-size:13px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}.grid :deep(.el-select),.grid :deep(.el-date-editor),.grid :deep(.el-input-number){width:100%}.dialog-form{margin-top:16px}@media(max-width:760px){.grid{grid-template-columns:1fr}}
</style>
