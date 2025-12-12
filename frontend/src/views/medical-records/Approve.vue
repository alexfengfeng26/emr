<template>
  <div class="medical-record-approve-container">
    <!-- 页面头部 -->
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <h2>病历审核</h2>
          <div class="header-actions">
            <el-button @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        class="search-form"
      >
        <el-form-item label="患者姓名">
          <el-input
            v-model="searchForm.patientName"
            placeholder="请输入患者姓名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="病历类型">
          <el-select
            v-model="searchForm.recordType"
            placeholder="请选择病历类型"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="(label, value) in RECORD_TYPE_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 待审核列表 -->
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>待审核病历</span>
          <el-badge :value="totalRecords" type="primary" />
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="recordList"
        element-loading-text="正在加载..."
        empty-text="暂无待审核病历"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="patientName" label="患者姓名" width="120" />
        <el-table-column prop="recordType" label="病历类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getRecordTypeColor(row.recordType)" size="small">
              {{ RECORD_TYPE_LABELS[row.recordType] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="就诊科室" width="120" />
        <el-table-column prop="doctorName" label="主治医生" width="120" />
        <el-table-column prop="chiefComplaint" label="主诉" min-width="200" show-overflow-tooltip />
        <el-table-column prop="preliminaryDiagnosis" label="初步诊断" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag
              v-for="diagnosis in row.preliminaryDiagnosis?.slice(0, 2)"
              :key="diagnosis"
              size="small"
              style="margin-right: 4px"
            >
              {{ diagnosis }}
            </el-tag>
            <span v-if="row.preliminaryDiagnosis?.length > 2">
              +{{ row.preliminaryDiagnosis.length - 2 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.submitTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="submitterName" label="提交人" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              查看详情
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 病历详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="病历详情"
      width="90%"
      :close-on-click-modal="false"
    >
      <div v-if="currentRecord" class="record-detail">
        <!-- 基本信息 -->
        <el-card class="detail-section">
          <template #header>基本信息</template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="患者姓名">{{ currentRecord.patientName }}</el-descriptions-item>
            <el-descriptions-item label="病历类型">
              <el-tag :type="getRecordTypeColor(currentRecord.recordType)">
                {{ RECORD_TYPE_LABELS[currentRecord.recordType] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="就诊日期">{{ currentRecord.visitDate }}</el-descriptions-item>
            <el-descriptions-item label="就诊科室">{{ currentRecord.department }}</el-descriptions-item>
            <el-descriptions-item label="主治医生">{{ currentRecord.doctorName }}</el-descriptions-item>
            <el-descriptions-item label="就诊方式">{{ currentRecord.visitType }}</el-descriptions-item>
            <el-descriptions-item label="提交时间" :span="2">{{ formatDateTime(currentRecord.submitTime) }}</el-descriptions-item>
            <el-descriptions-item label="提交人">{{ currentRecord.submitterName }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 病史信息 -->
        <el-card class="detail-section">
          <template #header>病史信息</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="主诉">{{ currentRecord.chiefComplaint }}</el-descriptions-item>
            <el-descriptions-item label="现病史">
              <div v-html="currentRecord.presentIllnessHistory"></div>
            </el-descriptions-item>
            <el-descriptions-item label="既往史">
              <div v-html="currentRecord.pastHistory"></div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 检查信息 -->
        <el-card class="detail-section">
          <template #header>检查信息</template>
          <el-tabs v-model="examTab" type="card">
            <el-tab-pane label="体格检查" name="physical">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="体温">{{ currentRecord.physicalExamination?.general?.temperature }}℃</el-descriptions-item>
                <el-descriptions-item label="脉搏">{{ currentRecord.physicalExamination?.general?.pulse }}次/分</el-descriptions-item>
                <el-descriptions-item label="血压">{{ currentRecord.physicalExamination?.general?.bloodPressure }}mmHg</el-descriptions-item>
                <el-descriptions-item label="专科检查" :span="2">
                  <div v-html="currentRecord.physicalExamination?.specialist"></div>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            <el-tab-pane label="辅助检查" name="auxiliary">
              <div v-html="currentRecord.auxiliaryExamination"></div>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 诊断和治疗 -->
        <el-card class="detail-section">
          <template #header>诊断和治疗</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="初步诊断">
              <el-tag
                v-for="diagnosis in currentRecord.preliminaryDiagnosis"
                :key="diagnosis"
                style="margin-right: 8px; margin-bottom: 4px"
              >
                {{ diagnosis }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="治疗方案">
              <div v-html="currentRecord.treatmentPlan"></div>
            </el-descriptions-item>
            <el-descriptions-item label="医嘱">
              <div v-html="currentRecord.medicalAdvice"></div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 处方信息 -->
        <el-card v-if="currentRecord.prescriptions?.length" class="detail-section">
          <template #header>处方信息</template>
          <el-table :data="currentRecord.prescriptions" border>
            <el-table-column prop="medicineName" label="药品名称" />
            <el-table-column prop="specification" label="规格" />
            <el-table-column prop="dosage" label="用量" />
            <el-table-column prop="frequency" label="频次" />
            <el-table-column prop="duration" label="疗程" />
          </el-table>
        </el-card>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="病历审核"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="currentRecord" class="approve-content">
        <div class="record-summary">
          <h4>病历概要</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="患者">{{ currentRecord.patientName }}</el-descriptions-item>
            <el-descriptions-item label="病历类型">{{ RECORD_TYPE_LABELS[currentRecord.recordType] }}</el-descriptions-item>
            <el-descriptions-item label="主治医生">{{ currentRecord.doctorName }}</el-descriptions-item>
            <el-descriptions-item label="就诊科室">{{ currentRecord.department }}</el-descriptions-item>
            <el-descriptions-item label="初步诊断" :span="2">
              <el-tag
                v-for="diagnosis in currentRecord.preliminaryDiagnosis"
                :key="diagnosis"
                size="small"
                style="margin-right: 4px"
              >
                {{ diagnosis }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-form
          ref="approveFormRef"
          :model="approveForm"
          :rules="approveRules"
          label-width="80px"
          style="margin-top: 20px"
        >
          <el-form-item label="审核结果" prop="result">
            <el-radio-group v-model="approveForm.result">
              <el-radio value="APPROVED" style="margin-bottom: 10px">
                <span style="color: #67c23a">通过</span>
              </el-radio>
              <el-radio value="REJECTED">
                <span style="color: #f56c6c">拒绝</span>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="审核意见" prop="comment">
            <el-input
              v-model="approveForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入审核意见"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="approving"
          @click="handleSubmitApprove"
        >
          确认审核
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量审核 -->
    <div v-if="selectedRecords.length > 0" class="batch-actions">
      <el-card>
        <template #header>
          <span>批量操作 (已选择 {{ selectedRecords.length }} 条记录)</span>
        </template>
        <div class="batch-buttons">
          <el-button
            type="success"
            :loading="batchApproving"
            @click="handleBatchApprove"
          >
            批量通过
          </el-button>
          <el-button
            type="danger"
            :loading="batchRejecting"
            @click="handleBatchReject"
          >
            批量拒绝
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import {
  medicalRecordApi,
  type MedicalRecord,
  type MedicalRecordApproveForm,
  type MedicalRecordQuery,
  RECORD_TYPE_LABELS,
  getRecordTypeColor
} from '@/api/medical-records'

// 响应式数据
const loading = ref(false)
const approving = ref(false)
const batchApproving = ref(false)
const batchRejecting = ref(false)
const recordList = ref<MedicalRecord[]>([])
const selectedRecords = ref<MedicalRecord[]>([])
const currentRecord = ref<MedicalRecord | null>(null)
const detailDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const examTab = ref('physical')

// 表单引用
const searchFormRef = ref<FormInstance>()
const approveFormRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive({
  patientName: '',
  recordType: '',
  dateRange: null as [string, string] | null
})

// 审核表单
const approveForm = reactive<MedicalRecordApproveForm>({
  result: 'APPROVED',
  comment: ''
})

// 审核表单验证规则
const approveRules = {
  result: [
    { required: true, message: '请选择审核结果', trigger: 'change' }
  ],
  comment: [
    { required: true, message: '请输入审核意见', trigger: 'blur' }
  ]
}

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

const totalRecords = computed(() => pagination.total)

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 加载待审核病历列表
const loadRecords = async () => {
  try {
    loading.value = true
    const query: MedicalRecordQuery = {
      status: 'SUBMITTED',
      page: pagination.current,
      pageSize: pagination.pageSize
    }

    if (searchForm.patientName) {
      query.patientName = searchForm.patientName
    }
    if (searchForm.recordType) {
      query.recordType = searchForm.recordType
    }
    if (searchForm.dateRange) {
      query.startDate = searchForm.dateRange[0]
      query.endDate = searchForm.dateRange[1]
    }

    const response = await medicalRecordApi.getMedicalRecords(query)
    recordList.value = response.list
    pagination.total = response.total
  } catch (error) {
    console.error('加载病历列表失败:', error)
    ElMessage.error('加载病历列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadRecords()
}

// 重置搜索
const handleReset = () => {
  searchForm.patientName = ''
  searchForm.recordType = ''
  searchForm.dateRange = null
  pagination.current = 1
  loadRecords()
}

// 刷新
const handleRefresh = () => {
  loadRecords()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.current = 1
  loadRecords()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  loadRecords()
}

// 选择变化
const handleSelectionChange = (selection: MedicalRecord[]) => {
  selectedRecords.value = selection
}

// 查看详情
const handleViewDetail = (record: MedicalRecord) => {
  currentRecord.value = record
  detailDialogVisible.value = true
}

// 审核
const handleApprove = (record: MedicalRecord) => {
  currentRecord.value = record
  approveForm.result = 'APPROVED'
  approveForm.comment = ''
  approveDialogVisible.value = true
}

// 提交审核
const handleSubmitApprove = async () => {
  if (!approveFormRef.value || !currentRecord.value) return

  try {
    await approveFormRef.value.validate()

    approving.value = true
    await medicalRecordApi.approveMedicalRecord(currentRecord.value.id, approveForm)

    ElMessage.success('审核完成')
    approveDialogVisible.value = false
    loadRecords()
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('审核失败')
  } finally {
    approving.value = false
  }
}

// 批量通过
const handleBatchApprove = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要通过这 ${selectedRecords.value.length} 条病历的审核吗？`,
      '批量通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    batchApproving.value = true
    const promises = selectedRecords.value.map(record =>
      medicalRecordApi.approveMedicalRecord(record.id, {
        result: 'APPROVED',
        comment: '批量通过'
      })
    )

    await Promise.all(promises)
    ElMessage.success(`已通过 ${selectedRecords.value.length} 条病历的审核`)
    loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核失败:', error)
      ElMessage.error('批量审核失败')
    }
  } finally {
    batchApproving.value = false
  }
}

// 批量拒绝
const handleBatchReject = async () => {
  try {
    const { value: comment } = await ElMessageBox.prompt(
      `确定要拒绝这 ${selectedRecords.value.length} 条病历的审核吗？请输入拒绝原因：`,
      '批量拒绝',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value: string) => {
          if (!value || value.trim() === '') {
            return '请输入拒绝原因'
          }
          return true
        }
      }
    )

    batchRejecting.value = true
    const promises = selectedRecords.value.map(record =>
      medicalRecordApi.approveMedicalRecord(record.id, {
        result: 'REJECTED',
        comment: comment || '批量拒绝'
      })
    )

    await Promise.all(promises)
    ElMessage.success(`已拒绝 ${selectedRecords.value.length} 条病历的审核`)
    loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核失败:', error)
      ElMessage.error('批量审核失败')
    }
  } finally {
    batchRejecting.value = false
  }
}

// 组件挂载
onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.medical-record-approve-container {
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.header-card {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  color: #303133;
}

.main-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.approve-content {
  max-height: 60vh;
  overflow-y: auto;
}

.record-summary h4 {
  margin-bottom: 12px;
  color: #303133;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  max-width: 400px;
}

.batch-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

:deep(.el-card__header) {
  background-color: #f5f7fa;
}

:deep(.el-descriptions__body) {
  background-color: #fafafa;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>