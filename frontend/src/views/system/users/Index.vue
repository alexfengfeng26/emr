<template>
  <div class="users-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>用户管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新增用户
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
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalUsers }}</div>
                <div class="stat-label">总用户数</div>
              </div>
              <el-icon class="stat-icon primary"><User /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.activeUsers }}</div>
                <div class="stat-label">活跃用户</div>
              </div>
              <el-icon class="stat-icon success"><CircleCheck /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.suspendedUsers }}</div>
                <div class="stat-label">挂起用户</div>
              </div>
              <el-icon class="stat-icon warning"><Warning /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.inactiveUsers }}</div>
                <div class="stat-label">禁用用户</div>
              </div>
              <el-icon class="stat-icon danger"><CircleClose /></el-icon>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索筛选区域 -->
      <div class="search-section">
        <el-form :model="searchForm" inline class="search-form">
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="用户名/姓名/邮箱"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="科室">
            <el-select
              v-model="searchForm.departmentId"
              placeholder="请选择科室"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="dept in departments"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="(label, value) in USER_STATUS_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="职位">
            <el-input
              v-model="searchForm.position"
              placeholder="请输入职位"
              clearable
              style="width: 150px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 240px"
              @change="handleSearch"
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
      </div>

      <!-- 用户列表表格 -->
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="userId" label="用户编号" width="140" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="department.name" label="所属科室" width="120">
          <template #default="{ row }">
            {{ row.department?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="title" label="职称" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getUserStatusColor(row.status)" size="small">
              {{ USER_STATUS_LABELS[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="150">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles.slice(0, 2)"
              :key="role.id"
              size="small"
              class="mr-1"
            >
              {{ role.name }}
            </el-tag>
            <el-tooltip
              v-if="row.roles.length > 2"
              :content="row.roles.slice(2).map(r => r.name).join(', ')"
              placement="top"
            >
              <el-tag size="small">+{{ row.roles.length - 2 }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.lastLoginAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button type="warning" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleMoreAction(command, row)">
              <el-button type="info" link size="small">
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="reset-password">
                    <el-icon><Key /></el-icon>
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="row.status === 'ACTIVE' ? 'disable' : 'enable'"
                    divided
                  >
                    <el-icon v-if="row.status === 'ACTIVE'"><CircleClose /></el-icon>
                    <el-icon v-else><CircleCheck /></el-icon>
                    {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
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
          <template #header>
            <span>批量操作 (已选择 {{ selectedRows.length }} 项)</span>
          </template>
          <div class="batch-buttons">
            <el-button type="success" @click="handleBatchEnable">
              批量启用
            </el-button>
            <el-button type="warning" @click="handleBatchDisable">
              批量禁用
            </el-button>
            <el-button type="danger" @click="handleBatchDelete">
              批量删除
            </el-button>
            <el-button @click="handleClearSelection">
              清除选择
            </el-button>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="800px"
      :before-close="handleCloseDetailDialog"
    >
      <div v-if="currentUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户编号">{{ currentUser.userId }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ currentUser.realName }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentUser.email }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="所属科室">
            {{ currentUser.department?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="职位">{{ currentUser.position }}</el-descriptions-item>
          <el-descriptions-item label="职称">{{ currentUser.title }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getUserStatusColor(currentUser.status)">
              {{ USER_STATUS_LABELS[currentUser.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag
              v-for="role in currentUser.roles"
              :key="role.id"
              size="small"
              class="mr-1"
            >
              {{ role.name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后登录时间">
            {{ formatDateTime(currentUser.lastLoginAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录IP">
            {{ currentUser.lastLoginIp || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(currentUser.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置密码"
      width="500px"
      :before-close="handleCloseResetPasswordDialog"
    >
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="resetPasswordForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmResetPassword" :loading="resetPasswordLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  View,
  Edit,
  Delete,
  ArrowDown,
  User,
  CircleCheck,
  CircleClose,
  Warning,
  Key
} from '@element-plus/icons-vue'
import type {
  User as UserType,
  UserQuery,
  UserListResponse,
  Department
} from '@/types/system'
import { systemApi } from '@/api/system'
import {
  USER_STATUS_LABELS,
  getUserStatusColor
} from '@/types/system'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const userList = ref<UserType[]>([])
const selectedRows = ref<UserType[]>([])
const departments = ref<Department[]>([])

// 统计数据
const statistics = reactive({
  totalUsers: 0,
  activeUsers: 0,
  suspendedUsers: 0,
  inactiveUsers: 0
})

// 搜索表单
const searchForm = reactive<UserQuery>({
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

// 对话框状态
const detailDialogVisible = ref(false)
const resetPasswordDialogVisible = ref(false)
const currentUser = ref<UserType | null>(null)
const resetPasswordLoading = ref(false)

// 表单引用
const resetPasswordFormRef = ref<InstanceType<typeof ElForm>>()

// 重置密码表单
const resetPasswordForm = reactive({
  password: '',
  confirmPassword: ''
})

// 重置密码表单验证规则
const resetPasswordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    searchForm.page = pagination.page
    searchForm.pageSize = pagination.pageSize

    const response = await systemApi.getUsers(searchForm)
    userList.value = response.data.items
    pagination.total = response.data.total

    // 更新统计信息
    statistics.totalUsers = pagination.total
    statistics.activeUsers = userList.value.filter(u => u.status === 'ACTIVE').length
    statistics.suspendedUsers = userList.value.filter(u => u.status === 'SUSPENDED').length
    statistics.inactiveUsers = userList.value.filter(u => u.status === 'INACTIVE').length
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 获取科室列表
const fetchDepartments = async () => {
  try {
    const response = await systemApi.getDepartments()
    departments.value = response.data.items
  } catch (error) {
    console.error('获取科室列表失败:', error)
  }
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    page: 1,
    pageSize: 20,
    keyword: '',
    departmentId: '',
    status: '',
    position: '',
    dateRange: [],
    orderBy: 'createdAt',
    orderDirection: 'desc'
  })
  fetchUsers()
}

// 刷新
const handleRefresh = () => {
  fetchUsers()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchUsers()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchUsers()
}

// 选择变化
const handleSelectionChange = (selection: UserType[]) => {
  selectedRows.value = selection
}

// 清除选择
const handleClearSelection = () => {
  selectedRows.value = []
}

// 创建用户
const handleCreate = () => {
  router.push('/system/users/create')
}

// 查看用户详情
const handleView = (row: UserType) => {
  currentUser.value = row
  detailDialogVisible.value = true
}

// 编辑用户
const handleEdit = (row: UserType) => {
  router.push(`/system/users/${row.id}/edit`)
}

// 更多操作
const handleMoreAction = async (command: string, row: UserType) => {
  switch (command) {
    case 'reset-password':
      await handleResetPassword(row)
      break
    case 'enable':
      await handleToggleUserStatus(row, 'ACTIVE')
      break
    case 'disable':
      await handleToggleUserStatus(row, 'INACTIVE')
      break
    case 'delete':
      await handleDelete(row)
      break
  }
}

// 重置密码
const handleResetPassword = (row: UserType) => {
  currentUser.value = row
  resetPasswordForm.password = ''
  resetPasswordForm.confirmPassword = ''
  resetPasswordDialogVisible.value = true
}

// 确认重置密码
const handleConfirmResetPassword = async () => {
  if (!resetPasswordFormRef.value || !currentUser.value) return

  try {
    await resetPasswordFormRef.value.validate()
    resetPasswordLoading.value = true

    await systemApi.resetUserPassword(currentUser.value.id, resetPasswordForm.password)
    ElMessage.success('密码重置成功')
    resetPasswordDialogVisible.value = false
  } catch (error) {
    ElMessage.error('密码重置失败')
  } finally {
    resetPasswordLoading.value = false
  }
}

// 切换用户状态
const handleToggleUserStatus = async (row: UserType, status: 'ACTIVE' | 'INACTIVE') => {
  try {
    const statusText = status === 'ACTIVE' ? '启用' : '禁用'
    await ElMessageBox.confirm(
      `确定要${statusText}用户"${row.realName}"吗？`,
      `确认${statusText}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: status === 'ACTIVE' ? 'success' : 'warning'
      }
    )

    await systemApi.toggleUserStatus(row.id, status)
    ElMessage.success(`${statusText}成功`)
    fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 删除用户
const handleDelete = async (row: UserType) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户"${row.realName}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    await systemApi.deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量启用
const handleBatchEnable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要启用的用户')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要启用选中的 ${selectedRows.value.length} 个用户吗？`,
      '确认批量启用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    )

    const ids = selectedRows.value.map(row => row.id)
    await systemApi.batchUpdateUserStatus(ids, 'ACTIVE')
    ElMessage.success('批量启用成功')
    fetchUsers()
    handleClearSelection()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量启用失败')
    }
  }
}

// 批量禁用
const handleBatchDisable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要禁用的用户')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要禁用选中的 ${selectedRows.value.length} 个用户吗？`,
      '确认批量禁用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedRows.value.map(row => row.id)
    await systemApi.batchUpdateUserStatus(ids, 'INACTIVE')
    ElMessage.success('批量禁用成功')
    fetchUsers()
    handleClearSelection()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量禁用失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的用户')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个用户吗？此操作不可恢复。`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const ids = selectedRows.value.map(row => row.id)
    await systemApi.batchDeleteUsers(ids)
    ElMessage.success('批量删除成功')
    fetchUsers()
    handleClearSelection()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 关闭详情对话框
const handleCloseDetailDialog = () => {
  detailDialogVisible.value = false
  currentUser.value = null
}

// 关闭重置密码对话框
const handleCloseResetPasswordDialog = () => {
  resetPasswordDialogVisible.value = false
  currentUser.value = null
  resetPasswordForm.password = ''
  resetPasswordForm.confirmPassword = ''
}

// 初始化
onMounted(() => {
  fetchUsers()
  fetchDepartments()
})
</script>

<style scoped>
.users-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
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
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
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

.user-detail {
  padding: 20px 0;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
}

.batch-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.mr-1 {
  margin-right: 4px;
}

:deep(.el-card__header) {
  background-color: #f5f7fa;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>