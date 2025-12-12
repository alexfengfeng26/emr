import request from '@/utils/request'
import type {
  User,
  UserCreateForm,
  UserUpdateForm,
  UserQuery,
  UserListResponse,
  Role,
  RoleCreateForm,
  RoleUpdateForm,
  RoleQuery,
  RoleListResponse,
  Permission,
  Department,
  DepartmentCreateForm,
  DepartmentUpdateForm,
  DepartmentQuery,
  DepartmentListResponse,
  SystemSetting,
  SettingCreateForm,
  SettingUpdateForm,
  SettingQuery,
  SettingListResponse,
  SettingCategory,
  OperationLog,
  OperationLogQuery,
  OperationLogListResponse
} from '@/types/system'

export const systemApi = {
  // ==================== 用户管理 ====================

  // 获取用户列表
  getUsers: (query?: UserQuery) => {
    return request.get<UserListResponse>('/system/users', { params: query })
  },

  // 获取用户详情
  getUserById: (id: number) => {
    return request.get<User>(`/system/users/${id}`)
  },

  // 创建用户
  createUser: (data: UserCreateForm) => {
    return request.post<User>('/system/users', data)
  },

  // 更新用户信息
  updateUser: (id: number, data: UserUpdateForm) => {
    return request.put<User>(`/system/users/${id}`, data)
  },

  // 删除用户
  deleteUser: (id: number) => {
    return request.delete(`/system/users/${id}`)
  },

  // 重置用户密码
  resetUserPassword: (id: number, newPassword: string) => {
    return request.post(`/system/users/${id}/reset-password`, { newPassword })
  },

  // 启用/禁用用户
  toggleUserStatus: (id: number, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    return request.patch(`/system/users/${id}/status`, { status })
  },

  // 批量删除用户
  batchDeleteUsers: (ids: number[]) => {
    return request.post('/system/users/batch-delete', { ids })
  },

  // 批量更新用户状态
  batchUpdateUserStatus: (ids: number[], status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    return request.post('/system/users/batch-status', { ids, status })
  },

  // 搜索用户
  searchUsers: (keyword: string, limit?: number) => {
    return request.get<User[]>('/system/users/search', {
      params: { keyword, limit: limit || 20 }
    })
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    return request.get<User>('/system/users/current')
  },

  // 更新当前用户信息
  updateCurrentUser: (data: Partial<UserUpdateForm>) => {
    return request.put<User>('/system/users/current', data)
  },

  // 修改当前用户密码
  changePassword: (oldPassword: string, newPassword: string) => {
    return request.post('/system/users/change-password', {
      oldPassword,
      newPassword
    })
  },

  // ==================== 角色管理 ====================

  // 获取角色列表
  getRoles: (query?: RoleQuery) => {
    return request.get<RoleListResponse>('/system/roles', { params: query })
  },

  // 获取角色详情
  getRoleById: (id: number) => {
    return request.get<Role>(`/system/roles/${id}`)
  },

  // 创建角色
  createRole: (data: RoleCreateForm) => {
    return request.post<Role>('/system/roles', data)
  },

  // 更新角色信息
  updateRole: (id: number, data: RoleUpdateForm) => {
    return request.put<Role>(`/system/roles/${id}`, data)
  },

  // 删除角色
  deleteRole: (id: number) => {
    return request.delete(`/system/roles/${id}`)
  },

  // 获取角色的用户列表
  getRoleUsers: (roleId: number, query?: { page?: number; pageSize?: number }) => {
    return request.get<UserListResponse>(`/system/roles/${roleId}/users`, { params: query })
  },

  // 为角色分配用户
  assignUsersToRole: (roleId: number, userIds: number[]) => {
    return request.post(`/system/roles/${roleId}/assign-users`, { userIds })
  },

  // 从角色移除用户
  removeUsersFromRole: (roleId: number, userIds: number[]) => {
    return request.post(`/system/roles/${roleId}/remove-users`, { userIds })
  },

  // 复制角色
  copyRole: (id: number, name: string) => {
    return request.post<Role>(`/system/roles/${id}/copy`, { name })
  },

  // 搜索角色
  searchRoles: (keyword: string, limit?: number) => {
    return request.get<Role[]>('/system/roles/search', {
      params: { keyword, limit: limit || 20 }
    })
  },

  // ==================== 权限管理 ====================

  // 获取权限列表
  getPermissions: () => {
    return request.get<Permission[]>('/system/permissions')
  },

  // 获取权限树结构
  getPermissionTree: () => {
    return request.get<Permission[]>('/system/permissions/tree')
  },

  // 获取用户权限
  getUserPermissions: (userId: number) => {
    return request.get<Permission[]>(`/system/users/${userId}/permissions`)
  },

  // 获取角色权限
  getRolePermissions: (roleId: number) => {
    return request.get<Permission[]>(`/system/roles/${roleId}/permissions`)
  },

  // 检查用户权限
  checkUserPermission: (userId: number, permission: string) => {
    return request.get<boolean>(`/system/users/${userId}/check-permission`, {
      params: { permission }
    })
  },

  // ==================== 科室管理 ====================

  // 获取科室列表
  getDepartments: (query?: DepartmentQuery) => {
    return request.get<DepartmentListResponse>('/system/departments', { params: query })
  },

  // 获取科室详情
  getDepartmentById: (id: number) => {
    return request.get<Department>(`/system/departments/${id}`)
  },

  // 创建科室
  createDepartment: (data: DepartmentCreateForm) => {
    return request.post<Department>('/system/departments', data)
  },

  // 更新科室信息
  updateDepartment: (id: number, data: DepartmentUpdateForm) => {
    return request.put<Department>(`/system/departments/${id}`, data)
  },

  // 删除科室
  deleteDepartment: (id: number) => {
    return request.delete(`/system/departments/${id}`)
  },

  // 获取科室树结构
  getDepartmentTree: () => {
    return request.get<Department[]>('/system/departments/tree')
  },

  // 获取科室用户列表
  getDepartmentUsers: (departmentId: number, query?: { page?: number; pageSize?: number }) => {
    return request.get<UserListResponse>(`/system/departments/${departmentId}/users`, { params: query })
  },

  // 为科室分配用户
  assignUsersToDepartment: (departmentId: number, userIds: number[]) => {
    return request.post(`/system/departments/${departmentId}/assign-users`, { userIds })
  },

  // 从科室移除用户
  removeUsersFromDepartment: (departmentId: number, userIds: number[]) => {
    return request.post(`/system/departments/${departmentId}/remove-users`, { userIds })
  },

  // 搜索科室
  searchDepartments: (keyword: string, limit?: number) => {
    return request.get<Department[]>('/system/departments/search', {
      params: { keyword, limit: limit || 20 }
    })
  },

  // 获取科室统计信息
  getDepartmentStatistics: () => {
    return request.get('/system/departments/statistics')
  },

  // ==================== 系统设置 ====================

  // 获取系统设置列表
  getSettings: (query?: SettingQuery) => {
    return request.get<SettingListResponse>('/system/settings', { params: query })
  },

  // 获取系统设置详情
  getSettingByKey: (key: string) => {
    return request.get<SystemSetting>(`/system/settings/${key}`)
  },

  // 创建系统设置
  createSetting: (data: SettingCreateForm) => {
    return request.post<SystemSetting>('/system/settings', data)
  },

  // 更新系统设置
  updateSetting: (key: string, data: SettingUpdateForm) => {
    return request.put<SystemSetting>(`/system/settings/${key}`, data)
  },

  // 删除系统设置
  deleteSetting: (key: string) => {
    return request.delete(`/system/settings/${key}`)
  },

  // 批量更新系统设置
  batchUpdateSettings: (settings: { key: string; value: string }[]) => {
    return request.post('/system/settings/batch-update', { settings })
  },

  // 获取系统设置分类
  getSettingCategories: () => {
    return request.get<SettingCategory[]>('/system/settings/categories')
  },

  // 获取公开的系统设置
  getPublicSettings: () => {
    return request.get<Partial<SystemSetting>[]>('/system/settings/public')
  },

  // 搜索系统设置
  searchSettings: (keyword: string, limit?: number) => {
    return request.get<SystemSetting[]>('/system/settings/search', {
      params: { keyword, limit: limit || 20 }
    })
  },

  // 导出系统设置
  exportSettings: (category?: string) => {
    return request.get('/system/settings/export', {
      params: { category },
      responseType: 'blob'
    })
  },

  // 导入系统设置
  importSettings: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/system/settings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // ==================== 操作日志 ====================

  // 获取操作日志列表
  getOperationLogs: (query?: OperationLogQuery) => {
    return request.get<OperationLogListResponse>('/system/operation-logs', { params: query })
  },

  // 获取操作日志详情
  getOperationLogById: (id: number) => {
    return request.get<OperationLog>(`/system/operation-logs/${id}`)
  },

  // 导出操作日志
  exportOperationLogs: (query?: OperationLogQuery) => {
    return request.get('/system/operation-logs/export', {
      params: query,
      responseType: 'blob'
    })
  },

  // 清理操作日志
  cleanupOperationLogs: (days: number) => {
    return request.delete('/system/operation-logs/cleanup', {
      params: { days }
    })
  },

  // 获取操作日志统计
  getOperationLogStatistics: () => {
    return request.get('/system/operation-logs/statistics')
  }
}

// 导出所有API
export default systemApi