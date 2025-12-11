import winston from 'winston'
import { config } from '@/config'

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logObject = {
      timestamp,
      level,
      message,
      ...meta
    }
    try {
      return JSON.stringify(logObject)
    } catch (error) {
      // 处理循环引用对象
      return JSON.stringify(logObject, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (value.constructor && value.constructor.name === 'Socket') {
            return '[Socket]'
          }
          if (value.constructor && value.constructor.name === 'HTTPParser') {
            return '[HTTPParser]'
          }
        }
        return value
      })
    }
  })
)

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level}]: ${message}`
  })
)

// 创建logger实例
export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: config.nodeEnv === 'development' ? consoleFormat : logFormat
    })
  ],
  // 处理未捕获的异常和Promise拒绝
  exceptionHandlers: [
    new winston.transports.Console()
  ],
  rejectionHandlers: [
    new winston.transports.Console()
  ]
})

// 添加Fastify需要的logger方法
logger.fatal = logger.error
logger.trace = logger.debug

// 生产环境添加文件输出
if (config.nodeEnv === 'production') {
  logger.add(new winston.transports.File({
    filename: config.logFile,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  }))

  // 错误日志单独记录
  logger.add(new winston.transports.File({
    filename: config.logFile.replace('.log', '-error.log'),
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5,
    format: logFormat
  }))
}

// 审计日志
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
})

// 审计日志函数
export const logAudit = (action: string, userId: number, details?: any) => {
  auditLogger.info({
    action,
    userId,
    timestamp: new Date().toISOString(),
    ip: details?.ip,
    userAgent: details?.userAgent,
    resource: details?.resource,
    result: details?.result
  })
}

export default logger