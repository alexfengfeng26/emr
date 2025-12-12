import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError, ForbiddenError } from '@/utils/errors'

// 用户信息接口
interface UserInfo {
  userId: number
  username: string
  realName: string
  roles: string[]
  permissions: string[]
  iat?: number
  exp?: number
}

// 扩展FastifyRequest类型
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserInfo
  }
}

// 认证中间件
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    console.log('开始JWT验证，Authorization header:', request.headers.authorization)
    const decoded = await request.jwtVerify()
    console.log('JWT解码结果:', decoded)

    // 确保用户信息包含必要的字段
    const userInfo: UserInfo = {
      userId: decoded.userId || 0,
      username: decoded.username || '',
      realName: decoded.realName || decoded.username || '',
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
      iat: decoded.iat,
      exp: decoded.exp
    }

    // 手动设置用户信息到request.user
    request.user = userInfo
    console.log('设置后的用户信息:', request.user)
  } catch (err) {
    console.error('JWT验证失败:', err)
    throw new UnauthorizedError('无效的访问令牌')
  }
}

// 权限检查中间件工厂
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('用户未认证')
    }

    // 检查用户角色是否存在
    if (!request.user.roles || !Array.isArray(request.user.roles)) {
      console.error('用户角色信息无效:', request.user)
      throw new ForbiddenError('用户角色信息无效')
    }

    const hasRole = request.user.roles.some(role => allowedRoles.includes(role))
    if (!hasRole) {
      console.error('角色检查失败:', {
        userRoles: request.user.roles,
        allowedRoles,
        userId: request.user.userId
      })
      throw new ForbiddenError('权限不足')
    }
  }
}

// 权限检查中间件工厂
export const requirePermission = (permissions: string | string[]) => {
  const allowedPermissions = Array.isArray(permissions) ? permissions : [permissions]

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('用户未认证')
    }

    // 检查用户权限是否存在
    if (!request.user.permissions || !Array.isArray(request.user.permissions)) {
      console.error('用户权限信息无效:', request.user)
      throw new ForbiddenError('用户权限信息无效')
    }

    const hasPermission = request.user.permissions.some(permission =>
      allowedPermissions.includes(permission)
    )
    if (!hasPermission) {
      console.error('权限检查失败:', {
        userPermissions: request.user.permissions,
        allowedPermissions,
        userId: request.user.userId
      })
      throw new ForbiddenError('权限不足')
    }
  }
}

// 常用权限检查中间件
export const requireAdmin = requireRole('ADMIN')
export const requireDoctor = requireRole(['DOCTOR', 'ADMIN'])
export const requireNurse = requireRole(['NURSE', 'ADMIN'])
export const requireDoctorOrNurse = requireRole(['DOCTOR', 'NURSE', 'ADMIN'])

// 资源所有者检查
export const requireOwnership = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId, roles } = request.user!

  // 管理员可以访问所有资源
  if (roles.includes('ADMIN')) {
    return
  }

  const resourceId = (request.params as any)?.id
  if (!resourceId) {
    throw new UnauthorizedError('资源ID不能为空')
  }

  // 这里可以添加具体的所有权检查逻辑
  // 例如检查资源是否属于当前用户
}

// API密钥认证（用于HIS系统集成）
export const authenticateApiKey = async (request: FastifyRequest, reply: FastifyReply) => {
  const apiKey = request.headers['x-api-key'] as string

  if (!apiKey) {
    throw new UnauthorizedError('缺少API密钥')
  }

  // 这里应该从数据库验证API密钥
  // 暂时使用环境变量
  const validApiKey = process.env.HIS_API_KEY

  if (apiKey !== validApiKey) {
    throw new UnauthorizedError('无效的API密钥')
  }

  // 设置系统用户信息
  request.user = {
    userId: 0, // 系统用户
    username: 'system',
    realName: '系统用户',
    roles: ['ADMIN'],
    permissions: []
  }
}

// 速率限制检查
export const checkRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const redis = request.server.redis

  if (!redis) {
    return // 如果没有Redis，跳过速率限制
  }

  const key = `rate_limit:${userId}`
  const window = 60 // 1分钟窗口
  const limit = 100 // 每分钟最多100次请求

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, window)
    }

    if (current > limit) {
      reply.code(429)
      throw new Error('请求过于频繁，请稍后再试')
    }

    // 设置响应头
    reply.header('X-RateLimit-Limit', limit)
    reply.header('X-RateLimit-Remaining', Math.max(0, limit - current))
    reply.header('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + window)
  } catch (error) {
    // Redis错误时不阻止请求
    console.error('Rate limit check failed:', error)
  }
}