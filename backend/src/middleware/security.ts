import { FastifyRequest, FastifyReply } from 'fastify'
import { EncryptionService } from '@/services/encryption.service'
import { logAudit } from '@/utils/logger'
import { config } from '@/config'
import { ForbiddenError, UnauthorizedError } from './error-handler'

// 数据脱敏中间件
export const dataMasking = async (request: FastifyRequest, reply: FastifyReply) => {
  const originalJson = reply.serialize

  // 重写序列化方法
  reply.serialize = (payload: any) => {
    try {
      if (payload && typeof payload === 'object') {
        payload = maskSensitiveData(payload)
      }
      return originalJson.call(reply, payload)
    } catch (error) {
      return originalJson.call(reply, payload)
    }
  }

  return payload
}

// 脱敏敏感数据
function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item))
  }

  const maskedObj = { ...obj }

  // 脱敏常见敏感字段
  const sensitiveFields = [
    'idCard',
    'phone',
    'email',
    'password',
    'idCard',
    'socialSecurityNumber',
    'bankAccount'
  ]

  for (const field of sensitiveFields) {
    if (maskedObj[field]) {
      if (typeof maskedObj[field] === 'string') {
        switch (field) {
          case 'idCard':
            maskedObj[field] = EncryptionService.maskSensitiveData(maskedObj[field], 'idCard')
            break
          case 'phone':
            maskedObj[field] = EncryptionService.maskSensitiveData(maskedObj[field], 'phone')
            break
          case 'email':
            maskedObj[field] = EncryptionService.maskSensitiveData(maskedObj[field], 'email')
            break
          case 'password':
            maskedObj[field] = '******'
            break
          case 'name':
            maskedObj[field] = EncryptionService.maskSensitiveData(maskedObj[field], 'name')
            break
          default:
            maskedObj[field] = '******'
        }
      }
    }
  }

  // 递归处理嵌套对象
  for (const key in maskedObj) {
    if (typeof maskedObj[key] === 'object' && maskedObj[key] !== null) {
      maskedObj[key] = maskSensitiveData(maskedObj[key])
    }
  }

  return maskedObj
}

// 请求验证中间件
export const validateRequest = (requiredFields: string[] = []) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any

    if (!body || typeof body !== 'object') {
      throw new ValidationError('请求体格式错误')
    }

    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      throw new ValidationError(`缺少必要字段: ${missingFields.join(', ')}`)
    }

    // 验证SQL注入
    if (containsSQLInjection(body)) {
      throw new ForbiddenError('检测到SQL注入攻击')
    }

    // 验证XSS攻击
    if (containsXSS(body)) {
      throw new ForbiddenError('检测到XSS攻击')
    }
  }
}

// XSS检测
function containsXSS(obj: any): boolean {
  if (!obj || typeof obj !== 'object') {
    return false
  }

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /@import/gi,
    /<\s*\w+\s*:\s*expression/gi
  ]

  const jsonString = JSON.stringify(obj)
  return xssPatterns.some(pattern => pattern.test(jsonString))
}

// SQL注入检测
function containsSQLInjection(obj: any): boolean {
  if (!obj || typeof obj !== 'object') {
    return false
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|ALL)\b)/gi,
    /(\b(OR|AND)\s+1\s*=\s*1)/gi,
    /(['"])\s*;|;\s*(['"])/gi,
    /\bUNION\s+SELECT/gi,
    /\bWHERE\s+\d+\s*=\s*\d+/gi
  ]

  const jsonString = JSON.stringify(obj)
  return sqlPatterns.some(pattern => pattern.test(jsonString))
}

// API速率限制中间件
export const rateLimit = {
  // 基于IP的速率限制
  byIP: (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, number[]>()

    return async (request: FastifyRequest, reply: FastifyReply) => {
      const ip = request.ip
      const now = Date.now()
      const windowStart = now - windowMs

      if (!requests.has(ip)) {
        requests.set(ip, [])
      }

      // 清理过期请求
      const ipRequests = requests.get(ip)!
      const validRequests = ipRequests.filter(time => time > windowStart)

      // 添加当前请求
      validRequests.push(now)
      requests.set(ip, validRequests)

      // 检查是否超过限制
      if (validRequests.length > maxRequests) {
        reply.code(429)
        throw new ForbiddenError('请求过于频繁，请稍后再试')
      }
    }
  },

  // 基于用户的速率限制
  byUser: (maxRequests: number, windowMs: number) => {
    const requests = new Map<number, number[]>()

    return async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.user as any
      if (!userId) return

      const now = Date.now()
      const windowStart = now - windowMs

      if (!requests.has(userId)) {
        requests.set(userId, [])
      }

      const userRequests = requests.get(userId)!
      const validRequests = userRequests.filter(time => time > windowStart)

      validRequests.push(now)
      requests.set(userId, validRequests)

      if (validRequests.length > maxRequests) {
        reply.code(429)
        throw new ForbiddenError('请求过于频繁，请稍后再试')
      }
    }
  }
}

// 内容安全策略中间件
export const contentSecurityPolicy = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')

    reply.header('Content-Security-Policy', cspHeader)
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('X-XSS-Protection', '1; mode=block')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  }
}

// CORS配置中间件
export const strictCORS = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
      const allowedOrigins = config.corsOrigins

      // 严格的CORS配置
      reply.header('Access-Control-Allow-Origin', allowedOrigins.join(','))
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      reply.header('Access-Control-Allow-Credentials', 'true')
      reply.header('Access-Control-Max-Age', '86400')

      // 处理预检请求
      if (request.method === 'OPTIONS') {
        reply.code(204)
        return
      }
    }
}

// 请求大小限制中间件
export const requestSizeLimit = (maxSize: number = 10 * 1024 * 1024) => { // 默认10MB
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const contentLength = request.headers['content-length']

    if (contentLength && parseInt(contentLength) > maxSize) {
      reply.code(413)
      throw new ForbiddenError('请求体过大')
    }
  }
}

// 会话验证中间件
export const sessionValidation = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as any
    const sessionToken = request.headers['x-session-token'] as string

    if (!userId || !sessionToken) {
      throw new UnauthorizedError('会话无效')
    }

    // 验证会话令牌
    try {
      const tokenData = JSON.parse(Buffer.from(sessionToken, 'base64').toString())

      if (!EncryptionService.verifyTimestamp(tokenData.timestamp, 30)) { // 30分钟有效期
        throw new UnauthorizedError('会话已过期')
      }

      if (tokenData.userId !== userId) {
        throw new UnauthorizedError('会话用户不匹配')
      }

      // 检查会话是否被吊销
      if (await isSessionRevoked(sessionToken)) {
        throw new UnauthorizedError('会话已被吊销')
      }

    } catch (error) {
      throw new UnauthorizedError('会话验证失败')
    }
  }
}

// 检查会话是否被吊销
async function isSessionRevoked(sessionToken: string): Promise<boolean> {
  // 这里应该查询数据库中的吊销会话列表
  // 示例实现
  return false
}

// 敏感操作验证中间件
export const sensitiveOperationValidation = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as any
    const operation = request.url
    const method = request.method

    // 记录敏感操作
    logAudit('SENSITIVE_OPERATION', userId, {
      operation: `${method} ${operation}`,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString()
    })

    // 检查是否需要二次验证
    if (requiresSecondFactor(operation, method)) {
      const secondFactorToken = request.headers['x-second-factor-token'] as string
      if (!secondFactorToken) {
        throw new UnauthorizedError('需要二次验证')
      }

      if (!(await verifySecondFactorToken(userId, secondFactorToken))) {
        throw new UnauthorizedError('二次验证失败')
      }
    }
  }
}

// 判断是否需要二次验证
function requiresSecondFactor(operation: string, method: string): boolean {
  const sensitiveOperations = [
    'DELETE',
    '/admin',
    '/users/reset-password',
    '/system/backup',
    '/system/restore'
  ]

  return sensitiveOperations.some(op =>
    operation.includes(op) || method === 'DELETE'
  )
}

// 验证二次验证令牌
async function verifySecondFactorToken(userId: number, token: string): Promise<boolean> {
  // 这里应该调用二次验证服务
  // 示例实现
  return token.length === 6 // 假设6位数字验证码
}

// 错误类型定义
class ValidationError extends Error {
  statusCode = 400
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// SQL注入和XSS防护
export const securityValidation = {
  // 输入清理
  sanitizeInput: (input: string): string => {
    if (typeof input !== 'string') return input

    return input
      .replace(/[<>]/g, '') // 移除HTML标签
      .replace(/javascript:/gi, '') // 移除JavaScript协议
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .replace(/eval\s*\(/gi, '') // 移除eval调用
      .trim()
  },

  // 参数清理
  sanitizeParams: (params: any): any => {
    if (!params || typeof params !== 'object') return params

    const sanitized: any = {}
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value)
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? this.sanitizeInput(item) : item
        )
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
}