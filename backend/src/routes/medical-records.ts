import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MedicalRecordService } from '@/services/medical-record.service'
import { requireDoctor, requireAdmin } from '@/middleware/auth'
import { z } from 'zod'
import { MedicalRecordType, MedicalRecordStatus } from '@prisma/client'

// 病历创建schema
const createMedicalRecordSchema = z.object({
  patientId: z.number().int().positive('患者ID必须是正整数'),
  type: z.nativeEnum(MedicalRecordType, { errorMap: () => ({ message: '病历类型不正确' }) }),
  title: z.string().min(1, '病历标题不能为空').max(200, '病历标题最多200个字符'),
  content: z.string().min(1, '病历内容不能为空').max(10000, '病历内容最多10000个字符'),
  diagnosis: z.string().max(2000, '诊断最多2000个字符').optional(),
  treatment: z.string().max(2000, '治疗方案最多2000个字符').optional(),
  prescription: z.string().max(2000, '处方最多2000个字符').optional(),
  attachments: z.array(z.string().url('附件格式不正确')).optional()
})

// 病历更新schema
const updateMedicalRecordSchema = z.object({
  title: z.string().min(1, '病历标题不能为空').max(200, '病历标题最多200个字符').optional(),
  content: z.string().min(1, '病历内容不能为空').max(10000, '病历内容最多10000个字符').optional(),
  diagnosis: z.string().max(2000, '诊断最多2000个字符').optional(),
  treatment: z.string().max(2000, '治疗方案最多2000个字符').optional(),
  prescription: z.string().max(2000, '处方最多2000个字符').optional(),
  attachments: z.array(z.string().url('附件格式不正确')).optional(),
  status: z.nativeEnum(MedicalRecordStatus).optional()
})

// 病历查询schema
const medicalRecordQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  patientId: z.string().transform(Number).optional(),
  doctorId: z.string().transform(Number).optional(),
  type: z.nativeEnum(MedicalRecordType).optional(),
  status: z.nativeEnum(MedicalRecordStatus).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

// 审核schema
const approveMedicalRecordSchema = z.object({
  approved: z.boolean(),
  reason: z.string().max(500, '审核意见最多500个字符').optional()
})

// 创建病历
const createMedicalRecord = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const recordData = createMedicalRecordSchema.parse(request.body)

  const medicalRecord = await MedicalRecordService.createMedicalRecord(recordData, userId)

  return {
    code: 0,
    message: '病历创建成功',
    data: { medicalRecord }
  }
}

// 获取病历列表
const getMedicalRecordList = async (request: FastifyRequest, reply: FastifyReply) => {
  const options = medicalRecordQuerySchema.parse(request.query)

  const { startDate, endDate, ...otherOptions } = options

  const dateRange = (startDate || endDate) ? { start: startDate, end: endDate } : undefined

  const result = await MedicalRecordService.getMedicalRecordList({
    ...otherOptions,
    dateRange
  })

  return {
    code: 0,
    message: '获取成功',
    data: result
  }
}

// 获取病历详情
const getMedicalRecordById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any
  const recordId = parseInt(id)

  if (isNaN(recordId)) {
    return reply.code(400).send({
      code: -2,
      message: '病历ID格式不正确'
    })
  }

  const medicalRecord = await MedicalRecordService.getMedicalRecordById(recordId)

  return {
    code: 0,
    message: '获取成功',
    data: { medicalRecord }
  }
}

// 更新病历
const updateMedicalRecord = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any
  const updateData = updateMedicalRecordSchema.parse(request.body)

  const recordId = parseInt(id)
  if (isNaN(recordId)) {
    return reply.code(400).send({
      code: -2,
      message: '病历ID格式不正确'
    })
  }

  const medicalRecord = await MedicalRecordService.updateMedicalRecord(recordId, updateData, userId)

  return {
    code: 0,
    message: '更新成功',
    data: { medicalRecord }
  }
}

// 提交病历审核
const submitMedicalRecord = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any

  const recordId = parseInt(id)
  if (isNaN(recordId)) {
    return reply.code(400).send({
      code: -2,
      message: '病历ID格式不正确'
    })
  }

  const medicalRecord = await MedicalRecordService.submitMedicalRecord(recordId, userId)

  return {
    code: 0,
    message: '提交成功',
    data: { medicalRecord }
  }
}

// 审核病历
const approveMedicalRecord = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any
  const { approved, reason } = approveMedicalRecordSchema.parse(request.body)

  const recordId = parseInt(id)
  if (isNaN(recordId)) {
    return reply.code(400).send({
      code: -2,
      message: '病历ID格式不正确'
    })
  }

  const medicalRecord = await MedicalRecordService.approveMedicalRecord(recordId, userId, approved, reason)

  return {
    code: 0,
    message: approved ? '审核通过' : '审核拒绝',
    data: { medicalRecord }
  }
}

// 删除病历
const deleteMedicalRecord = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any

  const recordId = parseInt(id)
  if (isNaN(recordId)) {
    return reply.code(400).send({
      code: -2,
      message: '病历ID格式不正确'
    })
  }

  await MedicalRecordService.deleteMedicalRecord(recordId, userId)

  return {
    code: 0,
    message: '删除成功'
  }
}

// 获取病历版本历史
const getMedicalRecordVersions = async (request: FastifyRequest, reply: FastifyReply) => {
  const { patientId, type } = request.query as any

  if (!patientId || !type) {
    return reply.code(400).send({
      code: -2,
      message: '患者ID和病历类型不能为空'
    })
  }

  const versions = await MedicalRecordService.getMedicalRecordVersions(
    parseInt(patientId),
    type as MedicalRecordType
  )

  return {
    code: 0,
    message: '获取成功',
    data: { versions }
  }
}

// 获取病历统计信息
const getMedicalRecordStatistics = async (request: FastifyRequest, reply: FastifyReply) => {
  const { startDate, endDate } = request.query as any

  const statistics = await MedicalRecordService.getMedicalRecordStatistics(startDate, endDate)

  return {
    code: 0,
    message: '获取成功',
    data: { statistics }
  }
}

export const medicalRecordRoutes = async (fastify: FastifyInstance) => {
  // 获取病历列表（医生可以查看）
  fastify.get('/', {
    preHandler: requireDoctor
  }, getMedicalRecordList)

  // 创建病历（医生可以创建）
  fastify.post('/', {
    preHandler: requireDoctor
  }, createMedicalRecord)

  // 获取病历版本历史
  fastify.get('/versions', {
    preHandler: requireDoctor
  }, getMedicalRecordVersions)

  // 获取病历统计信息
  fastify.get('/statistics', {
    preHandler: requireDoctor
  }, getMedicalRecordStatistics)

  // 获取病历详情
  fastify.get('/:id', {
    preHandler: requireDoctor
  }, getMedicalRecordById)

  // 更新病历（医生可以更新自己的病历）
  fastify.put('/:id', {
    preHandler: requireDoctor
  }, updateMedicalRecord)

  // 提交病历审核
  fastify.post('/:id/submit', {
    preHandler: requireDoctor
  }, submitMedicalRecord)

  // 审核病历（管理员可以审核）
  fastify.post('/:id/approve', {
    preHandler: requireAdmin
  }, approveMedicalRecord)

  // 删除病历（医生可以删除自己的病历）
  fastify.delete('/:id', {
    preHandler: requireDoctor
  }, deleteMedicalRecord)
}