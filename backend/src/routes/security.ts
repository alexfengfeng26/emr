import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { EncryptionService } from '@/services/encryption.service'
import { requireAdmin, requireDoctorOrNurse } from '@/middleware/auth'
import { logAudit } from '@/utils/logger'
import { config } from '@/config'
import { z } from 'zod'

// 加密测试schema
const encryptTestSchema = z.object({
  data: z.string().min(1, '要加密的数据不能为空')
})

// 解密测试schema
const decryptTestSchema = z.object({
  encrypted: z.string().min(1, '加密数据不能为空'),
  iv: z.string().min(1, 'IV不能为空'),
  tag: z.string().min(1, 'TAG不能为空')
})

// 密码哈希schema
const passwordHashSchema = z.object({
  password: z.string().min(6, '密码至少6位').max(100, '密码最多100位')
})

// 密码验证schema
const passwordVerifySchema = z.object({
  password: z.string().min(1, '密码不能为空'),
  hash: z.string().min(1, '哈希值不能为空')
})

// 数据脱敏schema
const dataMaskingSchema = z.object({
  data: z.string(),
  type: z.enum(['idCard', 'phone', 'name', 'email'])
})

// 密钥管理schema
const keyManagementSchema = z.object({
  operation: z.enum(['generate', 'rotate', 'validate'])
})

// 加密测试
const encryptData = async (request: FastifyRequest, reply: FastifyReply) => {
  const { data } = encryptTestSchema.parse(request.body)

  try {
    const encrypted = EncryptionService.encrypt(data)
    return reply.send({
      success: true,
      data: '加密成功',
      encrypted
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '加密失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 解密测试
const decryptData = async (request: FastifyRequest, reply: FastifyReply) => {
  const { encrypted, iv, tag } = decryptTestSchema.parse(request.body)

  try {
    const decrypted = EncryptionService.decrypt({ encrypted, iv, tag })
    return reply.send({
      success: true,
      data: '解密成功',
      decrypted
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '解密失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 生成密码哈希
const hashPassword = async (request: FastifyRequest, reply: FastifyReply) => {
  const { password } = passwordHashSchema.parse(request.body)

  try {
    const hash = await EncryptionService.hashPassword(password)
    return reply.send({
      success: true,
      message: '密码哈希生成成功',
      hash
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '密码哈希生成失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 验证密码
const verifyPassword = async (request: FastifyRequest, reply: FastifyReply) => {
  const { password, hash } = passwordVerifySchema.parse(request.body)

  try {
    const isValid = await EncryptionService.verifyPassword(password, hash)
    return reply.send({
      success: true,
      message: isValid ? '密码正确' : '密码错误',
      isValid
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '密码验证失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 数据脱敏
const maskData = async (request: FastifyRequest, reply: FastifyReply) => {
  const { data, type } = dataMaskingSchema.parse(request.body)

  try {
    const masked = EncryptionService.maskSensitiveData(data, type)
    return reply.send({
      success: true,
      message: '数据脱敏成功',
      original: data,
      masked
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '数据脱敏失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 生成哈希
const generateHash = async (request: FastifyRequest, reply: FastifyReply) => {
  const { data } = request.body as { data: string }

  if (!data) {
    return reply.code(400).send({
      success: false,
      message: '数据不能为空'
    })
  }

  try {
    const hash = EncryptionService.generateHash(data)
    return reply.send({
      success: true,
      message: '哈希生成成功',
      data,
      hash
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '哈希生成失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 验证哈希
const verifyHash = async (request: FastifyRequest, reply: FastifyReply) => {
  const { data, hash } = request.body as { data: string; hash: string }

  if (!data || !hash) {
    return reply.code(400).send({
      success: false,
      message: '数据和哈希值不能为空'
    })
  }

  try {
    const isValid = EncryptionService.verifyHash(data, hash)
    return reply.send({
      success: true,
      message: isValid ? '哈希验证成功' : '哈希验证失败',
      isValid
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '哈希验证失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 密钥管理
const manageKeys = async (request: FastifyRequest, reply: FastifyReply) => {
  const { operation } = keyManagementSchema.parse(request.body)
  const { userId } = request.user!

  try {
    let result

    switch (operation) {
      case 'generate':
        const keyPair = EncryptionService.generateRSAKeyPair()
        result = {
          operation: 'generate',
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
          message: 'RSA密钥对生成成功'
        }
        break

      case 'rotate':
        const rotationData = EncryptionService.rotateEncryptionKey()
        result = {
          operation: 'rotate',
          newKey: rotationData.newKey,
          migrationData: rotationData.migrationData,
          message: '加密密钥轮换完成'
        }
        break

      case 'validate':
        const keyValid = !!process.env.ENCRYPTION_KEY
        result = {
          operation: 'validate',
          keyValid,
          message: keyValid ? '密钥有效' : '密钥无效'
        }
        break

      default:
        return reply.code(400).send({
          success: false,
          message: '不支持的操作'
        })
    }

    // 记录密钥操作审计日志
    if (operation === 'generate' || operation === 'rotate') {
      // 注意：不要记录实际的密钥内容
      logAudit('KEY_MANAGEMENT', userId, {
        operation,
        success: true,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      })
    }

    return reply.send({
      success: true,
      ...result
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '密钥管理操作失败',
      operation,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// RSA加密测试
const rsaEncrypt = async (request: FastifyRequest, reply: FastifyReply) => {
  const { data, publicKey } = request.body as { data: string; publicKey: string }

  if (!data || !publicKey) {
    return reply.code(400).send({
      success: false,
      message: '数据和公钥不能为空'
    })
  }

  try {
    const encrypted = EncryptionService.rsaEncrypt(data, publicKey)
    return reply.send({
      success: true,
      message: 'RSA加密成功',
      encrypted
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'RSA加密失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// RSA解密测试
const rsaDecrypt = async (request: FastifyRequest, reply: FastifyReply) => {
  const { encryptedData, privateKey } = request.body as { encryptedData: string; privateKey: string }

  if (!encryptedData || !privateKey) {
    return reply.code(400).send({
      success: false,
      message: '加密数据和私钥不能为空'
    })
  }

  try {
    const decrypted = EncryptionService.rsaDecrypt(encryptedData, privateKey)
    return reply.send({
      success: true,
      message: 'RSA解密成功',
      decrypted
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'RSA解密失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 数字签名
const signData = async (request: FastifyRequest, reply: FastifyReply) => {
  const { data, privateKey } = request.body as { data: string; privateKey: string }

  if (!data || !privateKey) {
    return reply.code(400).send({
      success: false,
      message: '数据和私钥不能为空'
    })
  }

  try {
    const signature = EncryptionService.signData(data, privateKey)
    return reply.send({
      success: true,
      message: '数字签名成功',
      signature
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '数字签名失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 验证数字签名
const verifySignature = async (request: FastifyRequest, reply: FastifyReply) => {
  const { data, signature, publicKey } = request.body as { data: string; signature: string; publicKey: string }

  if (!data || !signature || !publicKey) {
    return reply.code(400).send({
      success: false,
      message: '数据、签名和公钥不能为空'
    })
  }

  try {
    const isValid = EncryptionService.verifySignature(data, signature, publicKey)
    return reply.send({
      success: true,
      message: isValid ? '数字签名验证成功' : '数字签名验证失败',
      isValid
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '数字签名验证失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 数据完整性检查
const checkIntegrity = async (request: FastifyRequest, reply: FastifyReply) => {
  const { data } = request.body as { data: string }

  if (!data) {
    return reply.code(400).send({
      success: false,
      message: '数据不能为空'
    })
  }

  try {
    const checksum = EncryptionService.calculateChecksum(data)
    return reply.send({
      success: true,
      message: '完整性检查完成',
      checksum
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '完整性检查失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 生成安全令牌
const generateSecureToken = async (request: FastifyRequest, reply: FastifyReply) => {
  const { length = 32 } = request.query as { length?: number }

  try {
    const token = EncryptionService.generateToken(length)
    return reply.send({
      success: true,
      message: '安全令牌生成成功',
      token
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '安全令牌生成失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 安全配置信息
const getSecurityConfig = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const config = {
      encryptionAlgorithm: 'aes-256-gcm',
      keyLength: 256,
      ivLength: 128,
      tagLength: 128,
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      sessionTimeout: 30, // 分钟
      rateLimitEnabled: true,
      xssProtection: true,
      csrfProtection: true,
      sqlInjectionProtection: true,
      dataMaskingEnabled: true
    }

    return reply.send({
      success: true,
      message: '安全配置获取成功',
      config
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '安全配置获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 安全状态检查
const checkSecurityStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const status = {
      encryptionService: !!process.env.ENCRYPTION_KEY,
      fhirAuth: !!process.env.FHIR_AUTH_TOKEN,
      hl7Auth: !!process.env.HL7_AUTH_TOKEN,
      auditLogging: process.env.ENABLE_AUDIT_LOG !== 'false',
      rateLimiting: config.rateLimitMax > 0,
      httpsEnabled: request.protocol === 'https',
      secureHeaders: {
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block'
      }
    }

    const allSecure = Object.values(status).every(value => !!value)

    return reply.send({
      success: true,
      message: allSecure ? '所有安全检查通过' : '存在安全风险',
      allSecure,
      status
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '安全状态检查失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

export const securityRoutes = async (fastify: FastifyInstance) => {
  // 加密解密接口
  fastify.post('/api/security/encrypt', encryptData)
  fastify.post('/api/security/decrypt', decryptData)

  // 密码安全接口
  fastify.post('/api/security/password/hash', hashPassword)
  fastify.post('/api/security/password/verify', verifyPassword)

  // 数据保护接口
  fastify.post('/api/security/mask', maskData)
  fastify.post('/api/security/hash', generateHash)
  fastify.post('/api/security/hash/verify', verifyHash)

  // 密钥管理接口（需要管理员权限）
  fastify.post('/api/security/keys', {
    preHandler: requireAdmin
  }, manageKeys)

  // 数字签名接口
  fastify.post('/api/security/sign', signData)
  fastify.post('/api/security/verify', verifySignature)

  // RSA加密接口
  fastify.post('/api/security/rsa/encrypt', rsaEncrypt)
  fastify.post('/api/security/rsa/decrypt', rsaDecrypt)

  // 数据完整性接口
  fastify.post('/api/security/integrity', checkIntegrity)

  // 令牌生成
  fastify.get('/api/security/token', generateSecureToken)

  // 配置和状态接口
  fastify.get('/api/security/config', getSecurityConfig)
  fastify.get('/api/security/status', checkSecurityStatus)

  // 测试接口（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    fastify.get('/api/security/test', (request, reply) => {
      const testData = {
        message: '安全功能测试数据',
        timestamp: new Date().toISOString()
      }

      // 测试加密解密
      const encrypted = EncryptionService.encrypt(testData.message)
      const decrypted = EncryptionService.decrypt(encrypted)

      // 测试脱敏
      const maskedPhone = EncryptionService.maskSensitiveData('13800138000', 'phone')
      const maskedIdCard = EncryptionService.maskSensitiveData('110101198005150001', 'idCard')

      // 测试哈希
      const hash = EncryptionService.generateHash(JSON.stringify(testData))

      return reply.send({
        success: true,
        message: '安全功能测试完成',
        test: {
          original: testData.message,
          encrypted,
          decrypted,
          hash,
          dataMasking: {
            phone: maskedPhone,
            idCard: maskedIdCard
          },
          allTestsPassed: testData.message === decrypted
        }
      })
    })
  }
}