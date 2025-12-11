import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { config } from '@/config'
import { logAudit } from '@/utils/logger'

export class EncryptionService {
  // 加密算法配置
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16

  // 获取加密密钥
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
      throw new Error('加密密钥未配置')
    }
    return Buffer.from(key, 'hex')
  }

  // 生成随机IV
  private static generateIV(): Buffer {
    return crypto.randomBytes(this.IV_LENGTH)
  }

  // 加密数据
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    try {
      const key = this.getEncryptionKey()
      const iv = this.generateIV()

      const cipher = crypto.createCipher(this.ALGORITHM, key)
      cipher.setAAD(Buffer.from('EMR', 'utf8'))

      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const tag = cipher.getAuthTag()

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      }
    } catch (error) {
      console.error('数据加密失败:', error)
      throw new Error('数据加密失败')
    }
  }

  // 解密数据
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    try {
      const key = this.getEncryptionKey()
      const iv = Buffer.from(encryptedData.iv, 'hex')
      const tag = Buffer.from(encryptedData.tag, 'hex')

      const decipher = crypto.createDecipher(this.ALGORITHM, key)
      decipher.setAAD(Buffer.from('EMR', 'utf8'))
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('数据解密失败:', error)
      throw new Error('数据解密失败')
    }
  }

  // 加密对象
  static encryptObject(obj: any): { encrypted: string; iv: string; tag: string } {
    const jsonString = JSON.stringify(obj)
    return this.encrypt(jsonString)
  }

  // 解密对象
  static decryptObject<T = any>(encryptedData: { encrypted: string; iv: string; tag: string }): T {
    const jsonString = this.decrypt(encryptedData)
    return JSON.parse(jsonString)
  }

  // 生成哈希值
  static generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  // 验证哈希值
  static verifyHash(data: string, hash: string): boolean {
    const computedHash = this.generateHash(data)
    return computedHash === hash
  }

  // 生成盐值
  static generateSalt(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  // 密码哈希（使用bcrypt）
  static async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
      return await bcrypt.hash(password, saltRounds)
    } catch (error) {
      console.error('密码哈希失败:', error)
      throw new Error('密码哈希失败')
    }
  }

  // 验证密码
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash)
    } catch (error) {
      console.error('密码验证失败:', error)
      return false
    }
  }

  // 数据脱敏
  static maskSensitiveData(data: string, type: 'idCard' | 'phone' | 'name' | 'email'): string {
    if (!data) return data

    switch (type) {
      case 'idCard':
        // 身份证脱敏：保留前3位和后4位
        if (data.length >= 7) {
          return data.substring(0, 3) + '*'.repeat(data.length - 7) + data.substring(data.length - 4)
        }
        return '*'.repeat(data.length)

      case 'phone':
        // 手机号脱敏：保留前3位和后4位
        if (data.length >= 7) {
          return data.substring(0, 3) + '****' + data.substring(data.length - 4)
        }
        return '*'.repeat(data.length)

      case 'name':
        // 姓名脱敏：保留第一个字，其余用*代替
        if (data.length > 1) {
          return data.substring(0, 1) + '*'.repeat(data.length - 1)
        }
        return '*'

      case 'email':
        // 邮箱脱敏：保留前3位和@后的域名
        const atIndex = data.lastIndexOf('@')
        if (atIndex > 3) {
          const localPart = data.substring(0, 3) + '***'
          const domain = data.substring(atIndex)
          return localPart + domain
        }
        return '***' + data.substring(data.lastIndexOf('@'))

      default:
        return '*'.repeat(data.length)
    }
  }

  // 生成JWT密钥对
  static generateRSAKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })

    return {
      publicKey: publicKey,
      privateKey: privateKey
    }
  }

  // RSA加密
  static rsaEncrypt(data: string, publicKey: string): string {
    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(data, 'utf8')
      )

      return encrypted.toString('base64')
    } catch (error) {
      console.error('RSA加密失败:', error)
      throw new Error('RSA加密失败')
    }
  }

  // RSA解密
  static rsaDecrypt(encryptedData: string, privateKey: string): string {
    try {
      const encrypted = Buffer.from(encryptedData, 'base64')
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        encrypted
      )

      return decrypted.toString('utf8')
    } catch (error) {
      console.error('RSA解密失败:', error)
      throw new Error('RSA解密失败')
    }
  }

  // 数字签名
  static signData(data: string, privateKey: string): string {
    try {
      const sign = crypto.createSign('RSA-SHA256')
      sign.update(data)
      return sign.sign(privateKey, 'base64')
    } catch (error) {
      console.error('数字签名失败:', error)
      throw new Error('数字签名失败')
    }
  }

  // 验证数字签名
  static verifySignature(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('RSA-SHA256')
      verify.update(data)
      return verify.verify(publicKey, signature, 'base64')
    } catch (error) {
      console.error('数字签名验证失败:', error)
      return false
    }
  }

  // 数据完整性检查
  static calculateChecksum(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex')
  }

  // 验证数据完整性
  static verifyChecksum(data: string, checksum: string): boolean {
    const calculatedChecksum = this.calculateChecksum(data)
    return calculatedChecksum === checksum
  }

  // 安全地比较字符串（防止时序攻击）
  static safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  // 生成随机令牌
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // 时间戳验证
  static verifyTimestamp(timestamp: string, maxAgeMinutes: number = 30): boolean {
    try {
      const messageTime = new Date(timestamp).getTime()
      const currentTime = new Date().getTime()
      const timeDiff = currentTime - messageTime
      const maxAge = maxAgeMinutes * 60 * 1000

      return timeDiff < maxAge
    } catch (error) {
      return false
    }
  }

  // 密钥轮换（示例）
  static rotateEncryptionKey(): { newKey: string; migrationData: any } {
    const newKey = crypto.randomBytes(this.KEY_LENGTH).toString('hex')

    // 这里应该：
    // 1. 更新数据库中的密钥
    // 2. 标记需要重新加密的数据
    // 3. 提供迁移脚本

    return {
      newKey,
      migrationData: {
        timestamp: new Date().toISOString(),
        status: 'pending'
      }
    }
  }

  // 审计日志加密
  static encryptAuditLog(logData: any): string {
    try {
      const logDataWithIntegrity = {
        ...logData,
        integrity: this.calculateChecksum(JSON.stringify(logData))
      }

      const encrypted = this.encryptObject(logDataWithIntegrity)
      return JSON.stringify(encrypted)
    } catch (error) {
      console.error('审计日志加密失败:', error)
      throw new Error('审计日志加密失败')
    }
  }

  // 审计日志解密
  static decryptAuditLog(encryptedLog: string): any {
    try {
      const encryptedData = JSON.parse(encryptedLog)
      const decryptedData = this.decryptObject(encryptedData)

      // 验证数据完整性
      const dataWithoutIntegrity = { ...decryptedData }
      const originalIntegrity = dataWithoutIntegrity.integrity
      delete dataWithoutIntegrity.integrity

      const currentIntegrity = this.calculateChecksum(JSON.stringify(dataWithoutIntegrity))

      if (originalIntegrity !== currentIntegrity) {
        throw new Error('审计日志完整性验证失败')
      }

      return dataWithoutIntegrity
    } catch (error) {
      console.error('审计日志解密失败:', error)
      throw new Error('审计日志解密失败')
    }
  }

  // 数据库字段加密存储格式
  static getEncryptedField(plaintext: string): string {
    const encrypted = this.encrypt(plaintext)
    return JSON.stringify({
      version: '1.0',
      algorithm: this.ALGORITHM,
      ...encrypted
    })
  }

  // 数据库字段解密
  static getDecryptedField(encryptedField: string): string {
    try {
      const encrypted = JSON.parse(encryptedField)
      return this.decrypt({
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        tag: encrypted.tag
      })
    } catch (error) {
      console.error('字段解密失败:', error)
      throw new Error('字段解密失败')
    }
  }

  // 批量数据加密
  static encryptBatch(dataArray: any[]): Array<{ data: any; encrypted: string; hash: string }> {
    return dataArray.map(data => {
      const encrypted = this.encryptObject(data)
      const hash = this.generateHash(JSON.stringify(data))

      return {
        data,
        encrypted: JSON.stringify(encrypted),
        hash
      }
    })
  }

  // 批量数据解密和验证
  static decryptBatch(encryptedArray: Array<{ encrypted: string; hash: string }>): Array<any> {
    const decryptedData: any[] = []

    for (const item of encryptedArray) {
      try {
        const decrypted = this.decryptObject(JSON.parse(item.encrypted))
        const computedHash = this.generateHash(JSON.stringify(decrypted))

        if (item.hash !== computedHash) {
          console.error('批量数据解密：哈希验证失败')
          continue
        }

        decryptedData.push(decrypted)
      } catch (error) {
        console.error('批量数据解密失败:', error)
      }
    }

    return decryptedData
  }
}