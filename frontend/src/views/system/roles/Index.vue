<template>
  <div class="roles-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>角色管理</h1>
        <p class="description">管理系统角色和权限分配</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增角色
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon primary">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.total }}</div>
            <div class="stat-label">总角色数</div>
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
            <div class="stat-label">启用角色</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon warning">
            <el-icon><Setting /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.system }}</div>
            <div class="stat-label">系统角色</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon info">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.totalUsers }}</div>
            <div class="stat-label">关联用户</div>
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
            placeholder="搜索角色名称或代码"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" value="ACTIVE" />
            <el-option label="禁用" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.isSystem"
            placeholder="全部类型"
            clearable
            style="width: 120px"
          >
            <el-option label="系统角色" :value="true" />
            <el-option label="自定义角色" :value="false" />
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
          <span class="title">角色列表</span>
          <span class="count">共 {{ pagination.total }} 条记录</span>
        </div>
        <div class="header-right" v-if="selectedRoles.length > 0">
          <el-button type="danger" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon>
            批量删除 ({{ selectedRoles.length }})
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="roles"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="角色名称" min-width="150">
          <template #default="{ row }">
            <div class="role-info">
              <div class="role-name">{{ row.name }}</div>
              <div class="role-code">{{ row.code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="userCount" label="用户数量" width="100" align="center">
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
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getRoleStatusColor(row.status)"
              size="small"
            >
              {{ ROLE_STATUS_LABELS[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isSystem" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isSystem" type="warning" size="small">系统角色</el-tag>
            <el-tag v-else type="info" size="small">自定义</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleViewPermissions(row)"
            >
              权限
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleViewUsers(row)"
            >
              用户
            </el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button type="primary" link>
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit" :disabled="row.isSystem">
                    <el-icon><Edit /></el-icon>
                    编辑角色
                  </el-dropdown-item>
                  <el-dropdown-item command="copy">
                    <el-icon><CopyDocument /></el-icon>
                    复制角色
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="toggleStatus"
                    :disabled="row.isSystem"
                  >
                    <el-icon>
                      <component :is="row.status === 'ACTIVE' ? 'Lock' : 'Unlock'" />
                    </el-icon>
                    {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    :disabled="row.isSystem"
                    divided
                  >
                    <el-icon><Delete /></el-icon>
                    删除角色
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
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 用户列表弹窗 -->
    <el-dialog
      v-model="usersDialogVisible"
      :title="`${currentRole?.name} - 用户列表`"
      width="800px"
      destroy-on-close
    >
      <div class="users-list">
        <div v-if="roleUsers.length === 0" class="empty-state">
          <el-empty description="暂无用户" />
        </div>
        <el-table v-else :data="roleUsers" stripe>
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="realName" label="真实姓名" />
          <el-table-column prop="department.name" label="科室" />
          <el-table-column prop="position" label="职位" />
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

    <!-- 权限查看弹窗 -->
    <el-dialog
      v-model="permissionsDialogVisible"
      :title="`${currentRole?.name} - 权限列表`"
      width="600px"
      destroy-on-close
    >
      <div class="permissions-tree">
        <el-tree
          :data="permissionTree"
          :props="{ label: 'name', children: 'children' }"
          show-checkbox
          node-key="id"
          :default-checked-keys="selectedPermissionIds"
          :check-strictly="true"
          disabled
        >
          <template #default="{ node, data }">
            <div class="permission-node">
              <el-icon v-if="data.icon" class="node-icon">
                <component :is="data.icon" />
              </el-icon>
              <span class="node-name">{{ data.name }}</span>
              <el-tag size="small" type="info">
                {{ PERMISSION_TYPE_LABELS[data.type] }}
              </el-tag>
            </div>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="permissionsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 角色表单弹窗 -->
    <RoleForm
      v-model:visible="formDialogVisible"
      :role="currentRole"
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
  CopyDocument,
  Lock,
  Unlock,
  User,
  CircleCheck,
  Setting,
  UserFilled
} from '@element-plus/icons-vue'
import { systemApi } from '@/api/system'
import type { Role, RoleQuery } from '@/types/system'
import {
  ROLE_STATUS_LABELS,
  PERMISSION_TYPE_LABELS,
  USER_STATUS_LABELS,
  getRoleStatusColor,
  getUserStatusColor
} from '@/types/system'
import RoleForm from './Form.vue'
import { formatDate } from '@/utils/date'

// 响应式数据
const loading = ref(false)
const roles = ref<Role[]>([])
const selectedRoles = ref<Role[]>([])
const statistics = reactive({
  total: 0,
  active: 0,
  system: 0,
  totalUsers: 0
})

// 查询参数
const queryParams = reactive<RoleQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: '',
  isSystem: undefined,
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 弹窗状态
const formDialogVisible = ref(false)
const usersDialogVisible = ref(false)
const permissionsDialogVisible = ref(false)
const currentRole = ref<Role | null>(null)

// 用户列表
const roleUsers = ref<any[]>([])

// 权限树
const permissionTree = ref<any[]>([])
const selectedPermissionIds = ref<number[]>([])

// 计算属性
const activeCount = computed(() =>
  roles.value.filter(role => role.status === 'ACTIVE').length
)

const systemCount = computed(() =>
  roles.value.filter(role => role.isSystem).length
)

const totalUserCount = computed(() =>
  roles.value.reduce((sum, role) => sum + role.userCount, 0)
)

// 获取角色列表
const fetchRoles = async () => {
  loading.value = true
  try {
    const response = await systemApi.getRoles(queryParams)
    roles.value = response.data.items
    pagination.total = response.data.total
    pagination.page = response.data.page
    pagination.pageSize = response.data.pageSize

    // 更新统计数据
    statistics.total = response.data.total
    statistics.active = activeCount.value
    statistics.system = systemCount.value
    statistics.totalUsers = totalUserCount.value
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 获取权限树
const fetchPermissionTree = async () => {
  try {
    const response = await systemApi.getPermissionTree()
    permissionTree.value = response.data
  } catch (error) {
    console.error('获取权限树失败:', error)
  }
}

// 获取角色用户列表
const fetchRoleUsers = async (roleId: number) => {
  try {
    const response = await systemApi.getRoleUsers(roleId)
    roleUsers.value = response.data.items
  } catch (error) {
    console.error('获取角色用户列表失败:', error)
    ElMessage.error('获取角色用户列表失败')
  }
}

// 获取角色权限
const fetchRolePermissions = async (roleId: number) => {
  try {
    const response = await systemApi.getRolePermissions(roleId)
    selectedPermissionIds.value = response.data.map((p: any) => p.id)
  } catch (error) {
    console.error('获取角色权限失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  pagination.page = 1
  fetchRoles()
}

// 重置搜索
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.status = ''
  queryParams.isSystem = undefined
  handleSearch()
}

// 分页处理
const handlePageChange = (page: number) => {
  queryParams.page = page
  pagination.page = page
  fetchRoles()
}

const handlePageSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  pagination.pageSize = pageSize
  queryParams.page = 1
  pagination.page = 1
  fetchRoles()
}

// 选择处理
const handleSelectionChange = (selection: Role[]) => {
  selectedRoles.value = selection
}

// 新增角色
const handleAdd = () => {
  currentRole.value = null
  formDialogVisible.value = true
}

// 编辑角色
const handleEdit = (role: Role) => {
  currentRole.value = role
  formDialogVisible.value = true
}

// 复制角色
const handleCopy = async (role: Role) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新角色名称',
      '复制角色',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: `${role.name}_副本`
      }
    )

    if (newName) {
      await systemApi.copyRole(role.id, newName)
      ElMessage.success('角色复制成功')
      fetchRoles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('复制角色失败:', error)
      ElMessage.error('复制角色失败')
    }
  }
}

// 切换角色状态
const handleToggleStatus = async (role: Role) => {
  const newStatus = role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  const action = newStatus === 'ACTIVE' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${action}角色 "${role.name}" 吗？`, `${action}角色`, {
      type: 'warning'
    })

    await systemApi.updateRole(role.id, { status: newStatus })
    ElMessage.success(`角色${action}成功`)
    fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${action}角色失败:`, error)
      ElMessage.error(`${action}角色失败`)
    }
  }
}

// 删除角色
const handleDelete = async (role: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？此操作不可恢复。`,
      '删除角色',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await systemApi.deleteRole(role.id)
    ElMessage.success('角色删除成功')
    fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除角色失败:', error)
      ElMessage.error('删除角色失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRoles.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRoles.value.length} 个角色吗？此操作不可恢复。`,
      '批量删除角色',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        confirmButtonClass: 'el-button--danger'
      }
    )

    const deletePromises = selectedRoles.value
      .filter(role => !role.isSystem)
      .map(role => systemApi.deleteRole(role.id))

    await Promise.all(deletePromises)
    ElMessage.success(`成功删除 ${deletePromises.length} 个角色`)
    fetchRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除角色失败:', error)
      ElMessage.error('批量删除角色失败')
    }
  }
}

// 查看用户
const handleViewUsers = async (role: Role) => {
  currentRole.value = role
  usersDialogVisible.value = true
  await fetchRoleUsers(role.id)
}

// 查看权限
const handleViewPermissions = async (role: Role) => {
  currentRole.value = role
  permissionsDialogVisible.value = true
  await fetchPermissionTree()
  await fetchRolePermissions(role.id)
}

// 命令处理
const handleCommand = (command: string, role: Role) => {
  switch (command) {
    case 'edit':
      handleEdit(role)
      break
    case 'copy':
      handleCopy(role)
      break
    case 'toggleStatus':
      handleToggleStatus(role)
      break
    case 'delete':
      handleDelete(role)
      break
  }
}

// 表单成功处理
const handleFormSuccess = () => {
  fetchRoles()
}

// 初始化
onMounted(() => {
  fetchRoles()
  fetchPermissionTree()
})
</script>

<style scoped>
.roles-container {
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

.role-info {
  line-height: 1.4;
}

.role-name {
  font-weight: 500;
  color: #303133;
}

.role-code {
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.users-list {
  max-height: 400px;
  overflow-y: auto;
}

.permissions-tree {
  max-height: 400px;
  overflow-y: auto;
}

.permission-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  color: #409eff;
}

.node-name {
  flex: 1;
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

:deep(.el-dropdown-menu__item.is-disabled) {
  color: #c0c4cc;
}
</style>