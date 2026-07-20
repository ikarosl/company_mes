<template>
  <div class="page">
    <section class="panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" clearable placeholder="批次、工单、产品或工序" @keyup.enter="search" />
        </el-form-item>
        <el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
      </el-form>
    </section>

    <section class="panel">
      <div class="toolbar toolbar-end"><el-button :icon="Refresh" text circle :loading="loading" @click="load" /></div>
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="batchNo" label="生产批次" min-width="155" />
        <el-table-column prop="workOrderNo" label="工单" min-width="140" />
        <el-table-column label="产品" min-width="210"><template #default="{ row }"><strong>{{ row.productModel || row.productCode || '-' }}</strong><div class="muted">{{ row.productName || '-' }}</div></template></el-table-column>
        <el-table-column label="待检工序" min-width="170"><template #default="{ row }">{{ row.stepOrder }}. {{ row.stepName }}<div class="muted">{{ row.stepCode || '-' }}</div></template></el-table-column>
        <el-table-column label="完成/异常数量" width="145"><template #default="{ row }">{{ row.outputQuantity }} / {{ row.abnormalQuantity }}</template></el-table-column>
        <el-table-column prop="responsibleUserName" label="报工人" width="110" />
        <el-table-column label="完成时间" width="170"><template #default="{ row }">{{ formatTime(row.completedAt) }}</template></el-table-column>
        <el-table-column label="操作" fixed="right" width="150"><template #default="{ row }"><el-button v-if="row.sopFileUrl" link type="primary" @click="openSop(row.sopFileUrl)">查看SOP</el-button><el-button link type="primary" @click="openSubmit(row)">填写结果</el-button></template></el-table-column>
      </el-table>
      <div class="footer"><span>共 {{ total }} 条</span><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="sizes,prev,pager,next" @change="load" /></div>
    </section>

    <el-dialog v-model="visible" title="填写过程检验结果" :width="DialogWidth.lg" @closed="clearForm">
      <el-alert v-if="active" :title="`${active.batchNo} / ${active.stepOrder}. ${active.stepName}`" type="info" :closable="false" show-icon />
      <el-form :model="form" label-width="108px" class="dialog-form">
        <el-form-item label="检验名称"><el-input v-model="form.inspectionName" /></el-form-item>
        <el-form-item label="检验数量" required><el-input-number v-model="form.inspectQuantity" :min="0.0001" :precision="4" /></el-form-item>
        <el-form-item label="合格数量" required><el-input-number v-model="form.passQuantity" :min="0" :precision="4" /></el-form-item>
        <el-form-item label="不合格数量" required><el-input-number v-model="form.failQuantity" :min="0" :precision="4" /></el-form-item>
        <el-form-item label="检验结果"><el-tag :type="resultMeta.type">{{ resultMeta.label }}</el-tag></el-form-item>
        <el-form-item label="处置方式" required><el-select v-model="form.disposition"><el-option v-for="item in dispositions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="检测文件"><el-input v-model="form.fileUrl" placeholder="报告、图片或测试文件地址" /></el-form-item>
        <el-form-item label="结果说明"><el-input v-model="form.resultSummary" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submit">提交检验</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue';
import type { InspectionDisposition, InspectionResult, PendingProcessInspectionItem, SubmitProcessInspectionPayload } from '@company/api-contract';
import { ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { qualityApi } from '../../api/quality';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

// 列表查询和分页状态：待检任务由数据库视图实时派生。
const query=reactive({keyword:''}),rows=ref<PendingProcessInspectionItem[]>([]),total=ref(0),page=ref(1),pageSize=ref(10),loading=ref(false);
// 检验弹窗状态：保存当前工序及本次检验数量、处置结果。
const visible=ref(false),saving=ref(false),active=ref<PendingProcessInspectionItem|null>(null);
const blank=():SubmitProcessInspectionPayload=>({inspectionName:'过程检验',inspectQuantity:0,passQuantity:0,failQuantity:0,result:'pass',disposition:'accept',fileUrl:'',resultSummary:'',remark:''});
const form=reactive(blank());
const result=computed<InspectionResult>(()=>Number(form.failQuantity)===0?'pass':Number(form.passQuantity)===0?'fail':'partial_pass');
const dispositions=computed<Array<{label:string;value:InspectionDisposition}>>(()=>result.value==='pass'?[{label:'接收',value:'accept'}]:result.value==='partial_pass'?[{label:'有条件接收',value:'conditional_accept'},{label:'返工',value:'rework'},{label:'报废',value:'scrap'},{label:'暂扣',value:'hold'}]:[{label:'拒收',value:'reject'},{label:'返工',value:'rework'},{label:'报废',value:'scrap'},{label:'暂扣',value:'hold'}]);
const resultMeta=computed(()=>result.value==='pass'?{label:'合格',type:'success' as const}:result.value==='fail'?{label:'不合格',type:'danger' as const}:{label:'部分合格',type:'warning' as const});
watch(result,()=>{if(!dispositions.value.some(item=>item.value===form.disposition))form.disposition=dispositions.value[0]?.value??null});

/** 加载待检任务，普通查询失败也必须明确反馈。 */
async function load(){loading.value=true;try{const data=await qualityApi.listPendingProcessTasks({...query,page:page.value,pageSize:pageSize.value});rows.value=data.items;total.value=data.total}catch(error){EMessage.error(error,'待检任务加载失败')}finally{loading.value=false}}
function search(){page.value=1;void load()} function reset(){query.keyword='';search()}
/** 打开检验弹窗，并以该工序合格产出作为建议抽检数量。 */
function openSubmit(row:PendingProcessInspectionItem){active.value=row;const quantity=row.suggestedInspectQuantity;Object.assign(form,blank(),{inspectQuantity:quantity,passQuantity:quantity,failQuantity:0});visible.value=true}
function clearForm(){active.value=null;Object.assign(form,blank())}
/** 提交前校验数量公式并二次确认，成功后刷新列表使任务消失。 */
async function submit(){if(!active.value)return;const inspect=Number(form.inspectQuantity),pass=Number(form.passQuantity),fail=Number(form.failQuantity);if(!Number.isFinite(inspect)||inspect<=0||pass<0||fail<0||Math.abs(pass+fail-inspect)>.00005)return EMessage.warning('检验数量必须大于0，且等于合格数量与不合格数量之和');try{await ElMessageBox.confirm('提交后将生成正式过程检验记录，确认继续吗？','提交确认',{type:'warning',confirmButtonText:'确认提交',cancelButtonText:'取消'});saving.value=true;await qualityApi.submitProcessInspection(active.value.id,{...form,result:result.value});EMessage.success('过程检验已提交');visible.value=false;await load()}catch(error){if(error==='cancel'||error==='close')return;EMessage.error(error,'过程检验提交失败')}finally{saving.value=false}}
function openSop(url:string){window.open(url,'_blank','noopener,noreferrer')} const formatTime=(value:string|null)=>value?new Date(value).toLocaleString('zh-CN',{hour12:false}):'-';
onMounted(load);
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px}.panel{padding:16px;background:#fff;border-radius:8px}.toolbar,.footer{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.toolbar-end{justify-content:flex-end}.footer{margin:16px 0 0}.muted{margin-top:4px;color:#909399;font-size:12px}.dialog-form{margin-top:18px}
</style>
