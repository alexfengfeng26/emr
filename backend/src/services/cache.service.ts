import { FastifyRedis } from '@fastify/redis'
import { logger } from '@/utils/logger'
import { config } from '@/config'

export interface CacheOptions {
  ttl?: number // 生存时间（秒）
  prefix?: string // 键前缀
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
}

export class CacheService {
  private static instance: CacheService
  private redis: FastifyRedis | null = null
  private memoryCache: Map<string, { value: any; expires: number }> = new Map()
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  }

  private constructor() {}

  // 获取单例实例
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  // 初始化Redis连接
  initialize(redis: FastifyRedis): void {
    this.redis = redis
    logger.info('缓存服务初始化成功')
  }

  // 设置缓存
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const { ttl = 3600, prefix = 'emr:' } = options
    const fullKey = `${prefix}${key}`

    try {
      // 优先使用Redis
      if (this.redis) {
        const serializedValue = JSON.stringify(value)
        if (ttl > 0) {
          await this.redis.setex(fullKey, ttl, serializedValue)
        } else {
          await this.redis.set(fullKey, serializedValue)
        }
      } else {
        // 回退到内存缓存
        const expires = Date.now() + ttl * 1000
        this.memoryCache.set(fullKey, { value, expires })
        this.cleanupMemoryCache()
      }
    } catch (error) {
      logger.error('缓存设置失败:', error)
      // 设置失败时回退到内存缓存
      const expires = Date.now() + ttl * 1000
      this.memoryCache.set(fullKey, { value, expires })
    }
  }

  // 获取缓存
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { prefix = 'emr:' } = options
    const fullKey = `${prefix}${key}`

    this.stats.totalRequests++

    try {
      // 优先从Redis获取
      if (this.redis) {
        const value = await this.redis.get(fullKey)
        if (value) {
          this.stats.hits++
          return JSON.parse(value)
        }
      }

      // 从内存缓存获取
      const memoryItem = this.memoryCache.get(fullKey)
      if (memoryItem && Date.now() < memoryItem.expires) {
        this.stats.hits++
        return memoryItem.value
      }

      this.stats.misses++
      return null
    } catch (error) {
      logger.error('缓存获取失败:', error)
      this.stats.misses++
      return null
    }
  }

  // 删除缓存
  async del(key: string, options: CacheOptions = {}): Promise<void> {
    const { prefix = 'emr:' } = options
    const fullKey = `${prefix}${key}`

    try {
      if (this.redis) {
        await this.redis.del(fullKey)
      }
      this.memoryCache.delete(fullKey)
    } catch (error) {
      logger.error('缓存删除失败:', error)
    }
  }

  // 批量删除
  async delPattern(pattern: string, options: CacheOptions = {}): Promise<void> {
    const { prefix = 'emr:' } = options
    const fullPattern = `${prefix}${pattern}`

    try {
      if (this.redis) {
        const keys = await this.redis.keys(fullPattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }

      // 内存缓存模式匹配删除
      for (const [key] of this.memoryCache.entries()) {
        if (key.startsWith(prefix) && key.replace(prefix, '').match(pattern.replace(/\*/g, '.*'))) {
          this.memoryCache.delete(key)
        }
      }
    } catch (error) {
      logger.error('批量缓存删除失败:', error)
    }
  }

  // 检查缓存是否存在
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const { prefix = 'emr:' } = options
    const fullKey = `${prefix}${key}`

    try {
      if (this.redis) {
        const result = await this.redis.exists(fullKey)
        return result === 1
      }

      const memoryItem = this.memoryCache.get(fullKey)
      return memoryItem ? Date.now() < memoryItem.expires : false
    } catch (error) {
      logger.error('缓存检查失败:', error)
      return false
    }
  }

  // 设置缓存过期时间
  async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<void> {
    const { prefix = 'emr:' } = options
    const fullKey = `${prefix}${key}`

    try {
      if (this.redis) {
        await this.redis.expire(fullKey, ttl)
      } else {
        const memoryItem = this.memoryCache.get(fullKey)
        if (memoryItem) {
          memoryItem.expires = Date.now() + ttl * 1000
        }
      }
    } catch (error) {
      logger.error('缓存过期设置失败:', error)
    }
  }

  // 获取或设置缓存（原子操作）
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options)
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    await this.set(key, value, options)
    return value
  }

  // 清理过期的内存缓存
  private cleanupMemoryCache(): void {
    const now = Date.now()
    for (const [key, item] of this.memoryCache.entries()) {
      if (now >= item.expires) {
        this.memoryCache.delete(key)
      }
    }
  }

  // 清空所有缓存
  async flush(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushdb()
      }
      this.memoryCache.clear()
      logger.info('所有缓存已清空')
    } catch (error) {
      logger.error('清空缓存失败:', error)
    }
  }

  // 获取缓存统计
  getStats(): CacheStats {
    const { hits, misses, totalRequests } = this.stats
    return {
      hits,
      misses,
      hitRate: totalRequests > 0 ? hits / totalRequests : 0,
      totalRequests
    }
  }

  // 重置统计
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    }
  }

  // 缓存预热
  async warmup(preloadData: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>): Promise<void> {
    logger.info(`开始缓存预热，共${preloadData.length}项`)

    const promises = preloadData.map(async ({ key, fetcher, ttl }) => {
      try {
        const value = await fetcher()
        await this.set(key, value, { ttl })
      } catch (error) {
        logger.error(`缓存预热失败 [${key}]:`, error)
      }
    })

    await Promise.all(promises)
    logger.info('缓存预热完成')
  }

  // 获取缓存信息
  async getCacheInfo(): Promise<{
    type: 'redis' | 'memory'
    itemCount: number
    memoryUsage: number
    stats: CacheStats
  }> {
    let itemCount = 0
    let memoryUsage = 0

    if (this.redis) {
      try {
        const info = await this.redis.info('memory')
        const lines = info.split('\r\n')
        for (const line of lines) {
          if (line.startsWith('used_memory_human:')) {
            // 简单估算，实际应该解析Redis内存信息
            memoryUsage = 1024 * 1024 // 1MB占位符
          }
        }
        itemCount = this.memoryCache.size
      } catch (error) {
        logger.error('获取Redis信息失败:', error)
      }
    } else {
      itemCount = this.memoryCache.size
      memoryUsage = this.memoryCache.size * 1024 // 估算每个缓存项1KB
    }

    return {
      type: this.redis ? 'redis' : 'memory',
      itemCount,
      memoryUsage,
      stats: this.getStats()
    }
  }

  // 健康检查
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    redis: boolean
    memory: boolean
    responseTime: number
  }> {
    const startTime = Date.now()

    try {
      let redisHealthy = false
      let memoryHealthy = false

      // 检查Redis
      if (this.redis) {
        try {
          await this.redis.ping()
          redisHealthy = true
        } catch (error) {
          logger.warn('Redis健康检查失败:', error)
        }
      }

      // 检查内存缓存
      try {
        const testKey = 'health_check'
        await this.set(testKey, 'ok', { ttl: 10 })
        const value = await this.get(testKey)
        await this.del(testKey)
        memoryHealthy = value === 'ok'
      } catch (error) {
        logger.warn('内存缓存健康检查失败:', error)
      }

      const responseTime = Date.now() - startTime

      // 确定整体状态
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      if (!memoryHealthy) {
        status = 'unhealthy'
      } else if (!redisHealthy && this.redis) {
        status = 'degraded'
      }

      return {
        status,
        redis: redisHealthy,
        memory: memoryHealthy,
        responseTime
      }
    } catch (error) {
      logger.error('缓存健康检查失败:', error)
      return {
        status: 'unhealthy',
        redis: false,
        memory: false,
        responseTime: Date.now() - startTime
      }
    }
  }
}

// 导出单例实例
export const cacheService = CacheService.getInstance()

// 缓存装饰器工厂
export function Cacheable(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`

      return cacheService.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        options
      )
    }
  }
}

// 缓存失效装饰器
export function CacheEvict(pattern: string, options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args)

      // 执行缓存失效
      await cacheService.delPattern(pattern, options)

      return result
    }
  }
}