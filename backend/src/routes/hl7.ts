import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { HL7Service, HL7Builder } from '@/services/hl7.service'
import { authenticateApiKey, requireDoctorOrNurse } from '@/middleware/auth'
import { z } from 'zod'

// HL7消息发送schema
const sendHL7MessageSchema = z.object({
  message: z.string().min(1, 'HL7消息不能为空'),
  destination: z.string().url('目标URL格式不正确')
})

// 患者ID schema
const patientIdSchema = z.object({
  patientId: z.number().int().positive('患者ID必须是正整数')
})

// 医嘱ID schema
const medicalOrderIdSchema = z.object({
  medicalOrderId: z.number().int().positive('医嘱ID必须是正整数')
})

// 检查检验ID schema
const examinationIdSchema = z.object({
  examinationId: z.number().int().positive('检查检验ID必须是正整数')
})

// 处理HL7消息
const processHL7Message = async (request: FastifyRequest, reply: FastifyReply) => {
  const { message } = request.body as { message: string }
  const { userId } = request.user!

  try {
    // 解析并验证HL7消息
    if (!HL7Service.validateHL7Message(message)) {
      return reply.code(400).send({
        success: false,
        message: 'HL7消息格式无效'
      })
    }

    // 处理HL7消息
    const result = await HL7Service.processHL7Message(message, userId)

    // 生成ACK消息
    const parsedMessage = HL7Service.validateHL7Message(message) ?
      require('@/services/hl7.service').HL7Parser.parse(message) : null

    const ackMessage = parsedMessage ?
      HL7Service.generateACK(parsedMessage, result.success) : ''

    return reply.send({
      success: result.success,
      message: result.message,
      ackMessage,
      error: result.error
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'HL7消息处理失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 发送HL7消息
const sendHL7Message = async (request: FastifyRequest, reply: FastifyReply) => {
  const { message, destination } = sendHL7MessageSchema.parse(request.body)

  try {
    // 验证HL7消息格式
    if (!HL7Service.validateHL7Message(message)) {
      return reply.code(400).send({
        success: false,
        message: 'HL7消息格式无效'
      })
    }

    // 发送消息
    const result = await HL7Service.sendHL7Message(message, destination)

    return reply.send({
      success: result.success,
      message: result.message,
      error: result.error
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'HL7消息发送失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 生成患者ADT消息
const generatePatientADT = async (request: FastifyRequest, reply: FastifyReply) => {
  const { patientId } = patientIdSchema.parse(request.params)
  const { event = 'A01' } = request.query as { event?: string }

  try {
    // 这里应该获取患者数据，示例中使用模拟数据
    const patient = await getPatientData(patientId)
    if (!patient) {
      return reply.code(404).send({
        success: false,
        message: '患者不存在'
      })
    }

    // 生成ADT消息
    let hl7Message
    switch (event) {
      case 'A01':
        hl7Message = HL7Builder.buildADT_A01(patient)
        break
      case 'A02':
        hl7Message = HL7Builder.buildADT_A02(patient)
        break
      default:
        return reply.code(400).send({
          success: false,
          message: `不支持的ADT事件: ${event}`
        })
    }

    return reply.send({
      success: true,
      message: 'ADT消息生成成功',
      hl7Message,
      patient
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'ADT消息生成失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 生成医嘱ORM消息
const generateMedicalOrderORM = async (request: FastifyRequest, reply: FastifyReply) => {
  const { medicalOrderId } = medicalOrderIdSchema.parse(request.params)

  try {
    // 这里应该获取医嘱数据，示例中使用模拟数据
    const medicalOrder = await getMedicalOrderData(medicalOrderId)
    if (!medicalOrder) {
      return reply.code(404).send({
        success: false,
        message: '医嘱不存在'
      })
    }

    // 生成ORM消息
    const hl7Message = HL7Builder.buildORM_O01(medicalOrder)

    return reply.send({
      success: true,
      message: 'ORM消息生成成功',
      hl7Message,
      medicalOrder
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'ORM消息生成失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 生成检查检验ORU消息
const generateExaminationORU = async (request: FastifyRequest, reply: FastifyReply) => {
  const { examinationId } = examinationIdSchema.parse(request.params)

  try {
    // 这里应该获取检查检验数据，示例中使用模拟数据
    const examination = await getExaminationData(examinationId)
    if (!examination) {
      return reply.code(404).send({
        success: false,
        message: '检查检验不存在'
      })
    }

    // 生成ORU消息
    const hl7Message = HL7Builder.buildORU_R01(examination)

    return reply.send({
      success: true,
      message: 'ORU消息生成成功',
      hl7Message,
      examination
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'ORU消息生成失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 验证HL7连接
const validateHL7Connection = async (request: FastifyRequest, reply: FastifyReply) => {
  const { destination } = request.query as { destination: string }

  if (!destination) {
    return reply.code(400).send({
      success: false,
      message: '目标地址不能为空'
    })
  }

  try {
    const result = await HL7Service.validateHL7Connection(destination)
    return reply.send(result)
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'HL7连接验证失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 处理消息队列
const processMessageQueue = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await HL7Service.processMessageQueue()
    return reply.send({
      success: true,
      message: '消息队列处理完成'
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '消息队列处理失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 批量发送HL7消息
const batchSendHL7Messages = async (request: FastifyRequest, reply: FastifyReply) => {
  const { messages, destination } = request.body as {
    messages: Array<{ type: string; data: any }>
    destination: string
  }

  try {
    const results = []

    for (const msg of messages) {
      let hl7Message

      switch (msg.type) {
        case 'ADT_A01':
          hl7Message = HL7Builder.buildADT_A01(msg.data)
          break
        case 'ORM_O01':
          hl7Message = HL7Builder.buildORM_O01(msg.data)
          break
        case 'ORU_R01':
          hl7Message = HL7Builder.buildORU_R01(msg.data)
          break
        default:
          results.push({
            type: msg.type,
            success: false,
            error: '不支持的消息类型'
          })
          continue
      }

      const sendResult = await HL7Service.sendHL7Message(hl7Message, destination)
      results.push({
        type: msg.type,
        success: sendResult.success,
        message: sendResult.message,
        error: sendResult.error
      })
    }

    return reply.send({
      success: true,
      message: '批量HL7消息发送完成',
      results
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '批量HL7消息发送失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 模拟获取患者数据（实际应该从数据库获取）
async function getPatientData(patientId: number): Promise<any> {
  return {
    id: patientId,
    name: '张三',
    family: '张',
    given: ['三'],
    gender: 'MALE',
    birthDate: '1980-05-15',
    phone: '13800138001',
    address: '北京市朝阳区建国路1号',
    idCard: '110101198005150001',
    status: 'ACTIVE',
    doctorId: 1
  }
}

// 模拟获取医嘱数据（实际应该从数据库获取）
async function getMedicalOrderData(medicalOrderId: number): Promise<any> {
  return {
    id: medicalOrderId,
    patientId: 1,
    examType: 'MEDICATION',
    examName: '阿司匹林',
    content: '阿司匹林肠溶片 100mg 口服 每日一次',
    dosage: '100mg',
    frequency: '每日一次',
    duration: '30天',
    priority: 'NORMAL',
    status: 'PENDING',
    createdAt: '2024-01-10T10:00:00Z',
    doctorId: 1
  }
}

// 模拟获取检查检验数据（实际应该从数据库获取）
async function getExaminationData(examinationId: number): Promise<any> {
  return {
    id: examinationId,
    patientId: 1,
    examType: 'LABORATORY',
    examName: '血常规检查',
    result: '白细胞计数正常，血红蛋白略低',
    status: 'COMPLETED',
    createdAt: '2024-01-10T10:00:00Z',
    reportedAt: '2024-01-10T15:00:00Z',
    doctorId: 1
  }
}

export const hl7Routes = async (fastify: FastifyInstance) => {
  // HL7消息处理接口
  fastify.post('/api/hl7/process', {
    preHandler: requireDoctorOrNurse
  }, processHL7Message)

  fastify.post('/api/hl7/send', {
    preHandler: requireDoctorOrNurse
  }, sendHL7Message)

  // HL7消息生成接口
  fastify.get('/api/hl7/patients/:patientId/adt', {
    preHandler: requireDoctorOrNurse
  }, generatePatientADT)

  fastify.get('/api/hl7/medical-orders/:medicalOrderId/orm', {
    preHandler: requireDoctorOrNurse
  }, generateMedicalOrderORM)

  fastify.get('/api/hl7/examinations/:examinationId/oru', {
    preHandler: requireDoctorOrNurse
  }, generateExaminationORU)

  // 批量操作接口
  fastify.post('/api/hl7/batch-send', {
    preHandler: requireDoctorOrNurse
  }, batchSendHL7Messages)

  fastify.post('/api/hl7/process-queue', {
    preHandler: requireDoctorOrNurse
  }, processMessageQueue)

  // HL7连接验证
  fastify.get('/api/hl7/validate-connection', {
    preHandler: requireDoctorOrNurse
  }, validateHL7Connection)

  // 外部系统接口（API密钥认证）
  fastify.post('/api/hl7/external/process', {
    preHandler: authenticateApiKey
  }, processHL7Message)

  fastify.post('/api/hl7/external/send', {
    preHandler: authenticateApiKey
  }, sendHL7Message)
}