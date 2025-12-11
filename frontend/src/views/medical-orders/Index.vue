<template>
  <div class="medical-order-container">
    <!-- 页面头部 -->
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <h2>医嘱管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新增医嘱
            </el-button>
            <el-button @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <div class="statistics-cards">
        <el-row :gutter="24">
          <el-col :span="6" v-for="(stat, index) in statistics" :key="index">
            <el-card class="stat-card" :class="stat.type">
              <div class="stat-content">
                <div class="stat-icon">
                  <el-icon :size="32"><component :is="stat.icon" /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stat.value }}</div>
                  <div class="stat-label">{{ stat.label }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 搜索表单 -->
    <el-card class="search-card">
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        inline
        class="search-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="患者姓名">
          <el-input
            v-model="searchForm.patientName"
            placeholder="请输入患者姓名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="医嘱类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择医嘱类型"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="(label, value) in ORDER_TYPE_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="医嘱状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择医嘱状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="(label, value) in ORDER_STATUS_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select
            v-model="searchForm.priority"
            placeholder="请选择优先级"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="(label, value) in PRIORITY_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
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

    <!-- 医嘱列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>医嘱列表</span>
          <div class="table-actions">
            <el-button-group>
              <el-button
                :type="activeTab === 'all' ? 'primary' : ''"
                @click="activeTab = 'all'"
              >
                全部 ({{ orderCount.all }})
              </el-button>
              <el-button
                :type="activeTab === 'pending' ? 'warning' : ''"
                @click="activeTab = 'pending'"
              >
                待执行 ({{ orderCount.pending }})
              </el-button>
              <el-button
                :type="activeTab === 'active' ? 'success' : ''"
                @click="activeTab = 'active'"
              >
                执行中 ({{ orderCount.active }})
              </el-button>
              <el-button
                :type="activeTab === 'urgent' ? 'danger' : ''"
                @click="activeTab = 'urgent'"
              >
                紧急 ({{ orderCount.urgent }})
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="orderList"
        element-loading-text="正在加载..."
        empty-text="暂无医嘱数据"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="order-detail">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="医嘱编号">{{ row.orderId }}</el-descriptions-item>
                <el-descriptions-item label="关联病历">{{ row.medicalRecordId }}</el-descriptions-item>
                <el-descriptions-item label="开始时间">{{ row.startDate }}</el-descriptions-item>
                <el-descriptions-item label="结束时间">{{ row.endDate || '长期' }}</el-descriptions-item>
                <el-descriptions-item label="适应症" :span="2">{{ row.indications || '-' }}</el-descriptions-item>
                <el-descriptions-item label="禁忌症" :span="2">{{ row.contraindications || '-' }}</el-descriptions-item>
                <el-descriptions-item label="副作用" :span="2">{{ row.sideEffects || '-' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="patient.name" label="患者" width="120">
          <template #default="{ row }">
            <div class="patient-info">
              <div>{{ row.patient.name }}</div>
              <div class="patient-meta">{{ row.patient.gender }} | {{ row.patient.age }}岁</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getOrderTypeColor(row.type)" size="small">
              {{ ORDER_TYPE_LABELS[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="医嘱标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusColor(row.status)" size="small">
              {{ ORDER_STATUS_LABELS[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="urgency" label="紧急程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getUrgencyColor(row.urgency)" size="small">
              {{ URGENCY_LABELS[row.urgency] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityColor(row.priority)" size="small">
              {{ PRIORITY_LABELS[row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="frequency" label="频次" width="100" />
        <el-table-column prop="doctor.name" label="开嘱医生" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="row.status === 'PENDING'"
              type="success"
              size="small"
              @click="handleExecute(row)"
            >
              执行
            </el-button>
            <el-dropdown v-if="canManageOrder(row)" @command="(command) => handleMoreCommand(command, row)">
              <el-button size="small">
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit" v-if="canEditOrder(row)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="copy">
                    <el-icon><CopyDocument /></el-icon>
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item command="suspend" v-if="canSuspendOrder(row)">
                    <el-icon><VideoPause /></el-icon>
                    暂停
                  </el-dropdown-item>
                  <el-dropdown-item command="resume" v-if="canResumeOrder(row)">
                    <el-icon><VideoPlay /></el-icon>
                    恢复
                  </el-dropdown-item>
                  <el-dropdown-item command="complete" v-if="canCompleteOrder(row)">
                    <el-icon><Check /></el-icon>
                    完成
                  </el-dropdown-item>
                  <el-dropdown-item command="cancel" v-if="canCancelOrder(row)">
                    <el-icon><Close /></el-icon>
                    取消
                  </el-dropdown-item>
                  <el-dropdown-item divided command="delete" v-if="canDeleteOrder(row)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <!-- 批量操作 -->
    <div v-if="selectedOrders.length > 0" class="batch-actions">
      <el-card>
        <template #header>
          <span>批量操作 (已选择 {{ selectedOrders.length }} 条记录)</span>
        </template>
        <div class="batch-buttons">
          <el-button
            type="success"
            :loading="batchExecuting"
            @click="handleBatchExecute"
          >
            批量执行
          </el-button>
          <el-button
            type="warning"
            :loading="batchSuspending"
            @click="handleBatchSuspend"
          >
            批量暂停
          </el-button>
          <el-button
            type="info"
            :loading="batchCompleting"
            @click="handleBatchComplete"
          >
            批量完成
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  Edit,
  Delete,
  CopyDocument,
  Check,
  Close,
  ArrowDown,
  VideoPause,
  VideoPlay,
  FirstAidKit,
  Warning,
  Timer,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import {
  medicalOrderApi,
  type MedicalOrder,
  type MedicalOrderQuery,
  ORDER_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  URGENCY_LABELS,
  PRIORITY_LABELS,
  getOrderTypeColor,
  getOrderStatusColor,
  getUrgencyColor,
  getPriorityColor
} from '@/api/medical-orders'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const batchExecuting = ref(false)
const batchSuspending = ref(false)
const batchCompleting = ref(false)
const orderList = ref<MedicalOrder[]>([])
const selectedOrders = ref<MedicalOrder[]>([])
const activeTab = ref('all')

// 表单引用
const searchFormRef = ref()

// 搜索表单
const searchForm = reactive({
  patientName: '',
  type: '',
  status: '',
  priority: '',
  dateRange: null as [string, string] | null
})

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

// 统计数据
const statistics = ref([
  { label: '总医嘱数', value: 0, icon: 'FirstAidKit', type: 'primary' },
  { label: '待执行', value: 0, icon: 'Timer', type: 'warning' },
  { label: '执行中', value: 0, icon: 'VideoPlay', type: 'success' },
  { label: '已完成', value: 0, icon: 'CircleCheck', type: 'info' }
])

// 订单数量统计
const orderCount = computed(() => {
  const counts = {
    all: orderList.value.length,
    pending: orderList.value.filter(order => order.status === 'PENDING').length,
    active: orderList.value.filter(order => order.status === 'ACTIVE').length,
    urgent: orderList.value.filter(order => order.urgency === 'STAT' || order.priority === 'URGENT').length
  }
  return counts
})

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 加载医嘱列表
const loadOrders = async () => {
  try {
    loading.value = true
    const query: MedicalOrderQuery = {
      page: pagination.current,
      pageSize: pagination.pageSize
    }

    if (searchForm.patientName) {
      query.patientName = searchForm.patientName
    }
    if (searchForm.type) {
      query.type = searchForm.type
    }
    if (searchForm.status) {
      query.status = searchForm.status
    }
    if (searchForm.priority) {
      query.priority = searchForm.priority
    }
    if (searchForm.dateRange) {
      query.startDate = searchForm.dateRange[0]
      query.endDate = searchForm.dateRange[1]
    }

    // 根据activeTab过滤状态
    if (activeTab.value === 'pending') {
      query.status = 'PENDING'
    } else if (activeTab.value === 'active') {
      query.status = 'ACTIVE'
    } else if (activeTab.value === 'urgent') {
      query.urgency = 'STAT'
    }

    const response = await medicalOrderApi.getMedicalOrders(query)
    orderList.value = response.list
    pagination.total = response.total

    // 更新统计数据
    updateStatistics()
  } catch (error) {
    console.error('加载医嘱列表失败:', error)
    ElMessage.error('加载医嘱列表失败')
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStatistics = async () => {
  try {
    const statsResponse = await medicalOrderApi.getMedicalOrderStatistics()
    const stats = statsResponse.data

    statistics.value = [
      { label: '总医嘱数', value: stats.total, icon: 'FirstAidKit', type: 'primary' },
      { label: '待执行', value: stats.pending, icon: 'Timer', type: 'warning' },
      { label: '执行中', value: stats.active, icon: 'VideoPlay', type: 'success' },
      { label: '已完成', value: stats.completed, icon: 'CircleCheck', type: 'info' }
    ]
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadOrders()
}

// 重置搜索
const handleReset = () => {
  searchForm.patientName = ''
  searchForm.type = ''
  searchForm.status = ''
  searchForm.priority = ''
  searchForm.dateRange = null
  pagination.current = 1
  loadOrders()
}

// 刷新
const handleRefresh = () => {
  loadOrders()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.current = 1
  loadOrders()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  loadOrders()
}

// 选择变化
const handleSelectionChange = (selection: MedicalOrder[]) => {
  selectedOrders.value = selection
}

// 权限检查函数
const canManageOrder = (order: MedicalOrder) => {
  return ['PENDING', 'ACTIVE'].includes(order.status)
}

const canEditOrder = (order: MedicalOrder) => {
  return order.status === 'PENDING'
}

const canSuspendOrder = (order: MedicalOrder) => {
  return order.status === 'ACTIVE'
}

const canResumeOrder = (order: MedicalOrder) => {
  return order.status === 'SUSPENDED'
}

const canCompleteOrder = (order: MedicalOrder) => {
  return ['ACTIVE', 'SUSPENDED'].includes(order.status)
}

const canCancelOrder = (order: MedicalOrder) => {
  return ['PENDING', 'ACTIVE', 'SUSPENDED'].includes(order.status)
}

const canDeleteOrder = (order: MedicalOrder) => {
  return order.status === 'PENDING'
}

// 操作函数
const handleCreate = () => {
  router.push('/medical-orders/create')
}

const handleViewDetail = (order: MedicalOrder) => {
  router.push(`/medical-orders/${order.id}`)
}

const handleExecute = (order: MedicalOrder) => {
  router.push(`/medical-orders/${order.id}/execute`)
}

const handleMoreCommand = async (command: string, order: MedicalOrder) => {
  switch (command) {
    case 'edit':
      router.push(`/medical-orders/${order.id}/edit`)
      break
    case 'copy':
      await handleCopyOrder(order)
      break
    case 'suspend':
      await handleSuspendOrder(order)
      break
    case 'resume':
      await handleResumeOrder(order)
      break
    case 'complete':
      await handleCompleteOrder(order)
      break
    case 'cancel':
      await handleCancelOrder(order)
      break
    case 'delete':
      await handleDeleteOrder(order)
      break
  }
}

// 复制医嘱
const handleCopyOrder = async (order: MedicalOrder) => {
  try {
    const response = await medicalOrderApi.copyMedicalOrder(order.id)
    ElMessage.success('医嘱复制成功')
    router.push(`/medical-orders/${response.data.id}/edit`)
  } catch (error) {
    console.error('复制医嘱失败:', error)
    ElMessage.error('复制医嘱失败')
  }
}

// 暂停医嘱
const handleSuspendOrder = async (order: MedicalOrder) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入暂停原因：',
      '暂停医嘱',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value: string) => {
          if (!value || value.trim() === '') {
            return '请输入暂停原因'
          }
          return true
        }
      }
    )

    await medicalOrderApi.suspendMedicalOrder(order.id, reason)
    ElMessage.success('医嘱暂停成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('暂停医嘱失败:', error)
      ElMessage.error('暂停医嘱失败')
    }
  }
}

// 恢复医嘱
const handleResumeOrder = async (order: MedicalOrder) => {
  try {
    await ElMessageBox.confirm(
      '确定要恢复该医嘱吗？',
      '恢复医嘱',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await medicalOrderApi.resumeMedicalOrder(order.id)
    ElMessage.success('医嘱恢复成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复医嘱失败:', error)
      ElMessage.error('恢复医嘱失败')
    }
  }
}

// 完成医嘱
const handleCompleteOrder = async (order: MedicalOrder) => {
  try {
    await ElMessageBox.confirm(
      '确定要完成该医嘱吗？',
      '完成医嘱',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await medicalOrderApi.completeMedicalOrder(order.id)
    ElMessage.success('医嘱完成成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('完成医嘱失败:', error)
      ElMessage.error('完成医嘱失败')
    }
  }
}

// 取消医嘱
const handleCancelOrder = async (order: MedicalOrder) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入取消原因：',
      '取消医嘱',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value: string) => {
          if (!value || value.trim() === '') {
            return '请输入取消原因'
          }
          return true
        }
      }
    )

    await medicalOrderApi.cancelMedicalOrder(order.id, reason)
    ElMessage.success('医嘱取消成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消医嘱失败:', error)
      ElMessage.error('取消医嘱失败')
    }
  }
}

// 删除医嘱
const handleDeleteOrder = async (order: MedicalOrder) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该医嘱吗？此操作不可恢复。',
      '删除医嘱',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    await medicalOrderApi.deleteMedicalOrder(order.id)
    ElMessage.success('医嘱删除成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除医嘱失败:', error)
      ElMessage.error('删除医嘱失败')
    }
  }
}

// 批量操作
const handleBatchExecute = async () => {
  try {
    batchExecuting.value = true
    // 这里应该跳转到批量执行页面
    ElMessage.success('批量执行功能开发中...')
  } catch (error) {
    console.error('批量执行失败:', error)
    ElMessage.error('批量执行失败')
  } finally {
    batchExecuting.value = false
  }
}

const handleBatchSuspend = async () => {
  try {
    batchSuspending.value = true
    const { value: reason } = await ElMessageBox.prompt(
      '请输入批量暂停原因：',
      '批量暂停',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value: string) => {
          if (!value || value.trim() === '') {
            return '请输入暂停原因'
          }
          return true
        }
      }
    )

    // 执行批量暂停逻辑
    ElMessage.success('批量暂停功能开发中...')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量暂停失败:', error)
      ElMessage.error('批量暂停失败')
    }
  } finally {
    batchSuspending.value = false
  }
}

const handleBatchComplete = async () => {
  try {
    batchCompleting.value = true
    await ElMessageBox.confirm(
      '确定要完成选中的医嘱吗？',
      '批量完成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 执行批量完成逻辑
    ElMessage.success('批量完成功能开发中...')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量完成失败:', error)
      ElMessage.error('批量完成失败')
    }
  } finally {
    batchCompleting.value = false
  }
}

// 组件挂载
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.medical-order-container {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.statistics-cards {
  margin-top: 20px;
}

.stat-card {
  margin-bottom: 0;
}

.stat-card.primary {
  border-left: 4px solid #409eff;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.success {
  border-left: 4px solid #67c23a;
}

.stat-card.info {
  border-left: 4px solid #909399;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  color: #409eff;
  opacity: 0.8;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-card {
  margin-bottom: 24px;
}

.search-form {
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 12px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.order-detail {
  padding: 16px;
  background-color: #fafafa;
}

.patient-info {
  line-height: 1.2;
}

.patient-meta {
  font-size: 12px;
  color: #909399;
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
  flex-wrap: wrap;
}

:deep(.el-card__header) {
  background-color: #f5f7fa;
}

:deep(.el-table__expand-icon) {
  margin-right: 8px;
}
</style>