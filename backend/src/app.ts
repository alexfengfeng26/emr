import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import redis from '@fastify/redis'
import staticFiles from '@fastify/static'
import path from 'path'

import { config } from '@/config'
import { logger } from '@/utils/logger'
import { authRoutes } from '@/routes/auth'
import { systemRoutes } from '@/routes/system'
import { patientRoutes } from '@/routes/patients'
import { medicalRecordRoutes } from '@/routes/medical-records'
import { medicalOrderRoutes } from '@/routes/medical-orders'
import { examinationRoutes } from '@/routes/examinations'
import { errorHandler } from '@/middleware/error-handler'
import { authenticate } from '@/middleware/auth'

const fastify = Fastify({
  logger: logger,
  trustProxy: true
})

// 注册插件
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: config.corsOrigins,
    credentials: true
  })

  // JWT
  await fastify.register(jwt, {
    secret: config.jwtSecret
  })

  // 速率限制
  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      // 对于登录路由，使用更宽松的限制
      if (request.url?.includes('/auth/login')) {
        return 'login-global'
      }
      return request.ip || 'unknown'
    }
  })

  // Redis
  if (config.redisUrl) {
    await fastify.register(redis, {
      url: config.redisUrl
    })

    // 初始化缓存服务
    // cacheService.initialize(fastify.redis)
  } else {
    logger.warn('Redis未配置，将使用内存缓存')
  }

  // 静态文件
  await fastify.register(staticFiles, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/'
  })
}

// 注册路由
async function registerRoutes() {
  // 健康检查
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  })

  // 添加简单的测试路由
  fastify.get('/api/test', async () => {
    return {
      code: 0,
      message: '测试接口正常工作',
      timestamp: new Date().toISOString()
    }
  })

  // 添加认证测试路由
  fastify.get('/api/test/auth', { preHandler: authenticate }, async (request, reply) => {
    return {
      code: 0,
      message: '认证测试成功',
      user: request.user,
      timestamp: new Date().toISOString()
    }
  })

  // 注册认证路由
  fastify.register(authRoutes, { prefix: '/api/auth' })

  // 注册系统管理路由
  fastify.register(systemRoutes, { prefix: '/api/system' })

  // 注册业务路由
  fastify.register(patientRoutes, { prefix: '/api/patients' })
  fastify.register(medicalRecordRoutes, { prefix: '/api/medical-records' })
  fastify.register(medicalOrderRoutes, { prefix: '/api/medical-orders' })
  fastify.register(examinationRoutes, { prefix: '/api/examinations' })
}

// 错误处理
fastify.setErrorHandler(errorHandler)

// 启动服务器
async function start() {
  try {
    await registerPlugins()
    await registerRoutes()

    const port = config.port || 3000
    const host = config.host || '0.0.0.0'

    await fastify.listen({ port, host })
    logger.info(`Server listening on http://${host}:${port}`)
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  await fastify.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  await fastify.close()
  process.exit(0)
})

// 启动应用
if (require.main === module) {
  start()
}

export { fastify, start }