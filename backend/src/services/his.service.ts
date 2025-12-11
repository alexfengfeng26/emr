import { FastifyInstance } from 'fastify'
import { logAudit } from '@/utils/logger'
import { config } from '@/config'
import { EncryptionService } from '@/services/encryption.service'
import { z } from 'zod'

// HIS系统接口配置
interface HISConfig {
  baseUrl: string
  apiKey?: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  authType: 'none' | 'api-key' | 'oauth2'
  oauth2?: {
    tokenUrl: string
    clientId: string
    clientSecret: string
    scope: string
  }
}

// HIS系统消息类型
export enum HISMessageType {
  PATIENT_INFO = 'PATIENT_INFO',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
  MEDICAL_ORDER = 'MEDICAL_ORDER',
  EXAMINATION_RESULT = 'EXAMINATION_RESULT',
  BILLING_INFO = 'BILLING_INFO',
  APPOINTMENT = 'APPOINTMENT',
  NOTIFICATION = 'NOTIFICATION'
}

// HIS系统请求/响应接口
interface HISMessage {
  messageId: string
  messageType: HISMessageType
  source: 'EMR_SYSTEM'
  target: 'HIS_SYSTEM'
  timestamp: string
  version: string
  data: any
  signature?: string
  checksum?: string
}

interface HISResponse {
  success: boolean
  messageId: string
  messageType: HISMessageType
  data?: any
  error?: string
  code?: number
}

// HIS系统服务类
export class HISInterfaceService {
  private static configs: Map<string, HISConfig> = new Map()
  private static connections: Map<string, FastifyInstance> = new Map()

  // 注册HIS系统
  static registerHIS(name: string, config: HISConfig): void {
    // 验证配置
    if (!config.baseUrl) {
      throw new Error('HIS系统配置不完整：缺少baseUrl')
    }

    // 设置默认值
    const defaultConfig: Partial<HISConfig> = {
      timeout: 30000, // 30秒
      retryAttempts: 3,
      retryDelay: 1000, // 1秒
      authType: 'none',
      ...config
    }

    this.configs.set(name, { ...defaultConfig, ...config })

    logAudit('HIS_REGISTERED', 0, {
      hisSystem: name,
      config: {
        baseUrl: defaultConfig.baseUrl,
        authType: defaultConfig.authType
      }
    })
  }

  // 获取HIS系统配置
  static getHISConfig(name: string): HISConfig {
    const config = this.configs.get(name)
    if (!config) {
      throw new Error(`HIS系统 ${name} 未注册`)
    }
    return config
  }

  // 发送消息到HIS系统
  static async sendMessage(hisName: string, message: HISMessage): Promise<HISResponse> {
    const config = this.getHISConfig(hisName)

    try {
      // 添加必要字段
      const fullMessage: HISMessage = {
        ...message,
        source: 'EMR_SYSTEM',
        target: hisName,
        timestamp: message.timestamp || new Date().toISOString(),
        version: '1.0',
        checksum: EncryptionService.calculateChecksum(JSON.stringify(message.data))
      }

      // 数字签名
      if (config.authType === 'oauth2') {
        fullMessage.signature = await this.signMessage(fullMessage)
      }

      // 序列化消息
      const messageData = JSON.stringify(fullMessage)

      // 准备HTTP请求选项
      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EMR-System/1.0',
          'X-Message-ID': fullMessage.messageId
        },
        body: messageData,
        timeout: config.timeout
      }

      // 添加认证头
      if (config.apiKey) {
        options.headers['X-API-Key'] = config.apiKey
      } else if (config.authType === 'oauth2') {
        const token = await this.getOAuthToken(config)
        options.headers['Authorization'] = `Bearer ${token}`
      }

      // 发送HTTP请求
      const response = await fetch(`${config.baseUrl}/api/message`, options)

      if (!response.ok) {
        throw new Error(`HIS系统响应错误: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json() as HISResponse

      // 验证响应
      if (!this.validateHISResponse(responseData)) {
        throw new Error('HIS系统响应格式无效')
      }

      // 验证消息完整性
      if (responseData.data && responseData.checksum) {
        const computedChecksum = EncryptionService.calculateChecksum(JSON.stringify(responseData.data))
        if (computedChecksum !== responseData.checksum) {
          throw new Error('HIS系统响应数据完整性验证失败')
        }
      }

      // 记录审计日志
      logAudit('HIS_MESSAGE_SENT', 0, {
        hisSystem: hisName,
        messageId: fullMessage.messageId,
        messageType: fullMessage.messageType,
        success: responseData.success
      })

      return responseData
    } catch (error) {
      console.error(`发送HIS消息失败 (${hisName}):`, error)

      // 记录审计日志
      logAudit('HIS_MESSAGE_FAILED', 0, {
        hisSystem: hisName,
        messageId: message.messageId,
        messageType: message.messageType,
        error: error instanceof Error ? error.message : '未知错误'
      })

      // 返回错误响应
      return {
        success: false,
        messageId: message.messageId,
        messageType: message.messageType,
        error: error instanceof Error ? error.message : '发送失败',
        code: 500
      }
    }
  }

  // 从HIS系统接收消息
  static async receiveMessage(message: HISMessage): Promise<HISResponse> {
    try {
      // 验证消息格式
      if (!this.validateHISMessage(message)) {
        return {
          success: false,
          messageId: message.messageId,
          messageType: message.messageType,
          error: '消息格式无效',
          code: 400
        }
      }

      // 验证消息完整性
      if (message.checksum) {
        const computedChecksum = EncryptionService.calculateChecksum(JSON.stringify(message.data))
        if (computedChecksum !== message.checksum) {
          return {
            success: false,
            messageId: message.messageId,
            messageType: message.messageType,
            error: '消息完整性验证失败',
            code: 422
          }
        }
      }

      // 验证签名（如果有）
      if (message.signature) {
        // 这里应该使用HIS系统的公钥验证签名
        // const signatureValid = await this.verifyMessageSignature(message)
        // if (!signatureValid) {
        //   throw new Error('消息签名验证失败')
        // }
      }

      // 根据消息类型处理
      const response = await this.processMessage(message)

      // 生成响应
      const responseData: HISResponse = {
        success: true,
        messageId: message.messageId,
        messageType: message.messageType,
        data: response
      }

      // 添加响应完整性校验
      responseData.checksum = EncryptionService.calculateChecksum(JSON.stringify(response))

      // 记录审计日志
      logAudit('HIS_MESSAGE_RECEIVED', 0, {
        messageId: message.messageId,
        messageType: message.messageType,
        source: message.source,
        target: message.target,
        success: true
      })

      return responseData
    } catch (error) {
      console.error('接收HIS消息失败:', error)

      return {
        success: false,
        messageId: message.messageId,
        messageType: message.messageType,
        error: error instanceof Error ? error.message : '处理失败',
        code: 500
      }
    }
  }

  // 处理不同类型的消息
  private static async processMessage(message: HISMessage): Promise<any> {
    switch (message.messageType) {
      case HISMessageType.PATIENT_INFO:
        return this.processPatientInfo(message.data)
      case HISMessageType.MEDICAL_RECORD:
        return this.processMedicalRecord(message.data)
      case HISMessageType.MEDICAL_ORDER:
        return this.processMedicalOrder(message.data)
      case HISMessageType.EXAMINATION_RESULT:
        return this.processExaminationResult(message.data)
      case HISMessageType.BILLING_INFO:
        return this.processBillingInfo(message.data)
      case HISMessageType.APPOINTMENT:
        return this.processAppointment(message.data)
      case HISMessageType.NOTIFICATION:
        return this.processNotification(message.data)
      default:
        throw new Error(`不支持的消息类型: ${message.messageType}`)
    }
  }

  // 处理患者信息
  private static async processPatientInfo(data: any): Promise<any> {
    // 这里应该将HIS系统的患者数据转换为EMR系统格式
    return {
      action: 'SYNC_PATIENT',
      patient: {
        // 转换后的患者数据
        externalId: data.patientId,
        name: data.name,
        gender: this.convertGender(data.gender),
        birthDate: data.birthDate,
        phone: data.phone,
        idCard: data.idCard,
        address: data.address
      }
    }
  }

  // 处理病历信息
  private static async processMedicalRecord(data: any): Promise<any> {
    return {
      action: 'SYNC_MEDICAL_RECORD',
      record: {
        externalId: data.recordId,
        patientId: data.patientId,
        type: data.type,
        content: data.content,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        createdAt: data.createdAt
      }
    }
  }

  // 处理医嘱信息
  private static processMedicalOrder(data: any): Promise<any> {
    return {
      action: 'SYNC_MEDICAL_ORDER',
      order: {
        externalId: data.orderId,
        patientId: data.patientId,
        orderType: data.orderType,
        content: data.content,
        status: data.status,
        createdAt: data.createdAt
      }
    }
  }

  // 处理检查检验结果
  private static processExaminationResult(data: any): Promise<any> {
    return {
      action: 'SYNC_EXAMINATION_RESULT',
      examination: {
        externalId: data.resultId,
        patientId: data.patientId,
        examType: data.examType,
        result: data.result,
        status: data.status,
        completedAt: data.completedAt
      }
    }
  }

  // 处理计费信息
  private static processBillingInfo(data: any): Promise<any> {
    return {
      action: 'SYNC_BILLING_INFO',
      billing: {
        billId: data.billId,
        patientId: data.patientId,
        amount: data.amount,
        items: data.items,
        status: data.status
      }
    }
  }

  // 处理预约信息
  private static processAppointment(data: any): Promise<any> {
    return {
      action: 'SYNC_APPOINTMENT',
      appointment: {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        department: data.department,
        appointmentTime: data.appointmentTime,
        status: data.status
      }
    }
  }

  // 处理通知信息
  private static processNotification(data: any): Promise<any> {
    return {
      action: 'NOTIFICATION',
      notification: {
        notificationId: data.notificationId,
        type: data.type,
        title: data.title,
        content: data.content,
        recipients: data.recipients,
        priority: data.priority || 'normal'
      }
    }
  }

  // 同步患者信息到HIS系统
  static async syncPatientToHIS(hisName: string, patientData: any): Promise<HISResponse> {
    const message: HISMessage = {
      messageId: this.generateMessageId(),
      messageType: HISMessageType.PATIENT_INFO,
      data: {
        action: 'CREATE_UPDATE_PATIENT',
        patient: patientData
      }
    }

    return await this.sendMessage(hisName, message)
  }

  // 同步病历到HIS系统
  static async syncMedicalRecordToHIS(hisName: string, recordData: any): Promise<HISResponse> {
    const message: HISMessage = {
      messageId: this.generateMessageId(),
      messageType: HISMessageType.MEDICAL_RECORD,
      data: {
        action: 'CREATE_UPDATE_MEDICAL_RECORD',
        record: recordData
      }
    }

    return await this.sendMessage(hisName, message)
  }

  // 向HIS系统发送医嘱
  static async sendMedicalOrderToHIS(hisName: string, orderData: any): Promise<HISResponse> {
    const message: HISMessage = {
      messageId: this.generateMessageId(),
      messageType: HISMessageType.MEDICAL_ORDER,
      data: {
        action: 'CREATE_MEDICAL_ORDER',
        order: orderData
      }
    }

    return await this.sendMessage(hisName, message)
  }

  // 向HIS系统查询检查检验结果
  static async queryExaminationResultFromHIS(hisName: string, queryParams: any): Promise<HISResponse> {
    const message: HISMessage = {
      messageId: this.generateMessageId(),
      messageType: HISMessageType.EXAMINATION_RESULT,
      data: {
        action: 'QUERY_EXAMINATION_RESULT',
        queryParams
      }
    }

    return await this.sendMessage(hisName, message)
  }

  // 向HIS系统发送计费信息
  static async sendBillingToHIS(hisName: string, billingData: any): Promise<HISResponse> {
    const message: HISMessage = {
      messageId: this.generateMessageId(),
      messageType: HISMessageType.BILLING_INFO,
      data: {
        action: 'CREATE_BILL',
        billing: billingData
      }
    }

    return await this.sendMessage(hisName, message)
  }

  // 向HIS系统发送预约信息
  static async sendAppointmentToHIS(hisName: string, appointmentData: any): Promise<HISResponse> {
    const message: HISMessage = {
      messageId: this.generateMessageId(),
      messageType: HISMessageType.APPOINTMENT,
      data: {
        action: 'CREATE_APPOINTMENT',
        appointment: appointmentData
      }
    }

    return await this.sendMessage(hisName, message)
  }

  // 向HIS系统发送通知
  static async sendNotificationToHIS(hisName: string, notificationData: any): Promise<HISResponse> {
    const message: HISMessage = {
      messageId: this.generateMessageId(),
      messageType: HISMessageType.NOTIFICATION,
      data: {
        action: 'SEND_NOTIFICATION',
        notification: notificationData
      }
    }

    return await this.sendMessage(hisName, message)
  }

  // 批量同步到HIS系统
  static async batchSyncToHIS(hisName: string, messages: HISMessage[]): Promise<HISResponse[]> {
    try {
      const responses = await Promise.all(
        messages.map(message => this.sendMessage(hisName, message))
      )

      return responses
    } catch (error) {
      console.error(`批量同步HIS消息失败 (${hisName}):`, error)

      // 返回错误响应
      return messages.map(message => ({
        success: false,
        messageId: message.messageId,
        messageType: message.messageType,
        error: error instanceof Error ? error.message : '批量同步失败',
        code: 500
      }))
    }
  }

  // 获取HIS系统状态
  static async getHISStatus(hisName: string): Promise<{ success: boolean; status?: string; error?: string }> {
    const config = this.getHISConfig(hisName)

    try {
      const response = await fetch(`${config.baseUrl}/api/status`, {
        method: 'GET',
        headers: {
          'User-Agent': 'EMR-System/1.0'
        },
        timeout: 5000
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          status: data.status
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '状态检查失败'
      }
    }
  }

  // 验证HIS消息格式
  private static validateHISMessage(message: HISMessage): boolean {
    return !!(
      message.messageId &&
      message.messageType &&
      message.source &&
      message.target &&
      message.timestamp &&
      message.version &&
      message.data
    )
  }

  // 验证HIS响应格式
  private static validateHISResponse(response: HISResponse): boolean {
    return !!(
      response &&
      typeof response.success === 'boolean' &&
      response.messageId &&
      response.messageType
    )
  }

  // 生成消息ID
  private static generateMessageId(): string {
    return `HIS_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  // 获取OAuth2访问令牌
  private static async getOAuthToken(config: HISConfig): Promise<string> {
    if (!config.oauth2) {
      throw new Error('OAuth2配置不完整')
    }

    try {
      const tokenResponse = await fetch(config.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.oauth2.clientId,
          client_secret: config.oauth2.clientSecret,
          scope: config.oauth2.scope
        })
      })

      if (!tokenResponse.ok) {
        throw new Error('OAuth2认证失败')
      }

      const tokenData = await tokenResponse.json()
      return tokenData.access_token
    } catch (error) {
      throw new Error(`获取OAuth2令牌失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 签名消息
  private static async signMessage(message: HISMessage): Promise<string> {
    // 这里应该使用私钥对消息进行签名
    // const signature = await crypto.sign('SHA256', JSON.stringify(message), privateKey)
    // return signature.toString('base64')
    return 'mock_signature'
  }

  // 验证消息签名
  private static async verifyMessageSignature(message: HISMessage): Promise<boolean> {
    // 这里应该使用公钥验证签名
    // return crypto.verify('SHA256', JSON.stringify(message), signature, publicKey)
    return true // 模拟验证
  }

  // 转换性别代码
  private static convertGender(gender: string): string {
    switch (gender?.toUpperCase()) {
      case 'M':
      case 'MALE':
        return 'MALE'
      case 'F':
      case 'FEMALE':
        return 'FEMALE'
      default:
        return 'UNKNOWN'
    }
  }

  // 连接测试
  static async testHISConnection(hisName: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const config = this.getHISConfig(hisName)
    const startTime = Date.now()

    try {
      const response = await fetch(`${config.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'EMR-System/1.0',
          'X-Connection-Test': 'true'
        },
        timeout: 5000
      })

      const latency = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: `HIS系统连接成功`,
          latency
        }
      } else {
        return {
          success: false,
          message: `HIS系统连接失败: ${response.status} ${response.statusText}`,
          latency
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `HIS系统连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
        latency
      }
    }
  }

  // 获取所有已注册的HIS系统
  static getRegisteredHISystems(): string[] {
    return Array.from(this.configs.keys())
  }

  // 移除HIS系统注册
  static unregisterHIS(name: string): void {
    this.configs.delete(name)
    this.connections.delete(name)

    logAudit('HIS_UNREGISTERED', 0, {
      hisSystem: name
    })
  }

  // 清理所有HIS系统连接
  static disconnectAll(): void {
    this.configs.clear()
    this.connections.clear()
  }
}