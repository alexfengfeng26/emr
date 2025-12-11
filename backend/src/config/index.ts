import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库配置
  databaseUrl: process.env.DATABASE_URL || 'mysql://emr_user:emr_password@localhost:3306/emr_system',

  // Redis配置
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT配置
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // CORS配置
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],

  // 日志配置
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/app.log',

  // 安全配置
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',

  // 文件上传配置
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  uploadPath: process.env.UPLOAD_PATH || 'uploads/',

  // 分页配置
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20'),
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100'),

  // 医疗标准配置
  enableHL7: process.env.ENABLE_HL7 === 'true',
  enableFHIR: process.env.ENABLE_FHIR === 'true',
  fhirServerUrl: process.env.FHIR_SERVER_URL,

  // 审计日志配置
  enableAuditLog: process.env.ENABLE_AUDIT_LOG !== 'false',
  auditLogRetention: parseInt(process.env.AUDIT_LOG_RETENTION || '365'), // 天数
}

// 验证必要的环境变量
const requiredEnvVars = ['DATABASE_URL']

if (config.nodeEnv === 'production') {
  requiredEnvVars.push('JWT_SECRET')
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
}