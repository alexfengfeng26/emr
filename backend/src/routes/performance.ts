import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { performanceService } from '@/services/performance.service'
import { cacheService } from '@/services/cache.service'
import { requireAdmin } from '@/middleware/auth'
import { z } from 'zod'

// 缓存操作schema
const cacheSetSchema = z.object({
  key: z.string().min(1, '缓存键不能为空'),
  value: z.any(),
  ttl: z.number().min(1, 'TTL必须大于0').max(86400, 'TTL不能超过24小时').optional()
})

const cacheGetSchema = z.object({
  key: z.string().min(1, '缓存键不能为空')
})

const cacheDeleteSchema = z.object({
  key: z.string().min(1, '缓存键不能为空')
})

const cacheBatchDeleteSchema = z.object({
  pattern: z.string().min(1, '模式不能为空')
})

// 性能指标schema
const timeRangeSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.number().min(1, '限制至少1条').max(1000, '限制最多1000条').optional()
})

// 获取性能概览
const getPerformanceOverview = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const metrics = await performanceService.getMetrics()
    const cacheInfo = await cacheService.getCacheInfo()
    const health = await performanceService.healthCheck()

    return reply.send({
      success: true,
      message: '性能概览获取成功',
      data: {
        metrics,
        cache: cacheInfo,
        health,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '性能概览获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 获取详细性能报告
const getPerformanceReport = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const report = await performanceService.getPerformanceReport()

    return reply.send({
      success: true,
      message: '性能报告获取成功',
      data: report
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '性能报告获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 获取请求历史
const getRequestHistory = async (request: FastifyRequest, reply: FastifyReply) => {
  const { limit = 100 } = request.query as { limit?: string }

  try {
    const limitNum = parseInt(limit || '100')
    const history = performanceService.getRequestHistory(limitNum)

    return reply.send({
      success: true,
      message: '请求历史获取成功',
      data: {
        total: history.length,
        requests: history
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '请求历史获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 获取错误请求
const getErrorRequests = async (request: FastifyRequest, reply: FastifyReply) => {
  const { limit = 50 } = request.query as { limit?: string }

  try {
    const limitNum = parseInt(limit || '50')
    const errors = performanceService.getErrorRequests(limitNum)

    return reply.send({
      success: true,
      message: '错误请求获取成功',
      data: {
        total: errors.length,
        errors
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '错误请求获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 获取慢请求
const getSlowRequests = async (request: FastifyRequest, reply: FastifyReply) => {
  const { threshold = 5000, limit = 50 } = request.query as { threshold?: string; limit?: string }

  try {
    const thresholdNum = parseInt(threshold || '5000')
    const limitNum = parseInt(limit || '50')
    const slowRequests = performanceService.getSlowRequests(thresholdNum, limitNum)

    return reply.send({
      success: true,
      message: '慢请求获取成功',
      data: {
        threshold: thresholdNum,
        total: slowRequests.length,
        requests: slowRequests
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '慢请求获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 获取热门端点
const getPopularEndpoints = async (request: FastifyRequest, reply: FastifyReply) => {
  const { limit = 10 } = request.query as { limit?: string }

  try {
    const limitNum = parseInt(limit || '10')
    const endpoints = performanceService.getPopularEndpoints(limitNum)

    return reply.send({
      success: true,
      message: '热门端点获取成功',
      data: {
        total: endpoints.length,
        endpoints
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '热门端点获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 重置性能指标
const resetPerformanceMetrics = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    performanceService.resetMetrics()

    return reply.send({
      success: true,
      message: '性能指标重置成功'
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '性能指标重置失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 缓存操作：设置缓存
const setCache = async (request: FastifyRequest, reply: FastifyReply) => {
  const { key, value, ttl } = cacheSetSchema.parse(request.body)

  try {
    await cacheService.set(key, value, { ttl })

    return reply.send({
      success: true,
      message: '缓存设置成功',
      data: {
        key,
        ttl: ttl || 3600
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '缓存设置失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 缓存操作：获取缓存
const getCache = async (request: FastifyRequest, reply: FastifyReply) => {
  const { key } = cacheGetSchema.parse(request.body)

  try {
    const value = await cacheService.get(key)

    return reply.send({
      success: true,
      message: value !== null ? '缓存获取成功' : '缓存不存在',
      data: {
        key,
        value,
        exists: value !== null
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '缓存获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 缓存操作：删除缓存
const deleteCache = async (request: FastifyRequest, reply: FastifyReply) => {
  const { key } = cacheDeleteSchema.parse(request.body)

  try {
    await cacheService.del(key)

    return reply.send({
      success: true,
      message: '缓存删除成功',
      data: { key }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '缓存删除失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 缓存操作：批量删除
const batchDeleteCache = async (request: FastifyRequest, reply: FastifyReply) => {
  const { pattern } = cacheBatchDeleteSchema.parse(request.body)

  try {
    await cacheService.delPattern(pattern)

    return reply.send({
      success: true,
      message: '批量缓存删除成功',
      data: { pattern }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '批量缓存删除失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 获取缓存信息
const getCacheInfo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const info = await cacheService.getCacheInfo()
    const stats = cacheService.getStats()

    return reply.send({
      success: true,
      message: '缓存信息获取成功',
      data: {
        ...info,
        stats
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '缓存信息获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 清空所有缓存
const flushCache = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await cacheService.flush()

    return reply.send({
      success: true,
      message: '所有缓存已清空'
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '清空缓存失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 缓存健康检查
const cacheHealthCheck = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const health = await cacheService.healthCheck()

    const statusCode = health.status === 'healthy' ? 200 :
                     health.status === 'degraded' ? 200 : 503

    return reply.code(statusCode).send({
      success: health.status !== 'unhealthy',
      message: `缓存状态: ${health.status}`,
      data: health
    })
  } catch (error) {
    return reply.code(503).send({
      success: false,
      message: '缓存健康检查失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 重置缓存统计
const resetCacheStats = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    cacheService.resetStats()

    return reply.send({
      success: true,
      message: '缓存统计已重置'
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '重置缓存统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 系统资源监控
const getSystemResources = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    const uptime = process.uptime()

    const systemInfo = {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }

    return reply.send({
      success: true,
      message: '系统资源信息获取成功',
      data: systemInfo
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '系统资源信息获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

export const performanceRoutes = async (fastify: FastifyInstance) => {
  // 性能监控路由
  fastify.get('/api/performance/overview', {
    preHandler: requireAdmin
  }, getPerformanceOverview)

  fastify.get('/api/performance/report', {
    preHandler: requireAdmin
  }, getPerformanceReport)

  fastify.get('/api/performance/requests/history', {
    preHandler: requireAdmin
  }, getRequestHistory)

  fastify.get('/api/performance/requests/errors', {
    preHandler: requireAdmin
  }, getErrorRequests)

  fastify.get('/api/performance/requests/slow', {
    preHandler: requireAdmin
  }, getSlowRequests)

  fastify.get('/api/performance/endpoints', {
    preHandler: requireAdmin
  }, getPopularEndpoints)

  fastify.post('/api/performance/reset', {
    preHandler: requireAdmin
  }, resetPerformanceMetrics)

  // 缓存管理路由
  fastify.post('/api/cache/set', {
    preHandler: requireAdmin
  }, setCache)

  fastify.post('/api/cache/get', {
    preHandler: requireAdmin
  }, getCache)

  fastify.post('/api/cache/delete', {
    preHandler: requireAdmin
  }, deleteCache)

  fastify.post('/api/cache/delete/batch', {
    preHandler: requireAdmin
  }, batchDeleteCache)

  fastify.get('/api/cache/info', {
    preHandler: requireAdmin
  }, getCacheInfo)

  fastify.post('/api/cache/flush', {
    preHandler: requireAdmin
  }, flushCache)

  fastify.get('/api/cache/health', {
    preHandler: requireAdmin
  }, cacheHealthCheck)

  fastify.post('/api/cache/stats/reset', {
    preHandler: requireAdmin
  }, resetCacheStats)

  // 系统资源监控
  fastify.get('/api/system/resources', {
    preHandler: requireAdmin
  }, getSystemResources)

  // 健康检查（无认证要求）
  fastify.get('/api/performance/health', async (request: FastifyRequest, reply: FastifyReply) => {
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
        message: '健康检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  })
}