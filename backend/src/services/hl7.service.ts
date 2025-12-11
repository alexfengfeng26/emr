import { logAudit } from '@/utils/logger'
import { config } from '@/config'

// HL7消息类型枚举
export enum HL7MessageType {
  ADT = 'ADT', // 患者管理
  ORM = 'ORM', // 医嘱管理
  ORU = 'ORU', // 观察结果（检查检验）
  SIU = 'SIU', // 排程信息
  MFN = 'MFN', // 主文件
}

// HL7消息结构
export interface HL7Message {
  msh: {
    msh_1: string // 字段分隔符
    msh_2: string // 编码字符
    msh_3: string // 发送应用
    msh_4: string // 发送设施
    msh_5: string // 接收应用
    msh_6: string // 接收设施
    msh_7: string // 日期时间
    msh_8: string // 安全性
    msh_9: string // 消息类型
    msh_10: string // 消息控制ID
    msh_11: string // 处理ID
    msh_12: string // 版本ID
  }
  evn?: any // 事件类型
  pid?: any // 患者标识
  pv1?: any // 患者访问
  orc?: any // 通用订单
  obr?: any // 观察请求
  obx?: any[] // 观察结果
}

// HL7解析器
export class HL7Parser {
  // 解析HL7消息
  static parse(hl7Message: string): HL7Message {
    const lines = hl7Message.split(/\r?\n/).filter(line => line.trim())
    const segments: Record<string, any> = {}

    for (const line of lines) {
      const segmentType = line.substring(0, 3)
      const fields = line.substring(3).split('|')

      segments[segmentType] = this.parseSegment(segmentType, fields)
    }

    return segments as HL7Message
  }

  // 解析单个段
  private static parseSegment(segmentType: string, fields: string[]): any {
    const segment: any = {}

    switch (segmentType) {
      case 'MSH':
        segment.msh_1 = fields[0] || '|'
        segment.msh_2 = fields[1] || '^~\\&'
        segment.msh_3 = fields[2] || ''
        segment.msh_4 = fields[3] || ''
        segment.msh_5 = fields[4] || ''
        segment.msh_6 = fields[5] || ''
        segment.msh_7 = fields[6] || ''
        segment.msh_8 = fields[7] || ''
        segment.msh_9 = fields[8] || ''
        segment.msh_10 = fields[9] || ''
        segment.msh_11 = fields[10] || ''
        segment.msh_12 = fields[11] || ''
        break

      case 'PID':
        segment.pid_1 = fields[0] || '' // 设置ID
        segment.pid_2 = fields[1] || '' // 患者ID
        segment.pid_3 = fields[2] ? this.parseRepetition(fields[2]) : [] // 患者标识列表
        segment.pid_4 = fields[3] || '' // 别名
        segment.pid_5 = fields[4] ? this.parsePersonName(fields[4]) : {} // 患者姓名
        segment.pid_6 = fields[5] || '' // 母亲 Maiden姓名
        segment.pid_7 = fields[6] || '' // 出生日期
        segment.pid_8 = fields[7] || '' // 性别
        segment.pid_9 = fields[8] || '' // 别名
        segment.pid_10 = fields[9] || '' // 种族
        segment.pid_11 = fields[10] || '' // 地址
        segment.pid_12 = fields[11] || '' // 省码
        segment.pid_13 = fields[12] ? this.parseTelephoneNumber(fields[12]) : [] // 电话号码
        segment.pid_14 = fields[13] || '' // 商务电话号码
        segment.pid_15 = fields[14] || '' // 语言
        segment.pid_16 = fields[15] || '' // 婚姻状况
        segment.pid_17 = fields[16] || '' // 宗教
        segment.pid_18 = fields[17] ? this.parsePatientAccount(fields[17]) : {} // 患者账户
        segment.pid_19 = fields[18] || '' // SSN
        segment.pid_20 = fields[19] || '' // 驾照号
        segment.pid_21 = fields[20] ? this.parseMotherIdentifier(fields[20]) : {} // 母亲标识
        segment.pid_22 = fields[21] ? this.parseEthnicGroup(fields[21]) : {} // 民族
        segment.pid_23 = fields[22] || '' // 出生地
        segment.pid_24 = fields[23] ? this.parseMultipleBirth(fields[23]) : {} // 多胞胎
        segment.pid_25 = fields[24] || '' // 出生顺序
        segment.pid_26 = fields[25] || '' // 公民身份
        segment.pid_27 = fields[26] ? this.parseVeteranMilitaryStatus(fields[26]) : {} // 退伍军人状况
        segment.pid_28 = fields[27] ? this.parseNationality(fields[27]) : {} // 国籍
        segment.pid_29 = fields[28] || '' // 死亡日期和时间
        segment.pid_30 = fields[29] || '' // 死亡指示器
        break

      case 'OBX':
        segment.obx_1 = fields[0] || '' // 设置ID
        segment.obx_2 = fields[1] || '' // 值类型
        segment.obx_3 = fields[2] ? this.parseCodedElement(fields[2]) : {} // 观察标识符
        segment.obx_4 = fields[3] || '' // 观察子ID
        segment.obx_5 = fields[4] || '' // 观察值
        segment.obx_6 = fields[5] || '' // 单位
        segment.obx_7 = fields[6] || '' // 参考范围
        segment.obx_8 = fields[7] || '' // 异常标志
        segment.obx_9 = fields[8] || '' // 概率
        segment.obx_10 = fields[9] || '' // 自然性
        segment.obx_11 = fields[10] || '' // 观察结果状态
        segment.obx_12 = fields[11] || '' // 有效日期范围
        segment.obx_13 = fields[12] || '' // 观察日期/时间
        segment.obx_14 = fields[13] || '' // 生产者参考
        segment.obx_15 = fields[14] || '' // 责任观察者
        segment.obx_16 = fields[15] || '' // 联系电话
        break

      case 'ORC':
        segment.orc_1 = fields[0] || '' // 订单控制
        segment.orc_2 = fields[1] || '' // 放置者订单号
        segment.orc_3 = fields[2] || '' // 填充者订单号
        segment.orc_4 = fields[3] || '' // 放置组号
        segment.orc_5 = fields[4] || '' // 订单状态
        segment.orc_6 = fields[5] || '' // 响应标志
        segment.orc_7 = fields[6] || '' // 量
        segment.orc_8 = fields[7] || '' // 进入者
        segment.orc_9 = fields[8] || '' // 呼叫者
        segment.orc_10 = fields[9] || '' // 订单生效日期/时间
        segment.orc_11 = fields[10] || '' // 订单控制日期/时间
        segment.orc_12 = fields[11] || '' // 填充日期/时间
        break

      case 'OBR':
        segment.obr_1 = fields[0] || '' // 放置者订单号
        segment.obr_2 = fields[1] || '' // 填充者订单号
        segment.obr_3 = fields[2] || '' // 放置者通用订单号
        segment.obr_4 = fields[3] || '' // 填充者通用订单号
        segment.obr_5 = fields[4] || '' // 订单状态
        segment.obr_6 = fields[5] ? this.parseCodedElement(fields[5]) : {} // 响应标志
        segment.obr_7 = fields[6] || '' // 量
        segment.obr_8 = fields[7] || '' // 诊断师
        segment.obr_9 = fields[8] || '' // 呼叫者
        segment.obr_10 = fields[9] ? this.parseCodedElement(fields[9]) : {} // 订单生效日期/时间
        segment.obr_11 = fields[10] || '' // 订单控制日期/时间
        segment.obr_12 = fields[11] || '' // 填充日期/时间
        segment.obr_13 = fields[12] ? this.parseCodedElement(fields[12]) : {} // 取样日期/时间
        segment.obr_14 = fields[13] ? this.parseCodedElement(fields[13]) : {} // 收藏日期/时间
        segment.obr_15 = fields[14] ? this.parseCodedElement(fields[14]) : {} // 处理器ID
        break

      default:
        // 默认处理：将所有字段存储
        fields.forEach((field, index) => {
          segment[`${segmentType.toLowerCase()}_${index + 1}`] = field
        })
    }

    return segment
  }

  // 解析重复字段
  private static parseRepetition(field: string): string[] {
    return field.split('~')
  }

  // 解析人员姓名
  private static parsePersonName(field: string): any {
    const parts = field.split('^')
    return {
      family: parts[0] || '',
      given: parts[1] ? parts[1].split('&') : [],
      middle: parts[2] || '',
      prefix: parts[3] || '',
      suffix: parts[4] || '',
      degree: parts[5] || ''
    }
  }

  // 解析电话号码
  private static parseTelephoneNumber(field: string): any {
    const parts = field.split('^')
    return {
      phone: parts[0] || '',
      use: parts[1] || '',
      equipmentType: parts[2] || '',
      country: parts[3] || '',
      area: parts[4] || '',
      localNumber: parts[5] || '',
      extension: parts[6] || ''
    }
  }

  // 解析编码元素
  private static parseCodedElement(field: string): any {
    const parts = field.split('^')
    return {
      identifier: parts[0] || '',
      text: parts[1] || '',
      nameOfCodingSystem: parts[2] || '',
      alternateIdentifier: parts[3] || '',
      alternateText: parts[4] || '',
      nameOfAlternateCodingSystem: parts[5] || ''
    }
  }

  // 解析患者账户
  private static parsePatientAccount(field: string): any {
    const parts = field.split('^')
    return {
      id: parts[0] || '',
      checkDigit: parts[1] || '',
      checkDigitScheme: parts[2] || '',
      facility: parts[3] || '',
      type: parts[4] || ''
    }
  }

  // 解析母亲标识
  private static parseMotherIdentifier(field: string): any {
    const parts = field.split('^')
    return {
      id: parts[0] || '',
      checkDigit: parts[1] || '',
      checkDigitScheme: parts[2] || '',
      facility: parts[3] || '',
      type: parts[4] || ''
    }
  }

  // 解析民族
  private static parseEthnicGroup(field: string): any {
    const parts = field.split('^')
    return {
      identifier: parts[0] || '',
      text: parts[1] || '',
      nameOfCodingSystem: parts[2] || '',
      alternateIdentifier: parts[3] || '',
      alternateText: parts[4] || '',
      nameOfAlternateCodingSystem: parts[5] || ''
    }
  }

  // 解析多胞胎
  private static parseMultipleBirth(field: string): any {
    const parts = field.split('^')
    return {
      birthOrder: parts[0] || '',
      birthIndicator: parts[1] || ''
    }
  }

  // 解析退伍军人状况
  private static parseVeteranMilitaryStatus(field: string): any {
    const parts = field.split('^')
    return {
      status: parts[0] || '',
      rank: parts[1] || '',
      branch: parts[2] || '',
      serviceDate: parts[3] || '',
      dischargeDate: parts[4] || '',
      dischargeStatus: parts[5] || ''
    }
  }

  // 解析国籍
  private static parseNationality(field: string): any {
    const parts = field.split('^')
    return {
      identifier: parts[0] || '',
      text: parts[1] || '',
      nameOfCodingSystem: parts[2] || '',
      alternateIdentifier: parts[3] || '',
      alternateText: parts[4] || '',
      nameOfAlternateCodingSystem: parts[5] || ''
    }
  }
}

// HL7消息构建器
export class HL7Builder {
  // 构建患者注册消息（ADT_A01）
  static buildADT_A01(patient: any): string {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)
    const messageId = this.generateMessageId()

    const msh = `MSH|^~\\&|EMR|HOSPITAL|RECEIVER|DESTINATION|${timestamp}||ADT^A01|${messageId}|P|2.5`
    const evn = `EVN|A01|${timestamp}|||${patient.doctorId || ''}`

    const pid = this.buildPID(patient)
    const pv1 = this.buildPV1(patient)

    return `${msh}\r${evn}\r${pid}\r${pv1}\r`
  }

  // 构建患者更新消息（ADT_A02）
  static buildADT_A02(patient: any): string {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)
    const messageId = this.generateMessageId()

    const msh = `MSH|^~\\&|EMR|HOSPITAL|RECEIVER|DESTINATION|${timestamp}||ADT^A02|${messageId}|P|2.5`
    const evn = `EVN|A02|${timestamp}|||${patient.doctorId || ''}`

    const pid = this.buildPID(patient)
    const pv1 = this.buildPV1(patient)

    return `${msh}\r${evn}\r${pid}\r${pv1}\r`
  }

  // 构建医嘱消息（ORM_O01）
  static buildORM_O01(medicalOrder: any): string {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)
    const messageId = this.generateMessageId()

    const msh = `MSH|^~\\&|EMR|HOSPITAL|LAB|DESTINATION|${timestamp}||ORM^O01|${messageId}|P|2.5`

    const orc = this.buildORC(medicalOrder)
    const obr = this.buildOBR(medicalOrder)

    return `${msh}\r${orc}\r${obr}\r`
  }

  // 构建检查检验结果消息（ORU_R01）
  static buildORU_R01(examination: any): string {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)
    const messageId = this.generateMessageId()

    const msh = `MSH|^~\\&|LAB|HOSPITAL|EMR|DESTINATION|${timestamp}||ORU^R01|${messageId}|P|2.5`

    const obr = this.buildOBR(examination)
    const obx = this.buildOBX(examination)

    return `${msh}\r${obr}\r${obx}\r`
  }

  // 构建PID段
  private static buildPID(patient: any): string {
    const name = `${patient.family || ''}^${patient.given?.join('^') || ''}`
    const identifiers = `${patient.idCard || ''}^^^CN^PI`
    const phoneNumber = patient.phone ? `^PRN^PH^^^${patient.phone}` : ''

    return `PID|1|${identifiers}||${name}||${patient.birthDate || ''}|${patient.gender || ''}|${phoneNumber}|||||||||||||${patient.address || ''}`
  }

  // 构建PV1段
  private static buildPV1(patient: any): string {
    return `PV1|1|I|||||||||||||||||||||||||||||${patient.doctorId || ''}`
  }

  // 构建ORC段
  private static buildORC(medicalOrder: any): string {
    return `ORC|NW|${medicalOrder.id}|||CM|||||||||||||||||${medicalOrder.doctorId || ''}`
  }

  // 构建OBR段
  private static buildOBR(data: any): string {
    return `OBR|1|${data.id}||${data.examName}|||||||||||||||||||||${data.doctorId || ''}|||${data.createdAt || ''}||${data.examType || ''}`
  }

  // 构建OBX段
  private static buildOBX(examination: any): string {
    return `OBX|1|ST|${examination.examName}||||${examination.result || ''}||||F|${examination.reportedAt || ''}`
  }

  // 生成消息ID
  private static generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 15)
  }
}

export class HL7Service {
  // 处理接收到的HL7消息
  static async processHL7Message(hl7Message: string, userId: number): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // 验证HL7消息格式
      if (!this.validateHL7Message(hl7Message)) {
        return { success: false, message: 'HL7消息格式无效' }
      }

      // 解析HL7消息
      const parsedMessage = HL7Parser.parse(hl7Message)

      // 获取消息类型
      const messageType = this.getMessageType(parsedMessage)

      // 根据消息类型处理
      let result
      switch (messageType.type) {
        case 'ADT':
          result = await this.processADTMessage(messageType.event, parsedMessage, userId)
          break
        case 'ORM':
          result = await this.processORMMessage(parsedMessage, userId)
          break
        case 'ORU':
          result = await this.processORUMessage(parsedMessage, userId)
          break
        default:
          result = { success: false, message: `不支持的消息类型: ${messageType.type}` }
      }

      // 记录审计日志
      logAudit('HL7_MESSAGE_PROCESSED', userId, {
        messageType: `${messageType.type}_${messageType.event}`,
        messageId: parsedMessage.msh?.msh_10,
        success: result.success
      })

      return result
    } catch (error) {
      console.error('HL7消息处理失败:', error)
      return {
        success: false,
        message: 'HL7消息处理失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 验证HL7消息格式
  private static validateHL7Message(hl7Message: string): boolean {
    const lines = hl7Message.split(/\r?\n/).filter(line => line.trim())

    // 检查是否有MSH段
    if (lines.length === 0 || !lines[0].startsWith('MSH')) {
      return false
    }

    const mshLine = lines[0]
    const fields = mshLine.substring(3).split('|')

    // 检查MSH段的必要字段
    if (fields.length < 12) {
      return false
    }

    // 检查消息类型字段
    if (!fields[8]) {
      return false
    }

    return true
  }

  // 获取消息类型
  private static getMessageType(parsedMessage: HL7Message): { type: string; event: string } {
    const messageType = parsedMessage.msh?.msh_9 || ''
    const [type, event] = messageType.split('^')
    return { type: type || '', event: event || '' }
  }

  // 处理ADT消息（患者管理）
  private static async processADTMessage(event: string, message: HL7Message, userId: number): Promise<{ success: boolean; message: string }> {
    // 这里应该调用相应的服务来处理患者数据
    // 示例实现，实际需要根据具体业务逻辑调整

    switch (event) {
      case 'A01': // 患者入院
        return { success: true, message: '患者入院消息处理成功' }
      case 'A02': // 患者转科
        return { success: true, message: '患者转科消息处理成功' }
      case 'A03': // 患者出院
        return { success: true, message: '患者出院消息处理成功' }
      default:
        return { success: false, message: `不支持的ADT事件: ${event}` }
    }
  }

  // 处理ORM消息（医嘱）
  private static async processORMMessage(message: HL7Message, userId: number): Promise<{ success: boolean; message: string }> {
    // 这里应该调用医嘱服务来处理医嘱数据
    // 示例实现
    return { success: true, message: '医嘱消息处理成功' }
  }

  // 处理ORU消息（检查检验结果）
  private static async processORUMessage(message: HL7Message, userId: number): Promise<{ success: boolean; message: string }> {
    // 这里应该调用检查检验服务来处理结果数据
    // 示例实现
    return { success: true, message: '检查检验结果消息处理成功' }
  }

  // 发送HL7消息
  static async sendHL7Message(hl7Message: string, destination: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // 这里应该实现实际的HL7消息发送逻辑
      // 可以通过TCP、HTTP、WebSocket等方式发送

      // 示例：通过HTTP发送
      const response = await fetch(destination, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-hl7',
          'Authorization': `Bearer ${process.env.HL7_AUTH_TOKEN}`
        },
        body: hl7Message
      })

      if (!response.ok) {
        throw new Error(`发送失败: ${response.status} ${response.statusText}`)
      }

      return { success: true, message: 'HL7消息发送成功' }
    } catch (error) {
      console.error('HL7消息发送失败:', error)
      return {
        success: false,
        message: 'HL7消息发送失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // 生成HL7确认消息
  static generateACK(originalMessage: HL7Message, success: boolean, errorMessage?: string): string {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)
    const messageId = originalMessage.msh?.msh_10 || ''

    const msh = `MSH|^~\\&|EMR|HOSPITAL|${originalMessage.msh?.msh_5 || ''}|${originalMessage.msh?.msh_6 || ''}|${timestamp}||ACK|${messageId}|P|2.5`
    const msa = `MSA|${success ? 'AA' : 'AR'}|${messageId}|${success ? '' : errorMessage || ''}`

    return `${msh}\r${msa}\r`
  }

  // 验证HL7连接
  static async validateHL7Connection(destination: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${destination}/health`, {
        method: 'GET',
        timeout: 5000
      })

      if (response.ok) {
        return { success: true, message: 'HL7连接验证成功' }
      } else {
        return { success: false, message: 'HL7连接验证失败' }
      }
    } catch (error) {
      return { success: false, message: 'HL7连接超时或失败' }
    }
  }

  // 消息队列处理
  static async processMessageQueue(): Promise<void> {
    // 这里应该实现消息队列的逻辑
    // 从队列中获取消息并处理
    console.log('Processing HL7 message queue...')
  }
}