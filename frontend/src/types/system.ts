// 用户基础信息
export interface User {
  id: number
  userId: string // 用户编号，如 U20250111001
  username: string // 登录用户名
  password?: string // 密码（创建时使用，查询时不返回）
  realName: string // 真实姓名
  email: string // 邮箱
  phone: string // 手机号
  avatar?: string // 头像URL
  departmentId?: number // 所属科室ID
  department?: {
    id: number
    name: string
    code: string
  }
  position: string // 职位
  title: string // 职称
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' // 状态
  roles: Role[] // 用户角色
  permissions: string[] // 用户权限标识
  lastLoginAt?: string // 最后登录时间
  lastLoginIp?: string // 最后登录IP
  createdAt: string
  updatedAt: string
  createdBy?: number
  updatedBy?: number
}

// 用户创建表单
export interface UserCreateForm {
  username: string
  password: string
  realName: string
  email: string
  phone: string
  avatar?: string
  departmentId?: number
  position: string
  title: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  roleIds: number[]
}

// 用户更新表单
export interface UserUpdateForm {
  realName?: string
  email?: string
  phone?: string
  avatar?: string
  departmentId?: number
  position?: string
  title?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  roleIds?: number[]
}

// 用户查询参数
export interface UserQuery {
  page?: number
  pageSize?: number
  keyword?: string // 关键词搜索（用户名、真实姓名、邮箱）
  departmentId?: number
  status?: string
  roleId?: number
  position?: string
  createdAtStart?: string
  createdAtEnd?: string
  sortBy?: 'createdAt' | 'lastLoginAt' | 'username'
  sortOrder?: 'asc' | 'desc'
}

// 用户列表响应
export interface UserListResponse {
  items: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 角色基础信息
export interface Role {
  id: number
  name: string // 角色名称
  code: string // 角色代码
  description?: string // 角色描述
  permissions: Permission[] // 角色权限
  userCount: number // 使用该角色的用户数量
  status: 'ACTIVE' | 'INACTIVE' // 状态
  isSystem: boolean // 是否系统内置角色
  createdAt: string
  updatedAt: string
  createdBy?: number
  updatedBy?: number
}

// 权限基础信息
export interface Permission {
  id: number
  name: string // 权限名称
  code: string // 权限代码
  description?: string // 权限描述
  module: string // 所属模块
  type: 'MENU' | 'BUTTON' | 'API' // 权限类型
  parentId?: number // 父权限ID
  level: number // 权限层级
  sort: number // 排序
  icon?: string // 图标
  path?: string // 路由路径
  children?: Permission[] // 子权限
}

// 角色创建表单
export interface RoleCreateForm {
  name: string
  code: string
  description?: string
  permissionIds: number[]
  status: 'ACTIVE' | 'INACTIVE'
}

// 角色更新表单
export interface RoleUpdateForm {
  name?: string
  description?: string
  permissionIds?: number[]
  status?: 'ACTIVE' | 'INACTIVE'
}

// 角色查询参数
export interface RoleQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  isSystem?: boolean
  sortBy?: 'createdAt' | 'name' | 'userCount'
  sortOrder?: 'asc' | 'desc'
}

// 角色列表响应
export interface RoleListResponse {
  items: Role[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 科室基础信息
export interface Department {
  id: number
  name: string // 科室名称
  code: string // 科室代码
  description?: string // 科室描述
  type: 'CLINICAL' | 'MEDICAL_TECH' | 'NURSING' | 'ADMIN' | 'SUPPORT' // 科室类型
  parentId?: number // 父科室ID
  level: number // 科室层级
  sort: number // 排序
  leaderId?: number // 科室负责人ID
  leader?: {
    id: number
    name: string
    position: string
  }
  phone?: string // 科室电话
  location?: string // 科室位置
  bedCount?: number // 床位数量
  isActive: boolean // 是否启用
  userCount: number // 科室用户数量
  createdAt: string
  updatedAt: string
  createdBy?: number
  updatedBy?: number
}

// 科室创建表单
export interface DepartmentCreateForm {
  name: string
  code: string
  description?: string
  type: 'CLINICAL' | 'MEDICAL_TECH' | 'NURSING' | 'ADMIN' | 'SUPPORT'
  parentId?: number
  sort: number
  leaderId?: number
  phone?: string
  location?: string
  bedCount?: number
  isActive: boolean
}

// 科室更新表单
export interface DepartmentUpdateForm {
  name?: string
  description?: string
  type?: 'CLINICAL' | 'MEDICAL_TECH' | 'NURSING' | 'ADMIN' | 'SUPPORT'
  parentId?: number
  sort?: number
  leaderId?: number
  phone?: string
  location?: string
  bedCount?: number
  isActive?: boolean
}

// 科室查询参数
export interface DepartmentQuery {
  page?: number
  pageSize?: number
  keyword?: string
  type?: string
  parentId?: number
  isActive?: boolean
  sortBy?: 'createdAt' | 'name' | 'sort' | 'userCount'
  sortOrder?: 'asc' | 'desc'
}

// 科室列表响应
export interface DepartmentListResponse {
  items: Department[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 系统设置
export interface SystemSetting {
  id: number
  key: string // 设置键
  value: string // 设置值
  description?: string // 设置描述
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'TEXT' // 值类型
  category: string // 设置分类
  isPublic: boolean // 是否公开设置
  isEditable: boolean // 是否可编辑
  validation?: string // 验证规则
  sort: number // 排序
  createdAt: string
  updatedAt: string
  updatedBy?: number
}

// 系统设置分类
export interface SettingCategory {
  key: string
  name: string
  description?: string
  icon?: string
}

// 系统设置创建表单
export interface SettingCreateForm {
  key: string
  value: string
  description?: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'TEXT'
  category: string
  isPublic: boolean
  isEditable: boolean
  validation?: string
  sort: number
}

// 系统设置更新表单
export interface SettingUpdateForm {
  value: string
  description?: string
  isPublic?: boolean
  isEditable?: boolean
  validation?: string
  sort?: number
}

// 系统设置查询参数
export interface SettingQuery {
  page?: number
  pageSize?: number
  keyword?: string
  category?: string
  isPublic?: boolean
  isEditable?: boolean
  sortBy?: 'createdAt' | 'key' | 'category' | 'sort'
  sortOrder?: 'asc' | 'desc'
}

// 系统设置列表响应
export interface SettingListResponse {
  items: SystemSetting[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 用户状态标签映射
export const USER_STATUS_LABELS = {
  ACTIVE: '启用',
  INACTIVE: '禁用',
  SUSPENDED: '挂起'
} as const

// 角色状态标签映射
export const ROLE_STATUS_LABELS = {
  ACTIVE: '启用',
  INACTIVE: '禁用'
} as const

// 科室类型标签映射
export const DEPARTMENT_TYPE_LABELS = {
  CLINICAL: '临床科室',
  MEDICAL_TECH: '医技科室',
  NURSING: '护理科室',
  ADMIN: '行政部门',
  SUPPORT: '支持部门'
} as const

// 权限类型标签映射
export const PERMISSION_TYPE_LABELS = {
  MENU: '菜单权限',
  BUTTON: '按钮权限',
  API: 'API权限'
} as const

// 设置类型标签映射
export const SETTING_TYPE_LABELS = {
  STRING: '字符串',
  NUMBER: '数字',
  BOOLEAN: '布尔值',
  JSON: 'JSON对象',
  TEXT: '文本'
} as const

// 用户状态颜色映射
export const getUserStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'danger'
    case 'SUSPENDED':
      return 'warning'
    default:
      return 'info'
  }
}

// 角色状态颜色映射
export const getRoleStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'danger'
    default:
      return 'info'
  }
}

// 科室类型颜色映射
export const getDepartmentTypeColor = (type: string) => {
  switch (type) {
    case 'CLINICAL':
      return 'primary'
    case 'MEDICAL_TECH':
      return 'success'
    case 'NURSING':
      return 'warning'
    case 'ADMIN':
      return 'info'
    case 'SUPPORT':
      return ''
    default:
      return 'info'
  }
}

// 权限类型颜色映射
export const getPermissionTypeColor = (type: string) => {
  switch (type) {
    case 'MENU':
      return 'primary'
    case 'BUTTON':
      return 'success'
    case 'API':
      return 'warning'
    default:
      return 'info'
  }
}

// 操作日志
export interface OperationLog {
  id: number
  userId: number
  user?: {
    id: number
    username: string
    realName: string
  }
  module: string // 操作模块
  action: string // 操作动作
  description: string // 操作描述
  method: string // 请求方法
  url: string // 请求URL
  params?: Record<string, any> // 请求参数
  result: 'SUCCESS' | 'FAILURE' // 操作结果
  errorMessage?: string // 错误信息
  ipAddress: string // IP地址
  userAgent: string // 用户代理
  duration?: number // 执行时长（毫秒）
  createdAt: string
}

// 操作日志查询参数
export interface OperationLogQuery {
  page?: number
  pageSize?: number
  userId?: number
  module?: string
  action?: string
  result?: string
  ipAddress?: string
  createdAtStart?: string
  createdAtEnd?: string
  sortBy?: 'createdAt'
  sortOrder?: 'desc'
}

// 操作日志列表响应
export interface OperationLogListResponse {
  items: OperationLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 操作结果标签映射
export const OPERATION_RESULT_LABELS = {
  SUCCESS: '成功',
  FAILURE: '失败'
} as const

// 操作结果颜色映射
export const getOperationResultColor = (result: string) => {
  switch (result) {
    case 'SUCCESS':
      return 'success'
    case 'FAILURE':
      return 'danger'
    default:
      return 'info'
  }
}