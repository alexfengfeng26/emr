import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { HISInterfaceService, HISMessageType } from '@/services/his.service'
import { requireAdmin, requireDoctorOrNurse } from '@/middleware/auth'
import { z } from 'zod'

// HIS系统注册schema
const hisRegisterSchema = z.object({
  name: z.string().min(1, 'HIS系统名称不能为空'),
  config: z.object({
    baseUrl: z.string().url('无效的URL格式'),
    apiKey: z.string().optional(),
    timeout: z.number().min(1000, '超时时间至少1秒').max(60000, '超时时间不能超过60秒'),
    retryAttempts: z.number().min(1, '重试次数至少1次').max(10, '重试次数不能超过10次'),
    retryDelay: z.number().min(100, '重试延迟至少100毫秒').max(10000, '重试延迟不能超过10秒'),
    authType: z.enum(['none', 'api-key', 'oauth2']),
    oauth2: z.object({
      tokenUrl: z.string().url('无效的Token URL'),
      clientId: z.string().min(1, '客户端ID不能为空'),
      clientSecret: z.string().min(1, '客户端密钥不能为空'),
      scope: z.string().min(1, '作用域不能为空')
    }).optional()
  })
})

// 消息发送schema
const messageSchema = z.object({
  messageId: z.string().optional(),
  messageType: z.nativeEnum(HISMessageType),
  data: z.any()
})

// 患者数据同步schema
const patientSyncSchema = z.object({
  externalId: z.string().optional(),
  name: z.string().min(1, '患者姓名不能为空'),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']),
  birthDate: z.string(),
  phone: z.string().optional(),
  idCard: z.string().optional(),
  address: z.string().optional()
})

// 病历数据同步schema
const medicalRecordSyncSchema = z.object({
  externalId: z.string().optional(),
  patientId: z.number().min(1, '患者ID不能为空'),
  type: z.string().min(1, '病历类型不能为空'),
  content: z.string().min(1, '病历内容不能为空'),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  createdAt: z.string().optional()
})

// 医嘱数据schema
const medicalOrderSchema = z.object({
  externalId: z.string().optional(),
  patientId: z.number().min(1, '患者ID不能为空'),
  orderType: z.string().min(1, '医嘱类型不能为空'),
  content: z.string().min(1, '医嘱内容不能为空'),
  status: z.string().optional(),
  createdAt: z.string().optional()
})

// 查询参数schema
const queryParamsSchema = z.object({
  patientId: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  examType: z.string().optional(),
  status: z.string().optional()
})

// 计费信息schema
const billingSchema = z.object({
  billId: z.string().optional(),
  patientId: z.number().min(1, '患者ID不能为空'),
  amount: z.number().min(0, '金额不能为负数'),
  items: z.array(z.any()).optional(),
  status: z.string().optional()
})

// 预约信息schema
const appointmentSchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.number().min(1, '患者ID不能为空'),
  doctorId: z.number().optional(),
  department: z.string().optional(),
  appointmentTime: z.string(),
  status: z.string().optional()
})

// 通知信息schema
const notificationSchema = z.object({
  notificationId: z.string().optional(),
  type: z.string().min(1, '通知类型不能为空'),
  title: z.string().min(1, '通知标题不能为空'),
  content: z.string().min(1, '通知内容不能为空'),
  recipients: z.array(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
})

// 批量消息schema
const batchMessageSchema = z.object({
  messages: z.array(messageSchema).min(1, '消息列表不能为空')
})

// 注册HIS系统
const registerHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { name, config } = hisRegisterSchema.parse(request.body)
  const { userId } = request.user!

  try {
    HISInterfaceService.registerHIS(name, config)

    return reply.send({
      success: true,
      message: 'HIS系统注册成功',
      data: {
        hisSystem: name,
        authType: config.authType,
        baseUrl: config.baseUrl
      }
    })
  } catch (error) {
    return reply.code(400).send({
      success: false,
      message: 'HIS系统注册失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 获取所有已注册的HIS系统
const getRegisteredHISystems = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const hisSystems = HISInterfaceService.getRegisteredHISystems()

    return reply.send({
      success: true,
      message: '获取HIS系统列表成功',
      data: {
        count: hisSystems.length,
        systems: hisSystems
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '获取HIS系统列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 测试HIS系统连接
const testHISConnection = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }

  try {
    const result = await HISInterfaceService.testHISConnection(hisName)

    return reply.send({
      success: true,
      message: 'HIS系统连接测试完成',
      data: result
    })
  } catch (error) {
    return reply.code(400).send({
      success: false,
      message: 'HIS系统连接测试失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 发送消息到HIS系统
const sendMessageToHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }
  const message = messageSchema.parse(request.body)

  try {
    const response = await HISInterfaceService.sendMessage(hisName, message)

    return reply.send({
      success: true,
      message: '消息发送成功',
      data: response
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '消息发送失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 同步患者信息到HIS系统
const syncPatientToHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }
  const patientData = patientSyncSchema.parse(request.body)

  try {
    const response = await HISInterfaceService.syncPatientToHIS(hisName, patientData)

    return reply.send({
      success: true,
      message: '患者信息同步成功',
      data: response
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '患者信息同步失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 同步病历到HIS系统
const syncMedicalRecordToHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }
  const recordData = medicalRecordSyncSchema.parse(request.body)

  try {
    const response = await HISInterfaceService.syncMedicalRecordToHIS(hisName, recordData)

    return reply.send({
      success: true,
      message: '病历同步成功',
      data: response
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '病历同步失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 发送医嘱到HIS系统
const sendMedicalOrderToHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }
  const orderData = medicalOrderSchema.parse(request.body)

  try {
    const response = await HISInterfaceService.sendMedicalOrderToHIS(hisName, orderData)

    return reply.send({
      success: true,
      message: '医嘱发送成功',
      data: response
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '医嘱发送失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 查询检查检验结果
const queryExaminationResultFromHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }
  const queryParams = queryParamsSchema.parse(request.body)

  try {
    const response = await HISInterfaceService.queryExaminationResultFromHIS(hisName, queryParams)

    return reply.send({
      success: true,
      message: '检查检验结果查询成功',
      data: response
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '检查检验结果查询失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 发送计费信息到HIS系统
const sendBillingToHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }
  const billingData = billingSchema.parse(request.body)

  try {
    const response = await HISInterfaceService.sendBillingToHIS(hisName, billingData)

    return reply.send({
      success: true,
      message: '计费信息发送成功',
      data: response
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '计费信息发送失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 发送预约信息到HIS系统
const sendAppointmentToHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }
  const appointmentData = appointmentSchema.parse(request.body)

  try {
    const response = await HISInterfaceService.sendAppointmentToHIS(hisName, appointmentData)

    return reply.send({
      success: true,
      message: '预约信息发送成功',
      data: response
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '预约信息发送失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 发送通知到HIS系统
const sendNotificationToHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }
  const notificationData = notificationSchema.parse(request.body)

  try {
    const response = await HISInterfaceService.sendNotificationToHIS(hisName, notificationData)

    return reply.send({
      success: true,
      message: '通知发送成功',
      data: response
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '通知发送失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 批量同步到HIS系统
const batchSyncToHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }
  const { messages } = batchMessageSchema.parse(request.body)

  try {
    const responses = await HISInterfaceService.batchSyncToHIS(hisName, messages)

    return reply.send({
      success: true,
      message: '批量同步完成',
      data: {
        total: messages.length,
        responses
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: '批量同步失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 获取HIS系统状态
const getHISStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }

  try {
    const status = await HISInterfaceService.getHISStatus(hisName)

    return reply.send({
      success: true,
      message: 'HIS系统状态获取成功',
      data: status
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'HIS系统状态获取失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 注销HIS系统
const unregisterHIS = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hisName } = request.params as { hisName: string }

  try {
    HISInterfaceService.unregisterHIS(hisName)

    return reply.send({
      success: true,
      message: 'HIS系统注销成功',
      data: {
        hisSystem: hisName
      }
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'HIS系统注销失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

export const hisRoutes = async (fastify: FastifyInstance) => {
  // HIS系统管理路由（需要管理员权限）
  fastify.post('/api/his/register', {
    preHandler: requireAdmin
  }, registerHIS)

  fastify.get('/api/his/systems', {
    preHandler: requireAdmin
  }, getRegisteredHISystems)

  fastify.delete('/api/his/:hisName', {
    preHandler: requireAdmin
  }, unregisterHIS)

  // HIS系统连接测试
  fastify.get('/api/his/:hisName/test', {
    preHandler: requireAdmin
  }, testHISConnection)

  fastify.get('/api/his/:hisName/status', getHISStatus)

  // 通用消息发送
  fastify.post('/api/his/:hisName/message', sendMessageToHIS)

  // 患者信息同步
  fastify.post('/api/his/:hisName/sync/patient', syncPatientToHIS)

  // 病历同步
  fastify.post('/api/his/:hisName/sync/medical-record', {
    preHandler: requireDoctorOrNurse
  }, syncMedicalRecordToHIS)

  // 医嘱发送
  fastify.post('/api/his/:hisName/orders', {
    preHandler: requireDoctorOrNurse
  }, sendMedicalOrderToHIS)

  // 检查检验结果查询
  fastify.post('/api/his/:hisName/examinations', {
    preHandler: requireDoctorOrNurse
  }, queryExaminationResultFromHIS)

  // 计费信息发送
  fastify.post('/api/his/:hisName/billing', sendBillingToHIS)

  // 预约信息发送
  fastify.post('/api/his/:hisName/appointments', sendAppointmentToHIS)

  // 通知发送
  fastify.post('/api/his/:hisName/notifications', sendNotificationToHIS)

  // 批量操作
  fastify.post('/api/his/:hisName/batch', {
    preHandler: requireAdmin
  }, batchSyncToHIS)

  // 接收HIS系统消息（回调接口）
  fastify.post('/api/his/webhook/:hisName', async (request: FastifyRequest, reply: FastifyReply) => {
    const { hisName } = request.params as { hisName: string }
    const message = request.body

    try {
      const response = await HISInterfaceService.receiveMessage(message as any)

      return reply.send({
        success: true,
        message: 'HIS消息接收成功',
        data: response
      })
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'HIS消息接收失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  })
}