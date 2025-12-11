import { FastifyRequest, FastifyReply } from 'fastify'
import { performanceService } from '@/services/performance.service'
import { logger } from '@/utils/logger'

// 性能监控中间件
export const performanceMonitor = async (request: FastifyRequest, reply: FastifyReply) => {
  const startTime = Date.now()

  // 添加响应完成时的处理
  reply.addHook('onSend', async () => {
    const responseTime = Date.now() - startTime
    const statusCode = reply.statusCode

    // 记录请求性能
    performanceService.recordRequest(request, responseTime, statusCode)
  })

  // 添加错误处理
  reply.addHook('onError', async (request, reply, error) => {
    const responseTime = Date.now() - startTime
    performanceService.recordRequest(request, responseTime, reply.statusCode, error.message)
  })
}

// 数据库查询性能监控
export const dbPerformanceMonitor = {
  // 监控查询执行时间
  async monitorQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await queryFn()
      const queryTime = Date.now() - startTime

      performanceService.recordDatabaseQuery(queryTime, queryName)
      return result
    } catch (error) {
      const queryTime = Date.now() - startTime
      performanceService.recordDatabaseQuery(queryTime, queryName)
      throw error
    }
  }
}

// 响应时间限制中间件
export const responseTimeLimit = (maxResponseTime: number = 30000) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now()

    // 设置响应超时
    const timeout = setTimeout(() => {
      if (!reply.raw.headersSent) {
        logger.warn('请求超时', {
          url: request.url,
          method: request.method,
          timeout: maxResponseTime
        })

        reply.code(408).send({
          success: false,
          message: '请求处理超时',
          timeout: maxResponseTime
        })
      }
    }, maxResponseTime)

    // 清理超时定时器
    reply.addHook('onSend', async () => {
      clearTimeout(timeout)
    })

    reply.addHook('onError', async () => {
      clearTimeout(timeout)
    })
  }
}

// 请求大小监控中间件
export const requestSizeMonitor = (maxSize: number = 10 * 1024 * 1024) => { // 10MB
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const contentLength = parseInt(request.headers['content-length'] || '0')

    if (contentLength > maxSize) {
      logger.warn('请求体过大', {
        url: request.url,
        contentLength,
        maxSize
      })

      reply.code(413).send({
        success: false,
        message: '请求体过大',
        maxSize: `${maxSize / 1024 / 1024}MB`
      })
    }

    // 记录请求大小
    if (contentLength > 0) {
      logger.debug('请求大小监控', {
        url: request.url,
        contentLength: `${(contentLength / 1024).toFixed(2)}KB`
      })
    }
  }
}

// 并发请求限制中间件
export const concurrencyLimit = (maxConcurrent: number = 100) => {
  let currentRequests = 0

  return async (request: FastifyRequest, reply: FastifyReply) => {
    currentRequests++

    if (currentRequests > maxConcurrent) {
      currentRequests--

      logger.warn('并发请求超限', {
        url: request.url,
        current: currentRequests,
        max: maxConcurrent
      })

      reply.code(503).send({
        success: false,
        message: '服务器繁忙，请稍后再试',
        concurrentRequests: currentRequests
      })
      return
    }

    // 请求完成后减少计数
    const cleanup = () => {
      currentRequests--
    }

    reply.addHook('onSend', cleanup)
    reply.addHook('onError', cleanup)
    reply.addHook('onRequestAbort', cleanup)
  }
}

// 内存使用监控中间件
export const memoryMonitor = (threshold: number = 0.9) => { // 90%
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const memoryUsage = process.memoryUsage()
    const memoryUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal

    if (memoryUsageRatio > threshold) {
      logger.error('内存使用率过高', {
        url: request.url,
        usage: `${(memoryUsageRatio * 100).toFixed(2)}%`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`
      })

      // 可以选择拒绝新请求或进行垃圾回收
      if (memoryUsageRatio > 0.95) {
        reply.code(503).send({
          success: false,
          message: '服务器内存不足，请稍后再试'
        })
        return
      }
    }
  }
}

// 性能统计中间件
export const performanceStats = async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.url === '/api/performance/stats') {
    try {
      const stats = await performanceService.getPerformanceReport()
      return reply.send(stats)
    } catch (error) {
      reply.code(500).send({
        success: false,
        message: '获取性能统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}

// 性能健康检查中间件
export const performanceHealthCheck = async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.url === '/api/performance/health') {
    try {
      const health = await performanceService.healthCheck()

      const statusCode = health.status === 'healthy' ? 200 :
                       health.status === 'warning' ? 200 : 503

      return reply.code(statusCode).send({
        success: health.status !== 'critical',
        status: health.status,
        score: health.score,
        issues: health.issues,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      reply.code(503).send({
        success: false,
        status: 'unhealthy',
        message: '性能健康检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}

// API响应时间统计
export const apiResponseTimeStats = async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.url === '/api/performance/endpoints') {
    try {
      const endpoints = performanceService.getPopularEndpoints(20)
      return reply.send({
        success: true,
        data: endpoints
      })
    } catch (error) {
      reply.code(500).send({
        success: false,
        message: '获取端点统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}

// 慢请求日志
export const slowRequestLogger = (threshold: number = 5000) => { // 5秒
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now()

    reply.addHook('onSend', async () => {
      const responseTime = Date.now() - startTime

      if (responseTime > threshold) {
        logger.warn('慢请求检测', {
          method: request.method,
          url: request.url,
          responseTime,
          userId: (request.user as any)?.userId,
          ip: request.ip,
          userAgent: request.headers['user-agent']
        })
      }
    })
  }
}