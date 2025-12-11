import { PrismaClient } from '@prisma/client'
import { cacheService, Cacheable } from './cache.service'
import { performanceService } from './performance.service'
import { logger } from '@/utils/logger'

export class DatabaseOptimizedService {
  private static instance: DatabaseOptimizedService
  private prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'minimal'
    })
  }

  static getInstance(): DatabaseOptimizedService {
    if (!DatabaseOptimizedService.instance) {
      DatabaseOptimizedService.instance = new DatabaseOptimizedService()
    }
    return DatabaseOptimizedService.instance
  }

  // 获取Prisma客户端
  getPrisma(): PrismaClient {
    return this.prisma
  }

  // 优化的查询执行器
  async executeQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    cacheKey?: string,
    ttl: number = 300 // 5分钟默认缓存
  ): Promise<T> {
    const startTime = Date.now()

    try {
      // 如果有缓存键，先尝试从缓存获取
      if (cacheKey) {
        const cached = await cacheService.get<T>(cacheKey)
        if (cached !== null) {
          return cached
        }
      }

      // 执行查询
      const result = await performanceService.dbPerformanceMonitor.monitorQuery(
        queryName,
        queryFn
      )

      // 将结果存入缓存
      if (cacheKey) {
        await cacheService.set(cacheKey, result, { ttl })
      }

      return result
    } catch (error) {
      const queryTime = Date.now() - startTime
      performanceService.recordDatabaseQuery(queryTime, queryName)

      logger.error('数据库查询失败:', {
        queryName,
        error: error instanceof Error ? error.message : '未知错误',
        queryTime
      })

      throw error
    }
  }

  // 批量查询优化
  async batchQuery<T>(
    operations: Array<{
      name: string
      query: () => Promise<T>
      cacheKey?: string
      ttl?: number
    }>
  ): Promise<T[]> {
    const results: T[] = []

    // 分离需要缓存和不需要缓存的查询
    const cachedOps = operations.filter(op => op.cacheKey)
    const directOps = operations.filter(op => !op.cacheKey)

    // 并行执行需要缓存的查询
    if (cachedOps.length > 0) {
      const cachedResults = await Promise.all(
        cachedOps.map(async op => {
          return this.executeQuery(op.name, op.query, op.cacheKey, op.ttl)
        })
      )
      results.push(...cachedResults)
    }

    // 并行执行直接查询
    if (directOps.length > 0) {
      const directResults = await Promise.all(
        directOps.map(async op => {
          return this.executeQuery(op.name, op.query)
        })
      )
      results.push(...directResults)
    }

    return results
  }

  // 分页查询优化
  async paginatedQuery<T>(
    queryName: string,
    baseQuery: () => Promise<{ data: T[]; total: number }>,
    page: number,
    pageSize: number,
    cacheKeyPrefix?: string,
    ttl: number = 60 // 1分钟缓存分页数据
  ): Promise<{
    data: T[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }> {
    const cacheKey = cacheKeyPrefix
      ? `${cacheKeyPrefix}:page:${page}:size:${pageSize}`
      : undefined

    const result = await this.executeQuery(
      queryName,
      baseQuery,
      cacheKey,
      ttl
    )

    const totalPages = Math.ceil(result.total / pageSize)

    return {
      data: result.data,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  // 软删除操作
  async softDelete(
    modelName: string,
    id: number,
    cacheKeyPattern?: string
  ): Promise<void> {
    const startTime = Date.now()

    try {
      // 执行软删除
      await this.executeQuery(
        `softDelete.${modelName}`,
        async () => {
          switch (modelName) {
            case 'patient':
              return this.prisma.patient.update({
                where: { id },
                data: { deleted: true, deletedAt: new Date() }
              })
            case 'medicalRecord':
              return this.prisma.medicalRecord.update({
                where: { id },
                data: { deleted: true, deletedAt: new Date() }
              })
            case 'medicalOrder':
              return this.prisma.medicalOrder.update({
                where: { id },
                data: { deleted: true, deletedAt: new Date() }
              })
            case 'examination':
              return this.prisma.examination.update({
                where: { id },
                data: { deleted: true, deletedAt: new Date() }
              })
            default:
              throw new Error(`不支持的模型: ${modelName}`)
          }
        }
      )

      // 清理相关缓存
      if (cacheKeyPattern) {
        await cacheService.delPattern(cacheKeyPattern)
      }

      logger.info(`软删除成功: ${modelName}#${id}`)
    } catch (error) {
      const queryTime = Date.now() - startTime
      performanceService.recordDatabaseQuery(queryTime, `softDelete.${modelName}`)

      logger.error('软删除失败:', {
        modelName,
        id,
        error: error instanceof Error ? error.message : '未知错误'
      })

      throw error
    }
  }

  // 批量软删除
  async batchSoftDelete(
    modelName: string,
    ids: number[],
    cacheKeyPattern?: string
  ): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 }

    // 批量执行，限制并发数
    const batchSize = 10
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)

      await Promise.allSettled(
        batch.map(async (id) => {
          try {
            await this.softDelete(modelName, id)
            results.success++
          } catch (error) {
            results.failed++
            logger.error(`批量软删除失败: ${modelName}#${id}`, error)
          }
        })
      )
    }

    // 清理相关缓存
    if (cacheKeyPattern) {
      await cacheService.delPattern(cacheKeyPattern)
    }

    return results
  }

  // 事务操作
  async transaction<T>(
    operations: () => Promise<T>,
    cacheKeyPatterns: string[] = []
  ): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await this.prisma.$transaction(operations)

      // 清理相关缓存
      for (const pattern of cacheKeyPatterns) {
        await cacheService.delPattern(pattern)
      }

      const queryTime = Date.now() - startTime
      performanceService.recordDatabaseQuery(queryTime, 'transaction')

      return result
    } catch (error) {
      const queryTime = Date.now() - startTime
      performanceService.recordDatabaseQuery(queryTime, 'transaction_failed')

      logger.error('事务执行失败:', {
        error: error instanceof Error ? error.message : '未知错误',
        queryTime
      })

      throw error
    }
  }

  // 数据库健康检查
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    connection: boolean
    responseTime: number
    error?: string
  }> {
    const startTime = Date.now()

    try {
      // 执行简单查询测试连接
      await this.prisma.$queryRaw`SELECT 1`

      const responseTime = Date.now() - startTime
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

      if (responseTime > 5000) {
        status = 'degraded'
      } else if (responseTime > 10000) {
        status = 'unhealthy'
      }

      return {
        status,
        connection: true,
        responseTime
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        connection: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 获取数据库统计信息
  async getStats(): Promise<{
    connectionCount: number
    queryCount: number
    avgQueryTime: number
    slowQueries: number
  }> {
    const metrics = await performanceService.getMetrics()

    return {
      connectionCount: 1, // 简化实现，实际应该从连接池获取
      queryCount: metrics.database.queryCount,
      avgQueryTime: metrics.database.avgQueryTime,
      slowQueries: metrics.database.slowQueries
    }
  }

  // 优化查询建议
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const metrics = performanceService.getMetrics()

    if (metrics.database.avgQueryTime > 1000) {
      suggestions.push('平均查询时间较高，建议检查索引和查询优化')
    }

    if (metrics.database.slowQueries > 10) {
      suggestions.push(`发现${metrics.database.slowQueries}个慢查询，建议优化SQL语句`)
    }

    if (metrics.database.queryCount > 1000 && metrics.database.avgQueryTime > 500) {
      suggestions.push('查询频率高且响应慢，建议增加缓存层')
    }

    return suggestions
  }

  // 清理过期数据
  async cleanupExpiredData(): Promise<{
    deletedRecords: number
    cleanedTables: string[]
  }> {
    const results = {
      deletedRecords: 0,
      cleanedTables: [] as string[]
    }

    try {
      // 清理过期的审计日志（保留1年）
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      const deletedLogs = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: oneYearAgo
          }
        }
      })

      if (deletedLogs.count > 0) {
        results.deletedRecords += deletedLogs.count
        results.cleanedTables.push('audit_logs')
      }

      logger.info('数据清理完成', results)
    } catch (error) {
      logger.error('数据清理失败:', error)
    }

    return results
  }

  // 关闭数据库连接
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      logger.info('数据库连接已关闭')
    } catch (error) {
      logger.error('关闭数据库连接失败:', error)
    }
  }
}

// 导出单例实例
export const dbOptimizedService = DatabaseOptimizedService.getInstance()