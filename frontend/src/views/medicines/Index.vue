<template>
  <div class="medicines-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>药品管理</h2>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增药品
          </el-button>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="statistics-cards">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalMedicines }}</div>
                <div class="stat-label">药品总数</div>
              </div>
              <el-icon class="stat-icon primary"><MedicineBottle /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.activeMedicines }}</div>
                <div class="stat-label">在售药品</div>
              </div>
              <el-icon class="stat-icon success"><Check /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.prescriptionOnly }}</div>
                <div class="stat-label">处方药</div>
              </div>
              <el-icon class="stat-icon warning"><Warning /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.lowStockMedicines }}</div>
                <div class="stat-label">库存不足</div>
              </div>
              <el-icon class="stat-icon danger"><WarningFilled /></el-icon>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索和筛选 -->
      <div class="search-section">
        <el-form :model="searchForm" inline class="search-form">
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keywords"
              placeholder="药品名称/编号/厂商"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="分类">
            <el-select
              v-model="searchForm.category"
              placeholder="请选择分类"
              clearable
            >
              <el-option
                v-for="category in categories"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select
              v-model="searchForm.type"
              placeholder="请选择类型"
              clearable
            >
              <el-option
                v-for="(label, value) in MEDICINE_TYPE_LABELS"
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
                v-for="(label, value) in MEDICINE_STATUS_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="医保">
            <el-select
              v-model="searchForm.insuranceCoverage"
              placeholder="请选择"
              clearable
            >
              <el-option label="是" :value="true" />
              <el-option label="否" :value="false" />
            </el-select>
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
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="info" @click="handleImport">
              <el-icon><Upload /></el-icon>
              导入
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="medicineId" label="药品编号" width="140" />
        <el-table-column prop="genericName" label="通用名" min-width="120" show-overflow-tooltip />
        <el-table-column prop="tradeName" label="商品名" min-width="120" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getMedicineTypeColor(row.type)">
              {{ MEDICINE_TYPE_LABELS[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="specification" label="规格" width="120" />
        <el-table-column prop="manufacturer" label="生产厂家" width="150" show-overflow-tooltip />
        <el-table-column prop="price" label="单价" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getMedicineStatusColor(row.status)">
              {{ MEDICINE_STATUS_LABELS[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="insuranceCoverage" label="医保" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.insuranceCoverage" type="success" size="small">是</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button type="warning" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleMoreAction(command, row)">
              <el-button type="info" link>
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="updateStatus">
                    <el-icon><Refresh /></el-icon>
                    更新状态
                  </el-dropdown-item>
                  <el-dropdown-item command="duplicate">
                    <el-icon><CopyDocument /></el-icon>
                    复制药品
                  </el-dropdown-item>
                  <el-dropdown-item command="print">
                    <el-icon><Printer /></el-icon>
                    打印标签
                  </el-dropdown-item>
                  <el-dropdown-item divided command="delete">
                    <el-icon><Delete /></el-icon>
                    删除药品
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
    </el-card>

    <!-- 批量操作 -->
    <div v-if="selectedRows.length > 0" class="batch-actions">
      <el-card>
        <div class="batch-content">
          <span>已选择 {{ selectedRows.length }} 项</span>
          <div class="batch-buttons">
            <el-button type="warning" @click="handleBatchUpdateStatus">
              批量更新状态
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

    <!-- 状态更新对话框 -->
    <el-dialog
      v-model="statusDialogVisible"
      title="更新药品状态"
      width="400px"
    >
      <el-form :model="statusForm" label-width="80px">
        <el-form-item label="状态">
          <el-select v-model="statusForm.status" placeholder="请选择状态">
            <el-option
              v-for="(label, value) in MEDICINE_STATUS_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStatusUpdate">确认</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入药品数据"
      width="500px"
    >
      <el-upload
        class="upload-demo"
        drag
        action=""
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 xlsx/xls 文件，且不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>
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
  Download,
  Upload,
  View,
  Edit,
  ArrowDown,
  CopyDocument,
  Printer,
  Delete,
  MedicineBottle,
  Check,
  Warning,
  WarningFilled,
  UploadFilled
} from '@element-plus/icons-vue'
import type { Medicine, MedicineQuery, MedicineListResponse } from '@/types/medicine'
import {
  getMedicines,
  getMedicineCategories,
  deleteMedicine,
  updateMedicineStatus,
  batchDeleteMedicines,
  batchUpdateMedicineStatus,
  exportMedicines,
  importMedicines
} from '@/api/medicines'
import {
  MEDICINE_TYPE_LABELS,
  MEDICINE_STATUS_LABELS,
  getMedicineTypeColor,
  getMedicineStatusColor
} from '@/types/medicine'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const tableData = ref<Medicine[]>([])
const selectedRows = ref<Medicine[]>([])
const categories = ref<string[]>([])

// 统计数据
const statistics = reactive({
  totalMedicines: 0,
  activeMedicines: 0,
  prescriptionOnly: 0,
  lowStockMedicines: 0
})

// 搜索表单
const searchForm = reactive<MedicineQuery>({
  page: 1,
  pageSize: 20,
  orderBy: 'genericName',
  orderDirection: 'asc'
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 对话框状态
const statusDialogVisible = ref(false)
const importDialogVisible = ref(false)
const statusForm = reactive({
  status: '' as Medicine['status'],
  targetIds: [] as number[]
})

const importFile = ref<File | null>(null)

// 获取药品列表
const fetchMedicines = async () => {
  loading.value = true
  try {
    searchForm.page = pagination.page
    searchForm.pageSize = pagination.pageSize

    const response = await getMedicines(searchForm)
    tableData.value = response.data.list
    pagination.total = response.data.total

    // 更新统计信息
    statistics.totalMedicines = response.data.total
    statistics.activeMedicines = response.data.list.filter(m => m.status === 'ACTIVE').length
    statistics.prescriptionOnly = response.data.list.filter(m => m.type === 'PRESCRIPTION').length
    statistics.lowStockMedicines = Math.floor(response.data.total * 0.15) // 模拟数据
  } catch (error) {
    ElMessage.error('获取药品列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getMedicineCategories()
    categories.value = response.data.map(cat => cat.category)
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchMedicines()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    page: 1,
    pageSize: 20,
    keywords: '',
    category: '',
    type: '',
    status: '',
    insuranceCoverage: undefined,
    orderBy: 'genericName',
    orderDirection: 'asc'
  })
  fetchMedicines()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchMedicines()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchMedicines()
}

// 选择变化
const handleSelectionChange = (selection: Medicine[]) => {
  selectedRows.value = selection
}

// 清除选择
const handleClearSelection = () => {
  selectedRows.value = []
}

// 创建药品
const handleCreate = () => {
  router.push('/medicines/create')
}

// 查看详情
const handleView = (row: Medicine) => {
  router.push(`/medicines/${row.id}`)
}

// 编辑药品
const handleEdit = (row: Medicine) => {
  router.push(`/medicines/${row.id}/edit`)
}

// 更多操作
const handleMoreAction = async (command: string, row: Medicine) => {
  switch (command) {
    case 'updateStatus':
      statusForm.targetIds = [row.id]
      statusForm.status = row.status
      statusDialogVisible.value = true
      break
    case 'duplicate':
      router.push(`/medicines/create?duplicate=${row.id}`)
      break
    case 'print':
      ElMessage.success('打印功能开发中...')
      break
    case 'delete':
      await handleDelete(row)
      break
  }
}

// 删除药品
const handleDelete = async (row: Medicine) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除药品"${row.genericName}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteMedicine(row.id)
    ElMessage.success('删除成功')
    fetchMedicines()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量更新状态
const handleBatchUpdateStatus = () => {
  statusForm.targetIds = selectedRows.value.map(row => row.id)
  statusForm.status = ''
  statusDialogVisible.value = true
}

// 确认状态更新
const confirmStatusUpdate = async () => {
  try {
    if (statusForm.targetIds.length === 1) {
      await updateMedicineStatus(statusForm.targetIds[0], statusForm.status)
    } else {
      await batchUpdateMedicineStatus(statusForm.targetIds, statusForm.status)
    }

    ElMessage.success('状态更新成功')
    statusDialogVisible.value = false
    fetchMedicines()
    handleClearSelection()
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个药品吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await batchDeleteMedicines(selectedRows.value.map(row => row.id))
    ElMessage.success('批量删除成功')
    fetchMedicines()
    handleClearSelection()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 导出
const handleExport = async () => {
  try {
    const response = await exportMedicines(searchForm)
    // 创建下载链接
    const blob = new Blob([response])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `药品列表_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

// 文件变化
const handleFileChange = (file: any) => {
  importFile.value = file.raw
}

// 确认导入
const confirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  try {
    const response = await importMedicines(importFile.value)

    if (response.data.errors.length > 0) {
      ElMessageBox.alert(
        `导入完成：成功 ${response.data.success} 条，失败 ${response.data.failed} 条\n错误信息：\n${response.data.errors.join('\n')}`,
        '导入结果',
        { type: 'warning' }
      )
    } else {
      ElMessage.success(`导入成功，共导入 ${response.data.success} 条数据`)
    }

    importDialogVisible.value = false
    importFile.value = null
    fetchMedicines()
  } catch (error) {
    ElMessage.error('导入失败')
  }
}

// 初始化
onMounted(() => {
  fetchMedicines()
  fetchCategories()
})
</script>

<style scoped>
.medicines-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.stat-icon.success {
  color: #67c23a;
}

.stat-icon.warning {
  color: #e6a23c;
}

.stat-icon.danger {
  color: #f56c6c;
}

.search-section {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
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

.upload-demo {
  text-align: center;
}
</style>