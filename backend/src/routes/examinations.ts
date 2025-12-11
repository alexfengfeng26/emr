import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ExaminationService } from '@/services/examination.service'
import { requireDoctor, requireDoctorOrNurse } from '@/middleware/auth'
import { z } from 'zod'
import { ExaminationType, ExaminationStatus } from '@prisma/client'

// 检查检验创建schema
const createExaminationSchema = z.object({
  patientId: z.number().int().positive('患者ID必须是正整数'),
  examType: z.nativeEnum(ExaminationType, { errorMap: () => ({ message: '检查类型不正确' }) }),
  examName: z.string().min(1, '检查名称不能为空').max(200, '检查名称最多200个字符'),
  description: z.string().max(1000, '检查描述最多1000个字符').optional(),
  notes: z.string().max(500, '备注最多500个字符').optional()
})

// 检查检验更新schema
const updateExaminationSchema = z.object({
  description: z.string().max(1000, '检查描述最多1000个字符').optional(),
  result: z.string().max(2000, '检查结果最多2000个字符').optional(),
  reportUrl: z.string().url('报告链接格式不正确').optional(),
  images: z.array(z.string().url('图片链接格式不正确')).optional(),
  status: z.nativeEnum(ExaminationStatus).optional()
})

// 检查检验查询schema
const examinationQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  patientId: z.string().transform(Number).optional(),
  examType: z.nativeEnum(ExaminationType).optional(),
  status: z.nativeEnum(ExaminationStatus).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

// 状态更新schema
const updateStatusSchema = z.object({
  status: z.nativeEnum(ExaminationStatus),
  notes: z.string().max(500, '备注最多500个字符').optional()
})

// 批量操作schema
const batchOperationSchema = z.object({
  examinationIds: z.array(z.number().int().positive()).min(1, '请至少选择一个检查检验'),
  status: z.nativeEnum(ExaminationStatus),
  notes: z.string().max(500, '备注最多500个字符').optional()
})

// 创建检查检验
const createExamination = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const examData = createExaminationSchema.parse(request.body)

  const examination = await ExaminationService.createExamination(examData, userId)

  return {
    code: 0,
    message: '检查检验申请创建成功',
    data: { examination }
  }
}

// 获取检查检验列表
const getExaminationList = async (request: FastifyRequest, reply: FastifyReply) => {
  const options = examinationQuerySchema.parse(request.query)

  const { startDate, endDate, ...otherOptions } = options

  const dateRange = (startDate || endDate) ? { start: startDate, end: endDate } : undefined

  const result = await ExaminationService.getExaminationList({
    ...otherOptions,
    dateRange
  })

  return {
    code: 0,
    message: '获取成功',
    data: result
  }
}

// 获取检查检验详情
const getExaminationById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any
  const examinationId = parseInt(id)

  if (isNaN(examinationId)) {
    return reply.code(400).send({
      code: -2,
      message: '检查检验ID格式不正确'
    })
  }

  const examination = await ExaminationService.getExaminationById(examinationId)

  return {
    code: 0,
    message: '获取成功',
    data: { examination }
  }
}

// 更新检查检验
const updateExamination = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any
  const updateData = updateExaminationSchema.parse(request.body)

  const examinationId = parseInt(id)
  if (isNaN(examinationId)) {
    return reply.code(400).send({
      code: -2,
      message: '检查检验ID格式不正确'
    })
  }

  const examination = await ExaminationService.updateExamination(examinationId, updateData, userId)

  return {
    code: 0,
    message: '更新成功',
    data: { examination }
  }
}

// 更新检查检验状态
const updateExaminationStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any
  const { status, notes } = updateStatusSchema.parse(request.body)

  const examinationId = parseInt(id)
  if (isNaN(examinationId)) {
    return reply.code(400).send({
      code: -2,
      message: '检查检验ID格式不正确'
    })
  }

  const examination = await ExaminationService.updateExaminationStatus(examinationId, status, userId, notes)

  return {
    code: 0,
    message: '状态更新成功',
    data: { examination }
  }
}

// 批量更新状态
const batchUpdateStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { examinationIds, status, notes } = batchOperationSchema.parse(request.body)

  const result = await ExaminationService.batchUpdateStatus(examinationIds, status, userId, notes)

  return {
    code: 0,
    message: `成功更新${result.count}条检查检验状态`,
    data: result
  }
}

// 删除检查检验
const deleteExamination = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any

  const examinationId = parseInt(id)
  if (isNaN(examinationId)) {
    return reply.code(400).send({
      code: -2,
      message: '检查检验ID格式不正确'
    })
  }

  await ExaminationService.deleteExamination(examinationId, userId)

  return {
    code: 0,
    message: '删除成功'
  }
}

// 获取患者检查检验历史
const getPatientExaminationHistory = async (request: FastifyRequest, reply: FastifyReply) => {
  const { patientId, examType } = request.query as any

  if (!patientId) {
    return reply.code(400).send({
      code: -2,
      message: '患者ID不能为空'
    })
  }

  const examinations = await ExaminationService.getPatientExaminationHistory(
    parseInt(patientId),
    examType as ExaminationType
  )

  return {
    code: 0,
    message: '获取成功',
    data: { examinations }
  }
}

// 获取检查检验统计
const getExaminationStatistics = async (request: FastifyRequest, reply: FastifyReply) => {
  const { startDate, endDate } = request.query as any

  const statistics = await ExaminationService.getExaminationStatistics(startDate, endDate)

  return {
    code: 0,
    message: '获取成功',
    data: { statistics }
  }
}

export const examinationRoutes = async (fastify: FastifyInstance) => {
  // 获取检查检验列表（医生和护士可以查看）
  fastify.get('/', {
    preHandler: requireDoctorOrNurse
  }, getExaminationList)

  // 创建检查检验（医生可以创建）
  fastify.post('/', {
    preHandler: requireDoctor
  }, createExamination)

  // 获取患者检查检验历史
  fastify.get('/patient/history', {
    preHandler: requireDoctorOrNurse
  }, getPatientExaminationHistory)

  // 获取检查检验统计
  fastify.get('/statistics', {
    preHandler: requireDoctorOrNurse
  }, getExaminationStatistics)

  // 批量更新状态
  fastify.post('/batch/status', {
    preHandler: requireDoctorOrNurse
  }, batchUpdateStatus)

  // 获取检查检验详情
  fastify.get('/:id', {
    preHandler: requireDoctorOrNurse
  }, getExaminationById)

  // 更新检查检验
  fastify.put('/:id', {
    preHandler: requireDoctorOrNurse
  }, updateExamination)

  // 更新检查检验状态
  fastify.patch('/:id/status', {
    preHandler: requireDoctorOrNurse
  }, updateExaminationStatus)

  // 删除检查检验
  fastify.delete('/:id', {
    preHandler: requireDoctor
  }, deleteExamination)
}