import { prisma } from '@/utils/prisma'
import { ValidationError, NotFoundError, ForbiddenError } from '@/middleware/error-handler'
import { MedicalRecordType, MedicalRecordStatus } from '@prisma/client'
import { logAudit } from '@/utils/logger'

export class MedicalRecordService {
  // 创建病历
  static async createMedicalRecord(recordData: {
    patientId: number
    type: MedicalRecordType
    title: string
    content: string
    diagnosis?: string
    treatment?: string
    prescription?: string
    attachments?: string[]
  }, doctorId: number) {
    const { patientId, type, title, content, diagnosis, treatment, prescription, attachments } = recordData

    // 检查患者是否存在
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, name: true, status: true }
    })

    if (!patient) {
      throw new NotFoundError('患者不存在')
    }

    // 检查患者状态
    if (patient.status !== 'ACTIVE') {
      throw new ValidationError('只能为活跃患者创建病历')
    }

    // 检查医生权限
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, name: true, role: true }
    })

    if (!doctor) {
      throw new NotFoundError('医生不存在')
    }

    // 生成版本号
    const latestVersion = await prisma.medicalRecord.findFirst({
      where: { patientId, type },
      orderBy: { version: 'desc' },
      select: { version: true }
    })

    const newVersion = (latestVersion?.version || 0) + 1

    // 创建病历
    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId,
        type,
        title,
        content,
        diagnosis,
        treatment,
        prescription,
        attachments: attachments ? JSON.stringify(attachments) : null,
        version: newVersion,
        status: MedicalRecordStatus.DRAFT
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthDate: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      }
    })

    // 记录审计日志
    logAudit('CREATE_MEDICAL_RECORD', doctorId, {
      patientId,
      patientName: patient.name,
      recordType: type,
      recordId: medicalRecord.id,
      version: newVersion
    })

    return medicalRecord
  }

  // 更新病历
  static async updateMedicalRecord(recordId: number, updateData: {
    title?: string
    content?: string
    diagnosis?: string
    treatment?: string
    prescription?: string
    attachments?: string[]
    status?: MedicalRecordStatus
  }, doctorId: number) {
    // 检查病历是否存在
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        status: true,
        type: true,
        patient: {
          select: {
            name: true
          }
        }
      }
    })

    if (!existingRecord) {
      throw new NotFoundError('病历不存在')
    }

    // 检查权限（只能修改自己创建的病历）
    if (existingRecord.doctorId !== doctorId) {
      throw new ForbiddenError('只能修改自己创建的病历')
    }

    // 检查病历状态
    if (existingRecord.status === MedicalRecordStatus.APPROVED) {
      throw new ValidationError('已审核的病历不能修改')
    }

    // 更新数据
    const updateFields: any = { ...updateData }

    if (updateData.attachments) {
      updateFields.attachments = JSON.stringify(updateData.attachments)
    }

    // 如果状态改为已提交，记录提交时间
    if (updateData.status === MedicalRecordStatus.SUBMITTED && existingRecord.status !== MedicalRecordStatus.SUBMITTED) {
      updateFields.submittedAt = new Date()
    }

    const updatedRecord = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: updateFields,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthDate: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      }
    })

    // 记录审计日志
    logAudit('UPDATE_MEDICAL_RECORD', doctorId, {
      patientId: existingRecord.patientId,
      patientName: existingRecord.patient.name,
      recordId,
      recordType: existingRecord.type,
      updatedFields: Object.keys(updateData)
    })

    return updatedRecord
  }

  // 获取病历列表
  static async getMedicalRecordList(options: {
    page?: number
    limit?: number
    patientId?: number
    doctorId?: number
    type?: MedicalRecordType
    status?: MedicalRecordStatus
    search?: string
    dateRange?: { start?: string; end?: string }
  }) {
    const { page = 1, limit = 20, patientId, doctorId, type, status, search, dateRange } = options
    const skip = (page - 1) * limit

    const where: any = {}

    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId
    if (type) where.type = type
    if (status) where.status = status

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { diagnosis: { contains: search } },
        { patient: { name: { contains: search } } }
      ]
    }

    // 日期范围查询
    if (dateRange?.start || dateRange?.end) {
      where.createdAt = {}
      if (dateRange.start) where.createdAt.gte = new Date(dateRange.start)
      if (dateRange.end) where.createdAt.lte = new Date(dateRange.end + ' 23:59:59')
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              gender: true,
              birthDate: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              department: true
            }
          }
        }
      }),
      prisma.medicalRecord.count({ where })
    ])

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // 获取病历详情
  static async getMedicalRecordById(recordId: number) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthDate: true,
            phone: true,
            bloodType: true,
            allergies: true,
            medicalHistory: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            department: true,
            phone: true
          }
        }
      }
    })

    if (!record) {
      throw new NotFoundError('病历不存在')
    }

    // 解析附件信息
    let attachments = null
    if (record.attachments) {
      try {
        attachments = JSON.parse(record.attachments)
      } catch (error) {
        console.error('Failed to parse attachments:', error)
      }
    }

    return {
      ...record,
      attachments
    }
  }

  // 提交病历审核
  static async submitMedicalRecord(recordId: number, doctorId: number) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        doctorId: true,
        status: true,
        patientId: true,
        patient: {
          select: { name: true }
        }
      }
    })

    if (!record) {
      throw new NotFoundError('病历不存在')
    }

    if (record.doctorId !== doctorId) {
      throw new ForbiddenError('只能提交自己创建的病历')
    }

    if (record.status !== MedicalRecordStatus.DRAFT) {
      throw new ValidationError('只能提交草稿状态的病历')
    }

    const updatedRecord = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        status: MedicalRecordStatus.SUBMITTED,
        submittedAt: new Date()
      }
    })

    // 记录审计日志
    logAudit('SUBMIT_MEDICAL_RECORD', doctorId, {
      patientId: record.patientId,
      patientName: record.patient.name,
      recordId
    })

    return updatedRecord
  }

  // 审核病历
  static async approveMedicalRecord(recordId: number, adminId: number, approved: boolean, reason?: string) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        status: true,
        patientId: true,
        doctorId: true,
        patient: {
          select: { name: true }
        }
      }
    })

    if (!record) {
      throw new NotFoundError('病历不存在')
    }

    if (record.status !== MedicalRecordStatus.SUBMITTED) {
      throw new ValidationError('只能审核已提交的病历')
    }

    const status = approved ? MedicalRecordStatus.APPROVED : MedicalRecordStatus.REJECTED

    const updatedRecord = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        status,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: !approved ? reason : null
      }
    })

    // 记录审计日志
    logAudit('APPROVE_MEDICAL_RECORD', adminId, {
      patientId: record.patientId,
      patientName: record.patient.name,
      recordId,
      approved,
      reason
    })

    return updatedRecord
  }

  // 删除病历
  static async deleteMedicalRecord(recordId: number, doctorId: number) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: {
        id: true,
        doctorId: true,
        status: true,
        patientId: true,
        patient: {
          select: { name: true }
        }
      }
    })

    if (!record) {
      throw new NotFoundError('病历不存在')
    }

    if (record.doctorId !== doctorId) {
      throw new ForbiddenError('只能删除自己创建的病历')
    }

    if (record.status === MedicalRecordStatus.APPROVED) {
      throw new ValidationError('已审核的病历不能删除')
    }

    await prisma.medicalRecord.delete({
      where: { id: recordId }
    })

    // 记录审计日志
    logAudit('DELETE_MEDICAL_RECORD', doctorId, {
      patientId: record.patientId,
      patientName: record.patient.name,
      recordId
    })

    return true
  }

  // 获取病历版本历史
  static async getMedicalRecordVersions(patientId: number, type: MedicalRecordType) {
    const versions = await prisma.medicalRecord.findMany({
      where: {
        patientId,
        type
      },
      select: {
        id: true,
        version: true,
        title: true,
        status: true,
        createdAt: true,
        doctor: {
          select: {
            name: true
          }
        }
      },
      orderBy: { version: 'desc' }
    })

    return versions
  }

  // 获取病历统计信息
  static async getMedicalRecordStatistics(startDate?: string, endDate?: string) {
    const where: any = {}

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [
      totalRecords,
      draftRecords,
      submittedRecords,
      approvedRecords,
      typeStats,
      recentRecords
    ] = await Promise.all([
      // 总病历数
      prisma.medicalRecord.count({ where }),

      // 草稿病历数
      prisma.medicalRecord.count({
        where: {
          ...where,
          status: 'DRAFT'
        }
      }),

      // 已提交病历数
      prisma.medicalRecord.count({
        where: {
          ...where,
          status: 'SUBMITTED'
        }
      }),

      // 已审核病历数
      prisma.medicalRecord.count({
        where: {
          ...where,
          status: 'APPROVED'
        }
      }),

      // 病历类型统计
      prisma.medicalRecord.groupBy({
        by: ['type'],
        where,
        _count: true
      }),

      // 最近7天新增病历
      prisma.medicalRecord.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return {
      totalRecords,
      draftRecords,
      submittedRecords,
      approvedRecords,
      recentRecords,
      typeStats: typeStats.reduce((acc, item) => {
        acc[item.type] = item._count
        return acc
      }, {} as Record<string, number>)
    }
  }
}