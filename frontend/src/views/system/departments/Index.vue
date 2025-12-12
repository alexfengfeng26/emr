<template>
  <div class="departments-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>科室管理</h1>
        <p class="description">管理医院科室结构和人员分配</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增科室
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon primary">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.total }}</div>
            <div class="stat-label">总科室数</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon success">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.active }}</div>
            <div class="stat-label">启用科室</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon warning">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.totalUsers }}</div>
            <div class="stat-label">关联人员</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon info">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.totalBeds }}</div>
            <div class="stat-label">总床位数</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索和筛选 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索科室名称或代码"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="(label, value) in DEPARTMENT_TYPE_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.isActive"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
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
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <div class="table-header">
        <div class="header-left">
          <span class="title">科室列表</span>
          <span class="count">共 {{ pagination.total }} 条记录</span>
        </div>
        <div class="header-right">
          <el-button @click="handleExpandAll">
            <el-icon><ArrowDown /></el-icon>
            {{ expandAll ? '收起全部' : '展开全部' }}
          </el-button>
          <el-button v-if="selectedDepartments.length > 0" type="danger" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon>
            批量删除 ({{ selectedDepartments.length }})
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="departments"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="expandAll"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="科室名称" min-width="200">
          <template #default="{ row }">
            <div class="department-info">
              <div class="department-name">{{ row.name }}</div>
              <div class="department-code">{{ row.code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getDepartmentTypeColor(row.type)" size="small">
              {{ DEPARTMENT_TYPE_LABELS[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="leader.name" label="负责人" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.leader">{{ row.leader.name }}</span>
            <span v-else class="text-placeholder">未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="userCount" label="人员数量" width="100" align="center">
          <template #default="{ row }">
            <el-link
              v-if="row.userCount > 0"
              type="primary"
              @click="handleViewUsers(row)"
            >
              {{ row.userCount }}
            </el-link>
            <span v-else>{{ row.userCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="bedCount" label="床位数" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.bedCount">{{ row.bedCount }}</span>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="140" align="center">
          <template #default="{ row }">
            <span v-if="row.phone">{{ row.phone }}</span>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleViewUsers(row)"
            >
              人员
            </el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button type="primary" link>
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="add-child">
                    <el-icon><Plus /></el-icon>
                    添加子科室
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑科室
                  </el-dropdown-item>
                  <el-dropdown-item command="toggleStatus">
                    <el-icon>
                      <component :is="row.isActive ? 'Lock' : 'Unlock'" />
                    </el-icon>
                    {{ row.isActive ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除科室
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 用户列表弹窗 -->
    <el-dialog
      v-model="usersDialogVisible"
      :title="`${currentDepartment?.name} - 人员列表`"
      width="800px"
      destroy-on-close
    >
      <div class="users-list">
        <div v-if="departmentUsers.length === 0" class="empty-state">
          <el-empty description="暂无人员" />
        </div>
        <el-table v-else :data="departmentUsers" stripe>
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="realName" label="真实姓名" />
          <el-table-column prop="position" label="职位" />
          <el-table-column prop="title" label="职称" />
          <el-table-column prop="phone" label="手机号" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="getUserStatusColor(row.status)"
                size="small"
              >
                {{ USER_STATUS_LABELS[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="usersDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 科室表单弹窗 -->
    <DepartmentForm
      v-model:visible="formDialogVisible"
      :department="currentDepartment"
      :parent-department="parentDepartment"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  Delete,
  Edit,
  ArrowDown,
  Lock,
  Unlock,
  OfficeBuilding,
  CircleCheck,
  User,
  Monitor
} from '@element-plus/icons-vue'
import { systemApi } from '@/api/system'
import type { Department, DepartmentQuery } from '@/types/system'
import {
  DEPARTMENT_TYPE_LABELS,
  USER_STATUS_LABELS,
  getDepartmentTypeColor,
  getUserStatusColor
} from '@/types/system'
import DepartmentForm from './Form.vue'

// 响应式数据
const loading = ref(false)
const departments = ref<Department[]>([])
const selectedDepartments = ref<Department[]>([])
const statistics = reactive({
  total: 0,
  active: 0,
  totalUsers: 0,
  totalBeds: 0
})

// 查询参数
const queryParams = reactive<DepartmentQuery>({
  keyword: '',
  type: '',
  isActive: undefined,
  sortBy: 'sort',
  sortOrder: 'asc'
})

// 分页信息
const pagination = reactive({
  total: 0
})

// 弹窗状态
const formDialogVisible = ref(false)
const usersDialogVisible = ref(false)
const currentDepartment = ref<Department | null>(null)
const parentDepartment = ref<Department | null>(null)

// 展开状态
const expandAll = ref(false)

// 用户列表
const departmentUsers = ref<any[]>([])

// 计算属性
const activeCount = computed(() =>
  departments.value.filter(dept => dept.isActive).length
)

const totalUserCount = computed(() =>
  departments.value.reduce((sum, dept) => sum + dept.userCount, 0)
)

const totalBedCount = computed(() =>
  departments.value.reduce((sum, dept) => sum + (dept.bedCount || 0), 0)
)

// 获取科室列表
const fetchDepartments = async () => {
  loading.value = true
  try {
    const response = await systemApi.getDepartmentTree()
    departments.value = response.data

    // 更新统计数据
    statistics.total = departments.value.length
    statistics.active = activeCount.value
    statistics.totalUsers = totalUserCount.value
    statistics.totalBeds = totalBedCount.value
    pagination.total = departments.value.length
  } catch (error) {
    console.error('获取科室列表失败:', error)
    ElMessage.error('获取科室列表失败')
  } finally {
    loading.value = false
  }
}

// 获取科室用户列表
const fetchDepartmentUsers = async (departmentId: number) => {
  try {
    const response = await systemApi.getDepartmentUsers(departmentId)
    departmentUsers.value = response.data.items
  } catch (error) {
    console.error('获取科室用户列表失败:', error)
    ElMessage.error('获取科室用户列表失败')
  }
}

// 搜索
const handleSearch = () => {
  fetchDepartments()
}

// 重置搜索
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.type = ''
  queryParams.isActive = undefined
  fetchDepartments()
}

// 展开/收起全部
const handleExpandAll = () => {
  expandAll.value = !expandAll.value
  // 这里需要重新加载数据以应用展开状态
  fetchDepartments()
}

// 选择处理
const handleSelectionChange = (selection: Department[]) => {
  selectedDepartments.value = selection
}

// 新增科室
const handleAdd = () => {
  currentDepartment.value = null
  parentDepartment.value = null
  formDialogVisible.value = true
}

// 添加子科室
const handleAddChild = (department: Department) => {
  currentDepartment.value = null
  parentDepartment.value = department
  formDialogVisible.value = true
}

// 编辑科室
const handleEdit = (department: Department) => {
  currentDepartment.value = department
  parentDepartment.value = null
  formDialogVisible.value = true
}

// 切换科室状态
const handleToggleStatus = async (department: Department) => {
  const newStatus = !department.isActive
  const action = newStatus ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${action}科室 "${department.name}" 吗？`, `${action}科室`, {
      type: 'warning'
    })

    await systemApi.updateDepartment(department.id, { isActive: newStatus })
    ElMessage.success(`科室${action}成功`)
    fetchDepartments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}科室失败:`, error)
      ElMessage.error(`${action}科室失败`)
    }
  }
}

// 删除科室
const handleDelete = async (department: Department) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除科室 "${department.name}" 吗？此操作不可恢复。`,
      '删除科室',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await systemApi.deleteDepartment(department.id)
    ElMessage.success('科室删除成功')
    fetchDepartments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除科室失败:', error)
      ElMessage.error('删除科室失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedDepartments.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedDepartments.value.length} 个科室吗？此操作不可恢复。`,
      '批量删除科室',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        confirmButtonClass: 'el-button--danger'
      }
    )

    const deletePromises = selectedDepartments.value.map(dept =>
      systemApi.deleteDepartment(dept.id)
    )

    await Promise.all(deletePromises)
    ElMessage.success(`成功删除 ${deletePromises.length} 个科室`)
    fetchDepartments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除科室失败:', error)
      ElMessage.error('批量删除科室失败')
    }
  }
}

// 查看用户
const handleViewUsers = async (department: Department) => {
  currentDepartment.value = department
  usersDialogVisible.value = true
  await fetchDepartmentUsers(department.id)
}

// 命令处理
const handleCommand = (command: string, department: Department) => {
  switch (command) {
    case 'add-child':
      handleAddChild(department)
      break
    case 'edit':
      handleEdit(department)
      break
    case 'toggleStatus':
      handleToggleStatus(department)
      break
    case 'delete':
      handleDelete(department)
      break
  }
}

// 表单成功处理
const handleFormSuccess = () => {
  fetchDepartments()
}

// 初始化
onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.departments-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.primary {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stat-icon.info {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.search-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.search-form {
  margin: 0;
}

.table-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left .title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-left .count {
  color: #909399;
  font-size: 14px;
  margin-left: 8px;
}

.department-info {
  line-height: 1.4;
}

.department-name {
  font-weight: 500;
  color: #303133;
}

.department-code {
  font-size: 12px;
  color: #909399;
}

.text-placeholder {
  color: #c0c4cc;
}

.users-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

:deep(.el-table .el-table__row:hover > td) {
  background-color: #f5f7fa !important;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-table__row.el-table__row--level-1 .el-table__cell) {
  background-color: #fafafa;
}

:deep(.el-table__row.el-table__row--level-2 .el-table__cell) {
  background-color: #f5f5f5;
}
</style>