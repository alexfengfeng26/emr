import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { logger } from '@/utils/logger'

export const errorHandler = async (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // 记录错误日志
  logger.error({
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    ip: request.ip,
    userAgent: request.headers['user-agent']
  })

  // 默认错误响应
  let statusCode = error.statusCode || 500
  let message = error.message || '服务器内部错误'
  let code = -1

  // 处理特定类型的错误
  switch (error.constructor.name) {
    case 'ValidationError':
      statusCode = 400
      message = '请求参数验证失败'
      code = -2
      break

    case 'UnauthorizedError':
      statusCode = 401
      message = '未授权访问'
      code = -3
      break

    case 'ForbiddenError':
      statusCode = 403
      message = '权限不足'
      code = -4
      break

    case 'NotFoundError':
      statusCode = 404
      message = '资源不存在'
      code = -5
      break

    case 'ConflictError':
      statusCode = 409
      message = '资源冲突'
      code = -6
      break

    case 'PrismaClientKnownRequestError':
      statusCode = 400
      code = -7
      // Prisma特定错误处理
      switch ((error as any).code) {
        case 'P2002':
          message = '数据已存在，违反唯一约束'
          break
        case 'P2025':
          message = '记录不存在'
          statusCode = 404
          break
        default:
          message = '数据库操作失败'
      }
      break
  }

  // 开发环境返回详细错误信息
  const response: any = {
    code,
    message,
    timestamp: new Date().toISOString()
  }

  if (process.env.NODE_ENV === 'development') {
    response.error = error.message
    response.stack = error.stack
  }

  return reply.status(statusCode).send(response)
}

// 自定义错误类
export class AppError extends Error {
  public statusCode: number
  public code: number

  constructor(message: string, statusCode: number = 500, code: number = -1) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string = '请求参数验证失败') {
    super(message, 400, -2)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super(message, 401, -3)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403, -4)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(message, 404, -5)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409, -6)
    this.name = 'ConflictError'
  }
}