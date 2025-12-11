import { prisma } from '@/utils/prisma'
import { ValidationError, NotFoundError, ConflictError } from '@/middleware/error-handler'
import { Gender, BloodType, PatientStatus } from '@prisma/client'
import { logAudit } from '@/utils/logger'
import dayjs from 'dayjs'

export class PatientService {
  // 创建患者
  static async createPatient(patientData: {
    name: string
    gender: Gender
    birthDate: string
    idCard?: string
    phone?: string
    address?: string
    emergencyContact?: string
    emergencyPhone?: string
    bloodType?: BloodType
    allergies?: string
    medicalHistory?: string
  }, doctorId: number) {
    const { name, gender, birthDate, idCard, phone, address, emergencyContact, emergencyPhone, bloodType, allergies, medicalHistory } = patientData

    // 验证身份证号格式
    if (idCard && !this.validateIdCard(idCard)) {
      throw new ValidationError('身份证号格式不正确')
    }

    // 验证手机号格式
    if (phone && !this.validatePhone(phone)) {
      throw new ValidationError('手机号格式不正确')
    }

    // 检查身份证号是否已存在
    if (idCard) {
      const existingPatient = await prisma.patient.findUnique({
        where: { idCard }
      })
      if (existingPatient) {
        throw new ConflictError('该身份证号已存在')
      }
    }

    // 验证出生日期
    if (!dayjs(birthDate).isValid()) {
      throw new ValidationError('出生日期格式不正确')
    }

    // 创建患者
    const patient = await prisma.patient.create({
      data: {
        name,
        gender,
        birthDate: new Date(birthDate),
        idCard,
        phone,
        address,
        emergencyContact,
        emergencyPhone,
        bloodType,
        allergies,
        medicalHistory,
        status: PatientStatus.ACTIVE
      }
    })

    // 记录审计日志
    logAudit('CREATE_PATIENT', doctorId, {
      patientId: patient.id,
      patientName: name,
      gender,
      birthDate
    })

    return patient
  }

  // 更新患者信息
  static async updatePatient(patientId: number, updateData: Partial<{
    name: string
    phone: string
    address: string
    emergencyContact: string
    emergencyPhone: string
    bloodType: BloodType
    allergies: string
    medicalHistory: string
    status: PatientStatus
  }>, doctorId: number) {
    // 检查患者是否存在
    const existingPatient = await prisma.patient.findUnique({
      where: { id: patientId }
    })

    if (!existingPatient) {
      throw new NotFoundError('患者不存在')
    }

    // 验证手机号格式
    if (updateData.phone && !this.validatePhone(updateData.phone)) {
      throw new ValidationError('手机号格式不正确')
    }

    // 更新患者信息
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData
    })

    // 记录审计日志
    logAudit('UPDATE_PATIENT', doctorId, {
      patientId,
      patientName: existingPatient.name,
      updatedFields: Object.keys(updateData)
    })

    return updatedPatient
  }

  // 获取患者列表
  static async getPatientList(options: {
    page?: number
    limit?: number
    search?: string
    gender?: Gender
    bloodType?: BloodType
    status?: PatientStatus
    ageRange?: { min?: number; max?: number }
  }) {
    const { page = 1, limit = 20, search, gender, bloodType, status, ageRange } = options
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { idCard: { contains: search } }
      ]
    }

    if (gender) where.gender = gender
    if (bloodType) where.bloodType = bloodType
    if (status) where.status = status

    // 年龄范围查询
    if (ageRange) {
      const now = new Date()
      const minDate = ageRange.max ? new Date(now.getFullYear() - ageRange.max, now.getMonth(), now.getDate()) : undefined
      const maxDate = ageRange.min ? new Date(now.getFullYear() - ageRange.min, now.getMonth(), now.getDate()) : undefined

      if (minDate || maxDate) {
        where.birthDate = {}
        if (minDate) where.birthDate.gte = minDate
        if (maxDate) where.birthDate.lte = maxDate
      }
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          gender: true,
          birthDate: true,
          phone: true,
          idCard: true,
          bloodType: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.patient.count({ where })
    ])

    // 计算年龄
    const patientsWithAge = patients.map(patient => ({
      ...patient,
      age: this.calculateAge(patient.birthDate)
    }))

    return {
      patients: patientsWithAge,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // 获取患者详情
  static async getPatientById(patientId: number) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        medicalRecords: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            title: true,
            diagnosis: true,
            status: true,
            createdAt: true,
            doctor: {
              select: {
                id: true,
                name: true,
                department: true
              }
            }
          }
        },
        medicalOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderType: true,
            content: true,
            status: true,
            priority: true,
            createdAt: true,
            doctor: {
              select: {
                id: true,
                name: true,
                department: true
              }
            }
          }
        },
        examinations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            examType: true,
            examName: true,
            status: true,
            requestedAt: true,
            reportedAt: true
          }
        },
        _count: {
          select: {
            medicalRecords: true,
            medicalOrders: true,
            examinations: true
          }
        }
      }
    })

    if (!patient) {
      throw new NotFoundError('患者不存在')
    }

    // 计算年龄
    const patientWithAge = {
      ...patient,
      age: this.calculateAge(patient.birthDate)
    }

    return patientWithAge
  }

  // 删除患者（软删除）
  static async deletePatient(patientId: number, doctorId: number) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { name: true, status: true }
    })

    if (!patient) {
      throw new NotFoundError('患者不存在')
    }

    if (patient.status !== PatientStatus.ACTIVE) {
      throw new ValidationError('只能删除活跃状态的患者')
    }

    // 软删除：更新状态为已出院
    await prisma.patient.update({
      where: { id: patientId },
      data: { status: PatientStatus.DISCHARGED }
    })

    // 记录审计日志
    logAudit('DELETE_PATIENT', doctorId, {
      patientId,
      patientName: patient.name
    })

    return true
  }

  // 根据身份证号查找患者
  static async findPatientByIdCard(idCard: string) {
    if (!this.validateIdCard(idCard)) {
      throw new ValidationError('身份证号格式不正确')
    }

    const patient = await prisma.patient.findUnique({
      where: { idCard },
      select: {
        id: true,
        name: true,
        gender: true,
        birthDate: true,
        phone: true,
        status: true
      }
    })

    return patient
  }

  // 验证身份证号
  private static validateIdCard(idCard: string): boolean {
    // 简单的身份证号格式验证
    const regex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
    return regex.test(idCard)
  }

  // 验证手机号
  private static validatePhone(phone: string): boolean {
    const regex = /^1[3-9]\d{9}$/
    return regex.test(phone)
  }

  // 计算年龄
  private static calculateAge(birthDate: Date): number {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }
}