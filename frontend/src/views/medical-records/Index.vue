<template>
  <div class="medical-records-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2>病历管理</h2>
        <p>管理患者病历信息，支持新增、编辑、查看和审核</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增病历
        </el-button>
        <el-button @click="handleBatchApprove" :disabled="selectedRecords.length === 0">
          <el-icon><Check /></el-icon>
          批量审核
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ statistics.total || 0 }}</h3>
                <p>病历总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon submitted">
                <el-icon><Upload /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ statistics.submitted || 0 }}</h3>
                <p>待审核</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon approved">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ statistics.approved || 0 }}</h3>
                <p>已审核</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon urgent">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ statistics.urgencyStats?.URGENT || 0 }}</h3>
                <p>紧急病历</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="病历编号/患者姓名/诊断"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="患者">
          <el-select
            v-model="searchForm.patientId"
            placeholder="选择患者"
            clearable
            filterable
            remote
            :remote-method="searchPatients"
            :loading="patientLoading"
          >
            <el-option
              v-for="patient in patientOptions"
              :key="patient.id"
              :label="`${patient.name} (${patient.age}岁)`"
              :value="patient.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="医生">
          <el-select
            v-model="searchForm.doctorId"
            placeholder="选择医生"
            clearable
          >
            <el-option
              v-for="doctor in doctorOptions"
              :key="doctor.id"
              :label="`${doctor.name} (${doctor.department})`"
              :value="doctor.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="病历类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable>
            <el-option
              v-for="(label, value) in RECORD_TYPE_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option
              v-for="(label, value) in RECORD_STATUS_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-select v-model="searchForm.urgency" placeholder="全部" clearable>
            <el-option
              v-for="(label, value) in RECORD_URGENCY_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="就诊日期">
          <el-date-picker
            v-model="searchForm.visitDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 病历列表 -->
    <el-card class="table-card">
      <el-table
        :data="recordList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="recordId" label="病历编号" width="120" />
        <el-table-column prop="patient.name" label="患者" width="100">
          <template #default="{ row }">
            {{ row.patient.name }}
          </template>
        </el-table-column>
        <el-table-column prop="patient.age" label="年龄" width="60" />
        <el-table-column prop="patient.phone" label="手机号" width="120" />
        <el-table-column prop="doctor.name" label="主治医生" width="100">
          <template #default="{ row }">
            {{ row.doctor.name }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="病历类型" width="100">
          <template #default="{ row }">
            {{ RECORD_TYPE_MAP[row.type] }}
          </template>
        </el-table-column>
        <el-table-column prop="department" label="科室" width="100" />
        <el-table-column prop="diagnosis" label="诊断" width="200" show-overflow-tooltip />
        <el-table-column prop="urgency" label="紧急程度" width="100">
          <template #default="{ row }">
            <el-tag :type="RECORD_URGENCY_COLOR_MAP[row.urgency]">
              {{ RECORD_URGENCY_MAP[row.urgency] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="RECORD_STATUS_COLOR_MAP[row.status]">
              {{ RECORD_STATUS_MAP[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="visitDate" label="就诊日期" width="120" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">
              查看
            </el-button>
            <el-button
              v-if="canEdit(row)"
              type="warning"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canSubmit(row)"
              type="success"
              link
              @click="handleSubmit(row)"
            >
              提交
            </el-button>
            <el-button
              v-if="canApprove(row)"
              type="info"
              link
              @click="handleApprove(row)"
            >
              审核
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 批量操作 -->
    <div v-if="selectedRecords.length > 0" class="batch-actions">
      <span>已选择 {{ selectedRecords.length }} 项</span>
      <el-button type="success" @click="handleBatchApprove">
        批量审核
      </el-button>
      <el-button type="danger" @click="handleBatchDelete">
        批量删除
      </el-button>
    </div>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="approveDialog.visible"
      :title="`审核病历 - ${approveDialog.record?.patient?.name || ''}`"
      width="600px"
      :before-close="handleApproveDialogClose"
    >
      <el-form
        ref="approveFormRef"
        :model="approveForm"
        :rules="approveRules"
        label-width="80px"
      >
        <el-form-item label="审核操作" prop="action">
          <el-radio-group v-model="approveForm.action">
            <el-radio value="APPROVE">通过</el-radio>
            <el-radio value="REJECT">驳回</el-radio>
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

      <template #footer>
        <el-button @click="approveDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="approveDialog.loading"
          @click="handleApproveSubmit"
        >
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus,
  Check,
  Download,
  Search,
  Refresh,
  Document,
  Upload,
  CircleCheck,
  Warning
} from '@element-plus/icons-vue'
import { medicalRecordApi } from '@/api/medical-records'
import type {
  MedicalRecord,
  MedicalRecordQuery,
  MedicalRecordStatistics,
  MedicalRecordApproveForm,
  Patient
} from '@/types/medical-record'
import {
  RECORD_TYPE_MAP,
  RECORD_STATUS_MAP,
  RECORD_URGENCY_MAP,
  RECORD_STATUS_COLOR_MAP,
  RECORD_URGENCY_COLOR_MAP
} from '@/types/medical-record'
import { patientApi } from '@/api/patients'

const router = useRouter()

// 数据状态
const loading = ref(false)
const recordList = ref<MedicalRecord[]>([])
const selectedRecords = ref<MedicalRecord[]>([])
const statistics = ref<MedicalRecordStatistics>({})
const patientOptions = ref<Patient[]>([])
const doctorOptions = ref<any[]>([])
const patientLoading = ref(false)

// 搜索表单
const searchForm = reactive<MedicalRecordQuery & { visitDateRange: string[] }>({
  keyword: '',
  patientId: undefined,
  doctorId: undefined,
  type: undefined,
  status: undefined,
  urgency: undefined,
  visitDateStart: undefined,
  visitDateEnd: undefined,
  visitDateRange: [],
  page: 1,
  pageSize: 20
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 审核对话框
const approveDialog = reactive({
  visible: false,
  record: null as MedicalRecord | null,
  loading: false
})

// 审核表单
const approveFormRef = ref<FormInstance>()
const approveForm = reactive<MedicalRecordApproveForm>({
  action: 'APPROVE',
  comment: '',
  approvedBy: 1 // TODO: 从用户信息获取
})

// 审核表单验证规则
const approveRules: FormRules<MedicalRecordApproveForm> = {
  action: [
    { required: true, message: '请选择审核操作', trigger: 'change' }
  ],
  comment: [
    { required: true, message: '请输入审核意见', trigger: 'blur' },
    { min: 5, max: 500, message: '审核意见长度在5到500个字符', trigger: 'blur' }
  ]
}

// 权限检查
const canEdit = (record: MedicalRecord) => {
  return record.status === 'DRAFT'
}

const canSubmit = (record: MedicalRecord) => {
  return record.status === 'DRAFT'
}

const canApprove = (record: MedicalRecord) => {
  return record.status === 'SUBMITTED' || record.status === 'REVIEWING'
}

// 加载病历列表
const loadMedicalRecords = async () => {
  try {
    loading.value = true

    // 处理日期范围
    if (searchForm.visitDateRange && searchForm.visitDateRange.length === 2) {
      searchForm.visitDateStart = searchForm.visitDateRange[0]
      searchForm.visitDateEnd = searchForm.visitDateRange[1]
    } else {
      searchForm.visitDateStart = undefined
      searchForm.visitDateEnd = undefined
    }

    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    // 移除不需要的字段
    const { visitDateRange, ...queryParams } = params

    const response = await medicalRecordApi.getMedicalRecords(queryParams)

    recordList.value = response.items
    pagination.total = response.total
  } catch (error) {
    ElMessage.error('加载病历列表失败')
  } finally {
    loading.value = false
  }
}

// 加载统计信息
const loadStatistics = async () => {
  try {
    const data = await medicalRecordApi.getMedicalRecordStatistics()
    statistics.value = data
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

// 搜索患者
const searchPatients = async (query: string) => {
  if (!query) {
    patientOptions.value = []
    return
  }

  try {
    patientLoading.value = true
    const patients = await patientApi.searchPatients(query, 20)
    patientOptions.value = patients
  } catch (error) {
    console.error('搜索患者失败:', error)
  } finally {
    patientLoading.value = false
  }
}

// 加载医生选项（模拟数据，实际应该从API获取）
const loadDoctors = () => {
  doctorOptions.value = [
    { id: 1, name: '张医生', department: '内科' },
    { id: 2, name: '李医生', department: '外科' },
    { id: 3, name: '王医生', department: '儿科' },
    { id: 4, name: '赵医生', department: '妇产科' },
    { id: 5, name: '陈医生', department: '眼科' }
  ]
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadMedicalRecords()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    patientId: undefined,
    doctorId: undefined,
    type: undefined,
    status: undefined,
    urgency: undefined,
    visitDateStart: undefined,
    visitDateEnd: undefined,
    visitDateRange: [],
    page: 1,
    pageSize: 20
  })
  pagination.page = 1
  loadMedicalRecords()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  loadMedicalRecords()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadMedicalRecords()
}

// 选择变化
const handleSelectionChange = (selection: MedicalRecord[]) => {
  selectedRecords.value = selection
}

// 新增病历
const handleCreate = () => {
  router.push('/medical-records/create')
}

// 查看病历
const handleView = (record: MedicalRecord) => {
  router.push(`/medical-records/${record.id}`)
}

// 编辑病历
const handleEdit = (record: MedicalRecord) => {
  router.push(`/medical-records/${record.id}/edit`)
}

// 提交病历
const handleSubmit = async (record: MedicalRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要提交病历 "${record.patient.name}" 吗？提交后将进入审核流程。`,
      '确认提交',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await medicalRecordApi.submitMedicalRecord(record.id)
    ElMessage.success('提交成功')
    loadMedicalRecords()
    loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('提交失败')
    }
  }
}

// 审核病历
const handleApprove = (record: MedicalRecord) => {
  approveDialog.record = record
  approveDialog.visible = true
  approveForm.action = 'APPROVE'
  approveForm.comment = ''
}

// 批量审核
const handleBatchApprove = () => {
  if (selectedRecords.value.length === 0) return

  const firstRecord = selectedRecords.value[0]
  approveDialog.record = firstRecord
  approveDialog.visible = true
  approveForm.action = 'APPROVE'
  approveForm.comment = ''
}

// 删除病历
const handleDelete = async (record: MedicalRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${record.patient.name}" 的病历吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await medicalRecordApi.deleteMedicalRecord(record.id)
    ElMessage.success('删除成功')
    loadMedicalRecords()
    loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRecords.value.length} 份病历吗？此操作不可恢复。`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const promises = selectedRecords.value.map(record =>
      medicalRecordApi.deleteMedicalRecord(record.id)
    )
    await Promise.all(promises)

    ElMessage.success('批量删除成功')
    selectedRecords.value = []
    loadMedicalRecords()
    loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 导出数据
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 提交审核
const handleApproveSubmit = async () => {
  if (!approveFormRef.value || !approveDialog.record) return

  try {
    await approveFormRef.value.validate()
    approveDialog.loading = true

    await medicalRecordApi.approveMedicalRecord(
      approveDialog.record.id,
      {
        ...approveForm,
        approvedBy: approveForm.approvedBy
      }
    )

    ElMessage.success('审核成功')
    approveDialog.visible = false
    loadMedicalRecords()
    loadStatistics()
  } catch (error: any) {
    if (error.errors) {
      return // 表单验证错误
    }
    ElMessage.error('审核失败')
  } finally {
    approveDialog.loading = false
  }
}

// 关闭审核对话框
const handleApproveDialogClose = (done: () => void) => {
  if (approveDialog.loading) {
    return
  }
  done()
}

// 初始化
onMounted(() => {
  loadMedicalRecords()
  loadStatistics()
  loadDoctors()
})
</script>

<style scoped>
.medical-records-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.submitted {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.approved {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.urgent {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info h3 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-info p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}
</style>