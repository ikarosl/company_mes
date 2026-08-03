<template>
  <div class="page-card">
    <div class="toolbar">
      <el-input v-model="query.keyword" clearable placeholder="返工单号 / 批次 / 不合格项" style="width: 280px" @keyup.enter="search" />
      <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 150px">
        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="reworkNo" label="返工单号" min-width="160" />
      <el-table-column label="来源检验" min-width="150"><template #default="{ row }">{{ row.sourceInspectionNo || row.sourceInspectionId }}</template></el-table-column>
      <el-table-column prop="defectItem" label="不合格项" min-width="150" show-overflow-tooltip />
      <el-table-column label="批次/产品" min-width="190"><template #default="{ row }">{{ row.materialBatchNo || row.productionBatchNo || '-' }} / {{ row.productName || '-' }}</template></el-table-column>
      <el-table-column prop="handlerName" label="负责人" width="110" />
      <el-table-column label="状态" width="110"><template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="310" fixed="right"><template #default="{ row }">
        <el-button link type="primary" @click="showDetail(row)">详情</el-button>
        <el-button v-if="row.status==='pending'" link type="primary" @click="openEdit(row)">编辑</el-button>
        <el-button v-if="row.status==='pending'||row.status==='doing'" link type="primary" @click="openAssign(row)">分配</el-button>
        <el-button v-if="row.status==='doing'" link type="primary" @click="openResult(row)">填写结果</el-button>
        <el-button v-if="row.status==='wait_recheck'" link type="success" @click="openRecheck(row)">复检</el-button>
      </template></el-table-column>
    </el-table>
    <TablePagination v-model:page="page" v-model:page-size="pageSize" :total="total" @change="load" />

    <el-dialog v-model="detailVisible" title="返工详情" width="900px"><el-descriptions v-if="current" :column="2" border>
      <el-descriptions-item label="返工单号">{{ current.reworkNo }}</el-descriptions-item><el-descriptions-item label="状态"><el-tag :type="statusType(current.status)">{{ statusLabel(current.status) }}</el-tag></el-descriptions-item>
      <el-descriptions-item label="来源检验">{{ current.sourceInspectionNo || current.sourceInspectionId }}</el-descriptions-item><el-descriptions-item label="复检记录">{{ current.recheckInspectionNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="生产/物料批次">{{ current.productionBatchNo || current.materialBatchNo || '-' }}</el-descriptions-item><el-descriptions-item label="产品">{{ current.productModel || '-' }} / {{ current.productName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="产品标识">{{ current.productIdentifier || '-' }}</el-descriptions-item><el-descriptions-item label="返工数量">{{ quantity(current.reworkQuantity) }}</el-descriptions-item>
      <el-descriptions-item label="不合格项">{{ current.defectItem }}</el-descriptions-item><el-descriptions-item label="退回工序">{{ current.returnStepName || current.stepName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="缺陷描述" :span="2"><div class="detail-text">{{ current.defectDesc || '-' }}</div></el-descriptions-item>
      <el-descriptions-item label="原因分析" :span="2"><div class="detail-text">{{ current.causeAnalysis || '-' }}</div></el-descriptions-item>
      <el-descriptions-item label="返工措施" :span="2"><div class="detail-text">{{ current.reworkAction || '-' }}</div></el-descriptions-item>
      <el-descriptions-item label="处理说明" :span="2"><div class="detail-text">{{ current.handlingDesc || '-' }}</div></el-descriptions-item>
      <el-descriptions-item label="返工附件" :span="2"><el-link v-if="current.fileUrl" type="primary" :href="current.fileUrl" target="_blank">查看返工文件</el-link><span v-else>-</span></el-descriptions-item>
      <el-descriptions-item label="负责人">{{ current.handlerName || '-' }}</el-descriptions-item><el-descriptions-item label="返工结果">{{ resultLabel(current.result) }}</el-descriptions-item>
      <el-descriptions-item label="开始时间">{{ time(current.startedAt) }}</el-descriptions-item><el-descriptions-item label="完成时间">{{ time(current.completedAt) }}</el-descriptions-item>
      <el-descriptions-item label="关闭时间">{{ time(current.closedAt) }}</el-descriptions-item><el-descriptions-item label="创建时间">{{ time(current.createdAt) }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="2"><div class="detail-text">{{ current.remark || '-' }}</div></el-descriptions-item>
    </el-descriptions></el-dialog>

    <el-dialog v-model="editVisible" title="编辑返工要求" width="700px"><el-form :model="editForm" label-width="110px"><el-form-item label="返工数量" required><el-input-number v-model="editForm.reworkQuantity" :min="0.0001" :max="Number(current?.failQuantity || 0)" :precision="4" /></el-form-item><el-form-item label="不合格项" required><el-input v-model="editForm.defectItem" /></el-form-item><el-form-item label="缺陷描述"><el-input v-model="editForm.defectDesc" type="textarea" :rows="3" /></el-form-item><el-form-item label="退回工序"><el-input v-model="editForm.returnStepName" /></el-form-item><el-form-item label="产品标识"><el-input v-model="editForm.productIdentifier" /></el-form-item><el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" :rows="2" /></el-form-item></el-form><template #footer><el-button @click="editVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button></template></el-dialog>
    <el-dialog v-model="assignVisible" title="分配返工负责人" width="520px"><el-form label-width="100px"><el-form-item label="负责人" required><el-select v-model="handlerId" filterable style="width:100%"><el-option v-for="user in users" :key="user.id" :label="user.displayName || user.username" :value="user.id" /></el-select></el-form-item></el-form><template #footer><el-button @click="assignVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="assign">确认分配</el-button></template></el-dialog>
    <el-dialog v-model="resultVisible" title="填写返工结果" width="700px"><el-form label-width="110px"><el-form-item label="原因分析" required><el-input v-model="resultForm.causeAnalysis" type="textarea" :rows="3" /></el-form-item><el-form-item label="返工措施" required><el-input v-model="resultForm.reworkAction" type="textarea" :rows="3" /></el-form-item><el-form-item label="处理说明" required><el-input v-model="resultForm.handlingDesc" type="textarea" :rows="3" /></el-form-item><el-form-item label="处理结果" required><el-select v-model="resultForm.result"><el-option label="合格" value="pass"/><el-option label="部分合格" value="partial_pass"/><el-option label="不合格" value="fail"/></el-select></el-form-item><el-form-item label="返工文件" required><el-upload :show-file-list="false" :http-request="uploadReworkFile"><el-button :loading="uploading">选择并上传</el-button></el-upload><el-link v-if="resultForm.fileUrl" class="file-link" type="primary" :href="resultForm.fileUrl" target="_blank">查看已上传文件</el-link></el-form-item><el-form-item label="备注"><el-input v-model="resultForm.remark" type="textarea" :rows="2" /></el-form-item></el-form><template #footer><el-button @click="resultVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitResult">提交并待复检</el-button></template></el-dialog>
    <el-dialog v-model="recheckVisible" title="返工后复检" width="700px"><el-form label-width="110px"><el-form-item label="检验数量" required><el-input-number v-model="recheck.inspectQuantity" :min="0.0001" :precision="4" /></el-form-item><el-form-item label="合格数量" required><el-input-number v-model="recheck.passQuantity" :min="0" :precision="4" /></el-form-item><el-form-item label="不合格数量" required><el-input-number v-model="recheck.failQuantity" :min="0" :precision="4" /></el-form-item><el-form-item label="复检文件" required><el-upload :show-file-list="false" :http-request="uploadRecheckFile"><el-button :loading="uploading">选择并上传</el-button></el-upload><el-link v-if="recheck.fileUrl" class="file-link" type="primary" :href="recheck.fileUrl" target="_blank">查看已上传文件</el-link></el-form-item><el-form-item label="结果说明"><el-input v-model="recheck.resultSummary" type="textarea" :rows="3" /></el-form-item></el-form><template #footer><el-button @click="recheckVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitRecheck">提交复检</el-button></template></el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { InspectionDisposition, InspectionResult, ReworkListItem, ReworkStatus, SystemUserListItem, UpdateReworkPayload } from '@company/api-contract';
import type { UploadRequestOptions } from 'element-plus';
import { qualityApi } from '../../api/quality'; import { systemApi } from '../../api/system'; import { EMessage } from '../../utils/message';
import TablePagination from '../../components/common/TablePagination.vue';

/** 返工状态字典：统一列表筛选和状态展示。 */
const statusOptions:Array<{label:string;value:ReworkStatus}>=[{label:'待处理',value:'pending'},{label:'处理中',value:'doing'},{label:'待复检',value:'wait_recheck'},{label:'已完成',value:'completed'},{label:'已关闭',value:'closed'}];
const query=reactive({keyword:'',status:''}); const rows=ref<ReworkListItem[]>([]); const users=ref<SystemUserListItem[]>([]); const loading=ref(false); const saving=ref(false); const uploading=ref(false); const page=ref(1); const pageSize=ref(20); const total=ref(0);
const current=ref<ReworkListItem|null>(null); const detailVisible=ref(false); const editVisible=ref(false); const assignVisible=ref(false); const resultVisible=ref(false); const recheckVisible=ref(false); const handlerId=ref('');
// 返工要求编辑表单：仅待处理状态允许修正，处理事实在后续“填写结果”中记录。
const editForm=reactive<UpdateReworkPayload>({reworkQuantity:0,productIdentifier:'',defectItem:'',defectDesc:'',returnStepName:'',remark:''});
const resultForm=reactive<{causeAnalysis:string;reworkAction:string;handlingDesc:string;result:InspectionResult;fileUrl:string;remark:string}>({causeAnalysis:'',reworkAction:'',handlingDesc:'',result:'pass',fileUrl:'',remark:''});
/** 复检数量由用户填写，结果和处置方式由数量自动推导，避免口径冲突。 */
const recheck=reactive({inspectQuantity:0,passQuantity:0,failQuantity:0,fileUrl:'',resultSummary:''});
async function load(){loading.value=true;try{const data=await qualityApi.listReworks({...query,page:page.value,pageSize:pageSize.value});rows.value=data.items;total.value=data.total}catch(error){EMessage.error(error,'返工记录加载失败')}finally{loading.value=false}}
function search(){page.value=1;void load()} function reset(){query.keyword='';query.status='';search()} function showDetail(row:ReworkListItem){current.value=row;detailVisible.value=true}
/** 打开返工要求编辑弹窗，并完整回填当前待处理记录。 */
function openEdit(row:ReworkListItem){current.value=row;Object.assign(editForm,{reworkQuantity:Number(row.reworkQuantity||row.failQuantity||0),productIdentifier:row.productIdentifier||'',defectItem:row.defectItem,defectDesc:row.defectDesc||'',returnStepName:row.returnStepName||'',remark:row.remark||''});editVisible.value=true}
/** 保存返工要求；成功后关闭弹窗并刷新列表。 */
async function saveEdit(){if(!current.value)return;if(Number(editForm.reworkQuantity)<=0)return EMessage.warning('返工数量必须大于 0');if(!editForm.defectItem?.trim())return EMessage.warning('请填写不合格项');saving.value=true;try{await qualityApi.updateRework(current.value.id,{...editForm});EMessage.success('返工要求已保存');editVisible.value=false;await load()}catch(error){EMessage.error(error,'返工要求保存失败')}finally{saving.value=false}}
async function loadUsers(){try{users.value=await systemApi.listUsers({page:1,pageSize:200,status:'1'})}catch(error){EMessage.error(error,'负责人加载失败')}}
function openAssign(row:ReworkListItem){current.value=row;handlerId.value=row.handlerId||'';assignVisible.value=true;void loadUsers()}
async function assign(){if(!current.value||!handlerId.value)return EMessage.warning('请选择返工负责人');saving.value=true;try{await qualityApi.assignReworkHandler(current.value.id,{handlerId:handlerId.value});EMessage.success('返工负责人分配成功');assignVisible.value=false;await load()}catch(error){EMessage.error(error,'分配失败')}finally{saving.value=false}}
function openResult(row:ReworkListItem){current.value=row;Object.assign(resultForm,{causeAnalysis:row.causeAnalysis||'',reworkAction:row.reworkAction||'',handlingDesc:row.handlingDesc||'',result:'pass',fileUrl:row.fileUrl||'',remark:row.remark||''});resultVisible.value=true}
/** 上传返工处理依据，成功后将本地访问地址随结果提交。 */
async function uploadReworkFile(options:UploadRequestOptions){uploading.value=true;try{const data=new FormData();data.append('file',options.file);const uploaded=await qualityApi.uploadReworkFile(data);resultForm.fileUrl=uploaded.fileUrl;options.onSuccess(uploaded);EMessage.success('返工文件上传成功')}catch(error){EMessage.error(error,'返工文件上传失败')}finally{uploading.value=false}}
async function submitResult(){if(!current.value)return;if(!resultForm.causeAnalysis.trim())return EMessage.warning('请填写原因分析');if(!resultForm.reworkAction.trim())return EMessage.warning('请填写返工措施');if(!resultForm.handlingDesc.trim())return EMessage.warning('请填写返工处理说明');if(!resultForm.fileUrl)return EMessage.warning('请上传返工文件');saving.value=true;try{await qualityApi.submitReworkResult(current.value.id,{...resultForm});EMessage.success('返工结果已提交，等待复检');resultVisible.value=false;await load()}catch(error){EMessage.error(error,'返工结果提交失败')}finally{saving.value=false}}
function openRecheck(row:ReworkListItem){current.value=row;const quantity=Number(row.reworkQuantity||row.failQuantity||0);Object.assign(recheck,{inspectQuantity:quantity,passQuantity:quantity,failQuantity:0,fileUrl:'',resultSummary:''});recheckVisible.value=true}
/** 上传复检附件并保存到复检记录。 */
async function uploadRecheckFile(options:UploadRequestOptions){uploading.value=true;try{const data=new FormData();data.append('file',options.file);const uploaded=await qualityApi.uploadReworkFile(data);recheck.fileUrl=uploaded.fileUrl;options.onSuccess(uploaded);EMessage.success('复检文件上传成功')}catch(error){EMessage.error(error,'复检文件上传失败')}finally{uploading.value=false}}
async function submitRecheck(){if(!current.value)return;if(!recheck.fileUrl)return EMessage.warning('请上传复检文件');const inspect=Number(recheck.inspectQuantity),pass=Number(recheck.passQuantity),fail=Number(recheck.failQuantity);if(inspect<=0||pass<0||fail<0||Math.abs(pass+fail-inspect)>.00005)return EMessage.warning('检验数量必须等于合格数量与不合格数量之和');const result:InspectionResult=fail===0?'pass':pass===0?'fail':'partial_pass';const disposition:InspectionDisposition=result==='pass'?'accept':result==='fail'?'rework':'conditional_accept';saving.value=true;try{await qualityApi.reinspectRework(current.value.id,{...recheck,result,disposition});EMessage.success('复检记录已创建，返工闭环已更新');recheckVisible.value=false;await load()}catch(error){EMessage.error(error,'复检提交失败')}finally{saving.value=false}}
const statusLabel=(value:ReworkStatus)=>statusOptions.find(item=>item.value===value)?.label||value; const statusType=(value:ReworkStatus)=>value==='completed'?'success':value==='closed'?'info':value==='wait_recheck'?'warning':value==='doing'?'primary':'info';
const resultLabel=(value:InspectionResult)=>value==='pass'?'合格':value==='partial_pass'?'部分合格':'不合格';const quantity=(value:number|null)=>value==null?'-':value;const time=(value:string|null)=>value?new Date(value).toLocaleString('zh-CN',{hour12:false}):'-';
onMounted(load);
</script>

<style scoped>.page-card{padding:20px;background:#fff}.toolbar{display:flex;gap:12px;margin-bottom:16px}.el-pagination{justify-content:flex-end;margin-top:16px}.file-link{margin-left:12px}.detail-text{white-space:pre-wrap;word-break:break-word}</style>
