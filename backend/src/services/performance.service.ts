import { FastifyRequest } from 'fastify'
import { logger } from '@/utils/logger'
import { cacheService } from './cache.service'

export interface PerformanceMetrics {
  requests: {
    total: number
    success: number
    error: number
    avgResponseTime: number
    maxResponseTime: number
    minResponseTime: number
  }
  database: {
    queryCount: number
    avgQueryTime: number
    slowQueries: number
  }
  cache: {
    hitRate: number
    hitCount: number
    missCount: number
  }
  memory: {
    used: number
    total: number
    usage: number
  }
  cpu: {
    usage: number
    loadAverage: number[]
  }
  timestamp: string
}

export interface RequestMetrics {
  method: string
  url: string
  statusCode: number
  responseTime: number
  userAgent?: string
  ip: string
  userId?: number
  timestamp: string
  error?: string
}

export class PerformanceService {
  private static instance: PerformanceService
  private metrics: PerformanceMetrics
  private requestHistory: RequestMetrics[] = []
  private slowQueryThreshold = 1000 // 慢查询阈值（毫秒）
  private maxHistorySize = 1000

  private constructor() {
    this.metrics = this.initializeMetrics()
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService()
    }
    return PerformanceService.instance
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity
      },
      database: {
        queryCount: 0,
        avgQueryTime: 0,
        slowQueries: 0
      },
      cache: {
        hitRate: 0,
        hitCount: 0,
        missCount: 0
      },
      memory: {
        used: 0,
        total: 0,
        usage: 0
      },
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0]
      },
      timestamp: new Date().toISOString()
    }
  }

  // 记录请求性能
  recordRequest(request: FastifyRequest, responseTime: number, statusCode: number, error?: string): void {
    const requestMetric: RequestMetrics = {
      method: request.method,
      url: request.url,
      statusCode,
      responseTime,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: (request.user as any)?.userId,
      timestamp: new Date().toISOString(),
      error
    }

    // 更新请求历史
    this.requestHistory.push(requestMetric)
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift()
    }

    // 更新请求指标
    this.metrics.requests.total++
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++
    } else {
      this.metrics.requests.error++
    }

    // 更新响应时间统计
    this.metrics.requests.maxResponseTime = Math.max(
      this.metrics.requests.maxResponseTime,
      responseTime
    )
    this.metrics.requests.minResponseTime = Math.min(
      this.metrics.requests.minResponseTime,
      responseTime
    )

    // 计算平均响应时间
    this.metrics.requests.avgResponseTime =
      (this.metrics.requests.avgResponseTime * (this.metrics.requests.total - 1) + responseTime) /
      this.metrics.requests.total

    // 记录慢请求日志
    if (responseTime > 5000) {
      logger.warn('慢请求检测', {
        method: request.method,
        url: request.url,
        responseTime,
        userId: requestMetric.userId
      })
    }
  }

  // 记录数据库查询性能
  recordDatabaseQuery(queryTime: number, query?: string): void {
    this.metrics.database.queryCount++

    // 更新平均查询时间
    this.metrics.database.avgQueryTime =
      (this.metrics.database.avgQueryTime * (this.metrics.database.queryCount - 1) + queryTime) /
      this.metrics.database.queryCount

    // 记录慢查询
    if (queryTime > this.slowQueryThreshold) {
      this.metrics.database.slowQueries++
      logger.warn('慢查询检测', {
        queryTime,
        query: query?.substring(0, 200) // 限制日志长度
      })
    }
  }

  // 更新系统指标
  async updateSystemMetrics(): Promise<void> {
    try {
      // 获取内存使用情况
      const memoryUsage = process.memoryUsage()
      this.metrics.memory = {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        usage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      }

      // 获取CPU使用情况
      const cpuUsage = process.cpuUsage()
      this.metrics.cpu.usage = (cpuUsage.user + cpuUsage.system) / 1000000 // 转换为秒

      // 获取缓存指标
      const cacheStats = cacheService.getStats()
      this.metrics.cache = {
        hitRate: cacheStats.hitRate,
        hitCount: cacheStats.hits,
        missCount: cacheStats.misses
      }

      this.metrics.timestamp = new Date().toISOString()
    } catch (error) {
      logger.error('更新系统指标失败:', error)
    }
  }

  // 获取性能指标
  async getMetrics(): Promise<PerformanceMetrics> {
    await this.updateSystemMetrics()
    return { ...this.metrics }
  }

  // 获取请求历史
  getRequestHistory(limit?: number): RequestMetrics[] {
    if (limit) {
      return this.requestHistory.slice(-limit)
    }
    return [...this.requestHistory]
  }

  // 获取错误请求
  getErrorRequests(limit?: number): RequestMetrics[] {
    const errors = this.requestHistory.filter(req => req.error || req.statusCode >= 400)
    return limit ? errors.slice(-limit) : errors
  }

  // 获取慢请求
  getSlowRequests(threshold = 5000, limit?: number): RequestMetrics[] {
    const slowRequests = this.requestHistory.filter(req => req.responseTime > threshold)
    return limit ? slowRequests.slice(-limit) : slowRequests
  }

  // 获取热门端点
  getPopularEndpoints(limit = 10): Array<{ url: string; count: number; avgResponseTime: number }> {
    const endpointStats = new Map<string, { count: number; totalResponseTime: number }>()

    for (const request of this.requestHistory) {
      const key = `${request.method} ${request.url}`
      const stats = endpointStats.get(key) || { count: 0, totalResponseTime: 0 }
      stats.count++
      stats.totalResponseTime += request.responseTime
      endpointStats.set(key, stats)
    }

    return Array.from(endpointStats.entries())
      .map(([url, stats]) => ({
        url,
        count: stats.count,
        avgResponseTime: stats.totalResponseTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  // 获取性能报告
  async getPerformanceReport(): Promise<{
    summary: PerformanceMetrics
    recommendations: string[]
    trends: {
      requests: number[]
      responseTime: number[]
      errors: number[]
    }
  }> {
    const summary = await this.getMetrics()
    const recommendations = this.generateRecommendations(summary)
    const trends = this.calculateTrends()

    return {
      summary,
      recommendations,
      trends
    }
  }

  // 生成性能建议
  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = []

    // 请求性能建议
    if (metrics.requests.avgResponseTime > 3000) {
      recommendations.push('平均响应时间较高（>3s），建议优化数据库查询或增加缓存')
    }

    if (metrics.requests.error / metrics.requests.total > 0.05) {
      recommendations.push('错误率较高（>5%），建议检查应用日志和错误处理')
    }

    // 缓存性能建议
    if (metrics.cache.hitRate < 0.8) {
      recommendations.push('缓存命中率较低（<80%），建议优化缓存策略或增加缓存时间')
    }

    // 内存使用建议
    if (metrics.memory.usage > 80) {
      recommendations.push('内存使用率较高（>80%），建议检查内存泄漏或增加内存')
    }

    // 数据库性能建议
    if (metrics.database.slowQueries > 0) {
      recommendations.push(`发现${metrics.database.slowQueries}个慢查询，建议优化SQL语句或添加索引`)
    }

    if (metrics.database.avgQueryTime > 500) {
      recommendations.push('平均查询时间较高（>500ms），建议优化数据库配置或查询逻辑')
    }

    return recommendations
  }

  // 计算趋势
  private calculateTrends(): {
    requests: number[]
    responseTime: number[]
    errors: number[]
  } {
    const recentRequests = this.requestHistory.slice(-100) // 最近100个请求
    const interval = Math.max(1, Math.floor(recentRequests.length / 10)) // 分成10个区间

    const requests: number[] = []
    const responseTime: number[] = []
    const errors: number[] = []

    for (let i = 0; i < 10; i++) {
      const start = i * interval
      const end = Math.min(start + interval, recentRequests.length)
      const batch = recentRequests.slice(start, end)

      requests.push(batch.length)
      responseTime.push(batch.length > 0 ? batch.reduce((sum, r) => sum + r.responseTime, 0) / batch.length : 0)
      errors.push(batch.filter(r => r.statusCode >= 400).length)
    }

    return { requests, responseTime, errors }
  }

  // 重置指标
  resetMetrics(): void {
    this.metrics = this.initializeMetrics()
    this.requestHistory = []
    logger.info('性能指标已重置')
  }

  // 性能健康检查
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    score: number
  }> {
    const metrics = await this.getMetrics()
    const issues: string[] = []
    let score = 100

    // 检查响应时间
    if (metrics.requests.avgResponseTime > 5000) {
      issues.push('平均响应时间过高')
      score -= 30
    } else if (metrics.requests.avgResponseTime > 3000) {
      issues.push('平均响应时间较高')
      score -= 15
    }

    // 检查错误率
    const errorRate = metrics.requests.error / Math.max(1, metrics.requests.total)
    if (errorRate > 0.1) {
      issues.push('错误率过高')
      score -= 40
    } else if (errorRate > 0.05) {
      issues.push('错误率较高')
      score -= 20
    }

    // 检查内存使用
    if (metrics.memory.usage > 90) {
      issues.push('内存使用率过高')
      score -= 30
    } else if (metrics.memory.usage > 80) {
      issues.push('内存使用率较高')
      score -= 15
    }

    // 检查缓存命中率
    if (metrics.cache.hitRate < 0.7 && metrics.cache.hitCount + metrics.cache.missCount > 100) {
      issues.push('缓存命中率过低')
      score -= 10
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (score < 60) {
      status = 'critical'
    } else if (score < 80) {
      status = 'warning'
    }

    return { status, issues, score }
  }
}

// 导出单例实例
export const performanceService = PerformanceService.getInstance()