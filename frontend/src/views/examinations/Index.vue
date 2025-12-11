<template>
  <div class="examinations-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>检查管理</h2>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增检查
          </el-button>
        </div>
      </template>

      <!-- 搜索筛选区域 -->
      <div class="search-section">
        <el-form :model="searchForm" inline class="search-form">
          <el-form-item label="患者姓名">
            <el-input
              v-model="searchForm.patientName"
              placeholder="请输入患者姓名"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="检查编号">
            <el-input
              v-model="searchForm.examId"
              placeholder="请输入检查编号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="检查类型">
            <el-select
              v-model="searchForm.type"
              placeholder="请选择检查类型"
              clearable
            >
              <el-option
                v-for="(label, value) in EXAMINATION_TYPE_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
            >
              <el-option
                v-for="(label, value) in EXAMINATION_STATUS_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="申请时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleSearch"
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
      </div>

      <!-- 统计卡片 -->
      <div class="statistics-cards">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalExaminations }}</div>
                <div class="stat-label">总检查数</div>
              </div>
              <el-icon class="stat-icon primary"><DataAnalysis /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.pendingExaminations }}</div>
                <div class="stat-label">待检查</div>
              </div>
              <el-icon class="stat-icon warning"><Clock /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.completedExaminations }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <el-icon class="stat-icon success"><CircleCheck /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.todayExaminations }}</div>
                <div class="stat-label">今日检查</div>
              </div>
              <el-icon class="stat-icon info"><Calendar /></el-icon>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 检查列表表格 -->
      <el-table
        v-loading="loading"
        :data="examinationList"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="examId" label="检查编号" width="140" />
        <el-table-column prop="patient.name" label="患者姓名" width="120" />
        <el-table-column prop="patient.medicalRecordNumber" label="病历号" width="140" />
        <el-table-column prop="name" label="检查名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="type" label="检查类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getExaminationTypeColor(row.type)">
              {{ EXAMINATION_TYPE_LABELS[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getExaminationStatusColor(row.status)">
              {{ EXAMINATION_STATUS_LABELS[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="doctor.name" label="申请医生" width="120" />
        <el-table-column prop="scheduledDate" label="预约时间" width="160" />
        <el-table-column prop="createdAt" label="申请时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button type="warning" link size="small" @click="handleEdit(row)" v-if="row.status === 'PENDING'">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="success" link size="small" @click="handleReport(row)" v-if="row.status === 'COMPLETED'">
              <el-icon><Document /></el-icon>
              报告
            </el-button>
            <el-dropdown @command="(command) => handleMoreAction(command, row)">
              <el-button type="info" link size="small">
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="cancel" v-if="row.status === 'PENDING'">
                    <el-icon><Close /></el-icon>
                    取消检查
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除记录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 批量操作 -->
      <div v-if="selectedRows.length > 0" class="batch-actions">
        <el-card>
          <div class="batch-content">
            <span>已选择 {{ selectedRows.length }} 项</span>
            <div class="batch-buttons">
              <el-button type="warning" @click="handleBatchCancel">
                批量取消
              </el-button>
              <el-button type="danger" @click="handleBatchDelete">
                批量删除
              </el-button>
              <el-button @click="handleClearSelection">
                清除选择
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  View,
  Edit,
  Document,
  ArrowDown,
  Close,
  Delete,
  DataAnalysis,
  Clock,
  CircleCheck,
  Calendar
} from '@element-plus/icons-vue'
import type {
  Examination,
  ExaminationQuery,
  ExaminationListResponse
} from '@/types/examination'
import { examinationApi } from '@/api/examinations'
import {
  EXAMINATION_TYPE_LABELS,
  EXAMINATION_STATUS_LABELS,
  getExaminationTypeColor,
  getExaminationStatusColor
} from '@/types/examination'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const examinationList = ref<Examination[]>([])
const selectedRows = ref<Examination[]>([])

// 统计数据
const statistics = reactive({
  totalExaminations: 0,
  pendingExaminations: 0,
  completedExaminations: 0,
  todayExaminations: 0
})

// 搜索表单
const searchForm = reactive<ExaminationQuery>({
  page: 1,
  pageSize: 20,
  orderBy: 'createdAt',
  orderDirection: 'desc'
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 获取检查列表
const fetchExaminations = async () => {
  loading.value = true
  try {
    searchForm.page = pagination.page
    searchForm.pageSize = pagination.pageSize

    const response = await examinationApi.getExaminations(searchForm)
    examinationList.value = response.data.list
    pagination.total = response.data.total

    // 更新统计信息
    statistics.totalExaminations = pagination.total
    statistics.pendingExaminations = examinationList.value.filter(e => e.status === 'PENDING').length
    statistics.completedExaminations = examinationList.value.filter(e => e.status === 'COMPLETED').length
    statistics.todayExaminations = examinationList.value.filter(e => {
      const today = new Date().toISOString().split('T')[0]
      return e.createdAt.startsWith(today)
    }).length
  } catch (error) {
    ElMessage.error('获取检查列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchExaminations()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    page: 1,
    pageSize: 20,
    patientName: '',
    examId: '',
    type: '',
    status: '',
    dateRange: [],
    orderBy: 'createdAt',
    orderDirection: 'desc'
  })
  fetchExaminations()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchExaminations()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchExaminations()
}

// 选择变化
const handleSelectionChange = (selection: Examination[]) => {
  selectedRows.value = selection
}

// 清除选择
const handleClearSelection = () => {
  selectedRows.value = []
}

// 创建检查
const handleCreate = () => {
  router.push('/examinations/create')
}

// 查看详情
const handleView = (row: Examination) => {
  router.push(`/examinations/${row.id}`)
}

// 编辑检查
const handleEdit = (row: Examination) => {
  router.push(`/examinations/${row.id}/edit`)
}

// 查看报告
const handleReport = (row: Examination) => {
  router.push(`/examinations/${row.id}/report`)
}

// 更多操作
const handleMoreAction = async (command: string, row: Examination) => {
  switch (command) {
    case 'cancel':
      await handleCancel(row)
      break
    case 'delete':
      await handleDelete(row)
      break
  }
}

// 取消检查
const handleCancel = async (row: Examination) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消检查"${row.name}"吗？`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await examinationApi.updateExaminationStatus(row.id, 'CANCELLED')
    ElMessage.success('取消成功')
    fetchExaminations()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 删除检查
const handleDelete = async (row: Examination) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除检查"${row.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await examinationApi.deleteExamination(row.id)
    ElMessage.success('删除成功')
    fetchExaminations()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量取消
const handleBatchCancel = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要取消的检查')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要取消选中的 ${selectedRows.value.length} 个检查吗？`,
      '确认批量取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const promises = selectedRows.value
      .filter(row => row.status === 'PENDING')
      .map(row => examinationApi.updateExaminationStatus(row.id, 'CANCELLED'))

    await Promise.all(promises)
    ElMessage.success('批量取消成功')
    fetchExaminations()
    handleClearSelection()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量取消失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的检查')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个检查吗？此操作不可恢复。`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const promises = selectedRows.value.map(row => examinationApi.deleteExamination(row.id))
    await Promise.all(promises)
    ElMessage.success('批量删除成功')
    fetchExaminations()
    handleClearSelection()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  fetchExaminations()
})
</script>

<style scoped>
.examinations-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  position: relative;
  z-index: 1;
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40px;
  opacity: 0.1;
}

.stat-icon.primary {
  color: #409eff;
}

.stat-icon.warning {
  color: #e6a23c;
}

.stat-icon.success {
  color: #67c23a;
}

.stat-icon.info {
  color: #909399;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.batch-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>