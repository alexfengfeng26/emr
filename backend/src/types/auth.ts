import { z } from 'zod'
import { UserRole } from '@prisma/client'

// 登录请求schema
export const loginSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符'),
  password: z.string().min(6, '密码至少6个字符').max(100, '密码最多100个字符')
})

// 注册请求schema
export const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符'),
  password: z.string().min(6, '密码至少6个字符').max(100, '密码最多100个字符'),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名最多100个字符'),
  email: z.string().email('邮箱格式不正确').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  role: z.nativeEnum(UserRole).default('DOCTOR'),
  department: z.string().max(100, '部门名称最多100个字符').optional()
})

// 修改密码请求schema
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '原密码不能为空'),
  newPassword: z.string().min(6, '新密码至少6个字符').max(100, '新密码最多100个字符')
})

// 用户信息响应类型
export interface UserResponse {
  id: number
  username: string
  name: string
  email?: string
  phone?: string
  role: UserRole
  department?: string
  status: string
  createdAt: string
  updatedAt?: string
}

// 登录响应类型
export interface LoginResponse {
  token: string
  user: UserResponse
  expiresIn: string
}

// JWT载荷类型
export interface JWTPayload {
  userId: number
  username: string
  role: UserRole
  iat?: number
  exp?: number
}