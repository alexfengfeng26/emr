import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PatientService } from '@/services/patient.service'
import { requireDoctorOrNurse } from '@/middleware/auth'
import { z } from 'zod'
import { Gender, BloodType, PatientStatus } from '@prisma/client'

// 患者创建schema
const createPatientSchema = z.object({
  name: z.string().min(1, '患者姓名不能为空').max(100, '患者姓名最多100个字符'),
  gender: z.nativeEnum(Gender),
  birthDate: z.string().refine(date => !isNaN(Date.parse(date)), '出生日期格式不正确'),
  idCard: z.string().regex(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, '身份证号格式不正确').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  address: z.string().max(500, '地址最多500个字符').optional(),
  emergencyContact: z.string().max(100, '紧急联系人最多100个字符').optional(),
  emergencyPhone: z.string().regex(/^1[3-9]\d{9}$/, '紧急联系人电话格式不正确').optional(),
  bloodType: z.nativeEnum(BloodType).optional(),
  allergies: z.string().max(1000, '过敏史最多1000个字符').optional(),
  medicalHistory: z.string().max(2000, '病史最多2000个字符').optional()
})

// 患者更新schema
const updatePatientSchema = z.object({
  name: z.string().min(1, '患者姓名不能为空').max(100, '患者姓名最多100个字符').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  address: z.string().max(500, '地址最多500个字符').optional(),
  emergencyContact: z.string().max(100, '紧急联系人最多100个字符').optional(),
  emergencyPhone: z.string().regex(/^1[3-9]\d{9}$/, '紧急联系人电话格式不正确').optional(),
  bloodType: z.nativeEnum(BloodType).optional(),
  allergies: z.string().max(1000, '过敏史最多1000个字符').optional(),
  medicalHistory: z.string().max(2000, '病史最多2000个字符').optional(),
  status: z.nativeEnum(PatientStatus).optional()
})

// 患者查询schema
const patientQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  bloodType: z.nativeEnum(BloodType).optional(),
  status: z.nativeEnum(PatientStatus).optional(),
  minAge: z.string().transform(Number).optional(),
  maxAge: z.string().transform(Number).optional()
})

// 创建患者
const createPatient = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const patientData = createPatientSchema.parse(request.body)

  const patient = await PatientService.createPatient(patientData, userId)

  return {
    code: 0,
    message: '患者创建成功',
    data: { patient }
  }
}

// 获取患者列表
const getPatientList = async (request: FastifyRequest, reply: FastifyReply) => {
  const options = patientQuerySchema.parse(request.query)

  const { minAge, maxAge, ...otherOptions } = options

  const ageRange = minAge || maxAge ? { min: minAge, max: maxAge } : undefined

  const result = await PatientService.getPatientList({
    ...otherOptions,
    ageRange
  })

  return {
    code: 0,
    message: '获取成功',
    data: result
  }
}

// 获取患者详情
const getPatientById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any
  const patientId = parseInt(id)

  if (isNaN(patientId)) {
    return reply.code(400).send({
      code: -2,
      message: '患者ID格式不正确'
    })
  }

  const patient = await PatientService.getPatientById(patientId)

  return {
    code: 0,
    message: '获取成功',
    data: { patient }
  }
}

// 更新患者信息
const updatePatient = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any
  const updateData = updatePatientSchema.parse(request.body)

  const patientId = parseInt(id)
  if (isNaN(patientId)) {
    return reply.code(400).send({
      code: -2,
      message: '患者ID格式不正确'
    })
  }

  const patient = await PatientService.updatePatient(patientId, updateData, userId)

  return {
    code: 0,
    message: '更新成功',
    data: { patient }
  }
}

// 删除患者
const deletePatient = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user!
  const { id } = request.params as any

  const patientId = parseInt(id)
  if (isNaN(patientId)) {
    return reply.code(400).send({
      code: -2,
      message: '患者ID格式不正确'
    })
  }

  await PatientService.deletePatient(patientId, userId)

  return {
    code: 0,
    message: '删除成功'
  }
}

// 根据身份证号查找患者
const findPatientByIdCard = async (request: FastifyRequest, reply: FastifyReply) => {
  const { idCard } = request.query as any

  if (!idCard) {
    return reply.code(400).send({
      code: -2,
      message: '身份证号不能为空'
    })
  }

  const patient = await PatientService.findPatientByIdCard(idCard)

  return {
    code: 0,
    message: '查询成功',
    data: { patient }
  }
}

export const patientRoutes = async (fastify: FastifyInstance) => {
  // 获取患者列表（医生和护士可以查看）
  fastify.get('/', {
    preHandler: requireDoctorOrNurse
  }, getPatientList)

  // 创建患者（医生和护士可以创建）
  fastify.post('/', {
    preHandler: requireDoctorOrNurse
  }, createPatient)

  // 根据身份证号查找患者
  fastify.get('/search/id-card', {
    preHandler: requireDoctorOrNurse
  }, findPatientByIdCard)

  // 获取患者详情
  fastify.get('/:id', {
    preHandler: requireDoctorOrNurse
  }, getPatientById)

  // 更新患者信息（医生和护士可以更新）
  fastify.put('/:id', {
    preHandler: requireDoctorOrNurse
  }, updatePatient)

  // 删除患者（医生和护士可以删除）
  fastify.delete('/:id', {
    preHandler: requireDoctorOrNurse
  }, deletePatient)
}