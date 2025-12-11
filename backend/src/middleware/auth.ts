import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError, ForbiddenError } from '@/utils/errors'
import { UserRole } from '@prisma/client'

// 扩展FastifyRequest类型
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: number
      username: string
      role: UserRole
      iat?: number
      exp?: number
    }
  }
}

// 认证中间件
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    throw new UnauthorizedError('无效的访问令牌')
  }
}

// 权限检查中间件工厂
export const requireRole = (roles: UserRole | UserRole[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('用户未认证')
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenError('权限不足')
    }
  }
}

// 常用权限检查中间件
export const requireAdmin = requireRole(UserRole.ADMIN)
export const requireDoctor = requireRole([UserRole.DOCTOR, UserRole.ADMIN])
export const requireNurse = requireRole([UserRole.NURSE, UserRole.ADMIN])
export const requireDoctorOrNurse = requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN])

// 资源所有者检查
export const requireOwnership = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId, role } = request.user!

  // 管理员可以访问所有资源
  if (role === UserRole.ADMIN) {
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
    role: UserRole.ADMIN
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