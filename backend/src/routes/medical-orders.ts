import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MedicalOrderService } from '@/services/medical-order.service'
import { authenticate, requireDoctor, requireDoctorOrNurse } from '@/middleware/auth'
import { z } from 'zod'
import { MedicalOrderType, OrderStatus, OrderPriority } from '@prisma/client'

// 医嘱创建schema
const createMedicalOrderSchema = z.object({
  patientId: z.number().int().positive('患者ID必须是正整数'),
  orderType: z.nativeEnum(MedicalOrderType, { errorMap: () => ({ message: '医嘱类型不正确' }) }),
  content: z.string().min(1, '医嘱内容不能为空').max(2000, '医嘱内容最多2000个字符'),
  dosage: z.string().max(200, '剂量最多200个字符').optional(),
  frequency: z.string().max(100, '频率最多100个字符').optional(),
  duration: z.string().max(100, '持续时间最多100个字符').optional(),
  priority: z.nativeEnum(OrderPriority).default(OrderPriority.NORMAL).optional(),
  notes: z.string().max(500, '备注最多500个字符').optional()
})

// 医嘱更新schema
const updateMedicalOrderSchema = z.object({
  content: z.string().min(1, '医嘱内容不能为空').max(2000, '医嘱内容最多2000个字符').optional(),
  dosage: z.string().max(200, '剂量最多200个字符').optional(),
  frequency: z.string().max(100, '频率最多100个字符').optional(),
  duration: z.string().max(100, '持续时间最多100个字符').optional(),
  priority: z.nativeEnum(OrderPriority).optional(),
  notes: z.string().max(500, '备注最多500个字符').optional(),
  status: z.nativeEnum(OrderStatus).optional()
})

// 医嘱查询schema
const medicalOrderQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  patientId: z.string().transform(Number).optional(),
  doctorId: z.string().transform(Number).optional(),
  orderType: z.nativeEnum(MedicalOrderType).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  priority: z.nativeEnum(OrderPriority).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

// 批量操作schema
const batchOperationSchema = z.object({
  orderIds: z.array(z.number().int().positive()).min(1, '请至少选择一个医嘱'),
  notes: z.string().max(500, '备注最多500个字符').optional()
})

// 创建医嘱
const createMedicalOrder = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const orderData = createMedicalOrderSchema.parse(request.body)

  const medicalOrder = await MedicalOrderService.createMedicalOrder(orderData, userId)

  return {
    code: 0,
    message: '医嘱创建成功',
    data: { medicalOrder }
  }
}

// 获取医嘱列表
const getMedicalOrderList = async (request: FastifyRequest, reply: FastifyReply) => {
  const options = medicalOrderQuerySchema.parse(request.query)

  const { startDate, endDate, ...otherOptions } = options

  const dateRange = (startDate || endDate) ? { start: startDate, end: endDate } : undefined

  const result = await MedicalOrderService.getMedicalOrderList({
    ...otherOptions,
    dateRange
  })

  return {
    code: 0,
    message: '获取成功',
    data: result
  }
}

// 获取医嘱详情
const getMedicalOrderById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any
  const orderId = parseInt(id)

  if (isNaN(orderId)) {
    return reply.code(400).send({
      code: -2,
      message: '医嘱ID格式不正确'
    })
  }

  const medicalOrder = await MedicalOrderService.getMedicalOrderById(orderId)

  return {
    code: 0,
    message: '获取成功',
    data: { medicalOrder }
  }
}

// 更新医嘱
const updateMedicalOrder = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any
  const updateData = updateMedicalOrderSchema.parse(request.body)

  const orderId = parseInt(id)
  if (isNaN(orderId)) {
    return reply.code(400).send({
      code: -2,
      message: '医嘱ID格式不正确'
    })
  }

  const medicalOrder = await MedicalOrderService.updateMedicalOrder(orderId, updateData, userId)

  return {
    code: 0,
    message: '更新成功',
    data: { medicalOrder }
  }
}

// 批量执行医嘱
const executeMedicalOrders = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { orderIds, notes } = batchOperationSchema.parse(request.body)

  const result = await MedicalOrderService.executeMedicalOrders(orderIds, userId, notes)

  return {
    code: 0,
    message: `成功执行${result.count}条医嘱`,
    data: result
  }
}

// 批量取消医嘱
const cancelMedicalOrders = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { orderIds, notes } = batchOperationSchema.parse(request.body)

  const result = await MedicalOrderService.cancelMedicalOrders(orderIds, userId, notes)

  return {
    code: 0,
    message: `成功取消${result.count}条医嘱`,
    data: result
  }
}

// 删除医嘱
const deleteMedicalOrder = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any

  const orderId = parseInt(id)
  if (isNaN(orderId)) {
    return reply.code(400).send({
      code: -2,
      message: '医嘱ID格式不正确'
    })
  }

  await MedicalOrderService.deleteMedicalOrder(orderId, userId)

  return {
    code: 0,
    message: '删除成功'
  }
}

// 获取患者当前有效医嘱
const getPatientActiveOrders = async (request: FastifyRequest, reply: FastifyReply) => {
  const { patientId } = request.query as any

  if (!patientId) {
    return reply.code(400).send({
      code: -2,
      message: '患者ID不能为空'
    })
  }

  const orders = await MedicalOrderService.getPatientActiveOrders(parseInt(patientId))

  return {
    code: 0,
    message: '获取成功',
    data: { orders }
  }
}

export const medicalOrderRoutes = async (fastify: FastifyInstance) => {
  // 获取医嘱列表（医生和护士可以查看）
  fastify.get('/', {
    preHandler: [authenticate, requireDoctorOrNurse]
  }, getMedicalOrderList)

  // 创建医嘱（医生可以创建）
  fastify.post('/', {
    preHandler: requireDoctor
  }, createMedicalOrder)

  // 获取患者当前有效医嘱
  fastify.get('/patient/:patientId/active', {
    preHandler: requireDoctorOrNurse
  }, getPatientActiveOrders)

  // 批量执行医嘱（护士可以执行）
  fastify.post('/batch/execute', {
    preHandler: requireDoctorOrNurse
  }, executeMedicalOrders)

  // 批量取消医嘱（医生和护士可以取消）
  fastify.post('/batch/cancel', {
    preHandler: requireDoctorOrNurse
  }, cancelMedicalOrders)

  // 获取医嘱详情
  fastify.get('/:id', {
    preHandler: requireDoctorOrNurse
  }, getMedicalOrderById)

  // 更新医嘱（医生可以更新，护士可以更新执行状态）
  fastify.put('/:id', {
    preHandler: requireDoctorOrNurse
  }, updateMedicalOrder)

  // 删除医嘱（医生可以删除自己创建的医嘱）
  fastify.delete('/:id', {
    preHandler: requireDoctor
  }, deleteMedicalOrder)
}