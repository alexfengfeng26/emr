import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query'
    },
    {
      emit: 'event',
      level: 'error'
    },
    {
      emit: 'event',
      level: 'info'
    },
    {
      emit: 'event',
      level: 'warn'
    }
  ]
})

// 监听Prisma日志事件
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Query: ' + e.query)
    logger.debug('Params: ' + e.params)
    logger.debug('Duration: ' + e.duration + 'ms')
  }
})

prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e)
})

prisma.$on('info', (e) => {
  logger.info('Prisma Info:', e.message)
})

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning:', e.message)
})

// 数据库连接测试
export const testDatabaseConnection = async () => {
  try {
    await prisma.$connect()
    logger.info('Database connected successfully')
    return true
  } catch (error) {
    logger.error('Database connection failed:', error)
    return false
  }
}

// 优雅关闭数据库连接
export const closeDatabaseConnection = async () => {
  try {
    await prisma.$disconnect()
    logger.info('Database connection closed')
  } catch (error) {
    logger.error('Error closing database connection:', error)
  }
}

export { prisma }
export default prisma