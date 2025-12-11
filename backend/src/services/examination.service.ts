import { prisma } from '@/utils/prisma'
import { ValidationError, NotFoundError, ForbiddenError } from '@/middleware/error-handler'
import { ExaminationType, ExaminationStatus } from '@prisma/client'
import { logAudit } from '@/utils/logger'

export class ExaminationService {
  // 创建检查检验申请
  static async createExamination(examData: {
    patientId: number
    examType: ExaminationType
    examName: string
    description?: string
    notes?: string
  }, doctorId: number) {
    const { patientId, examType, examName, description, notes } = examData

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
      throw new ValidationError('只能为活跃患者创建检查检验')
    }

    // 检查医生权限
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, name: true, role: true }
    })

    if (!doctor) {
      throw new NotFoundError('医生不存在')
    }

    // 创建检查检验
    const examination = await prisma.examination.create({
      data: {
        patientId,
        examType,
        examName,
        description,
        notes,
        status: ExaminationStatus.PENDING,
        requestedBy: doctorId
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
        requester: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      }
    })

    // 记录审计日志
    logAudit('CREATE_EXAMINATION', doctorId, {
      patientId,
      patientName: patient.name,
      examType,
      examName,
      examinationId: examination.id
    })

    return examination
  }

  // 更新检查检验
  static async updateExamination(examinationId: number, updateData: {
    description?: string
    result?: string
    reportUrl?: string
    images?: string[]
    status?: ExaminationStatus
  }, userId: number) {
    // 检查检查检验是否存在
    const existingExam = await prisma.examination.findUnique({
      where: { id: examinationId },
      select: {
        id: true,
        patientId: true,
        status: true,
        examType: true,
        examName: true,
        patient: {
          select: { name: true }
        }
      }
    })

    if (!existingExam) {
      throw new NotFoundError('检查检验不存在')
    }

    // 检查用户权限
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    // 检查权限和状态
    if (user.role === 'DOCTOR') {
      // 医生只能更新描述和取消检查
      const allowedFields = ['description', 'status']
      const updateFields = Object.keys(updateData)
      const hasInvalidFields = updateFields.some(field => !allowedFields.includes(field))

      if (hasInvalidFields) {
        throw new ForbiddenError('医生只能更新检查描述和状态')
      }

      // 医生只能取消待处理的检查
      if (updateData.status === ExaminationStatus.CANCELLED && existingExam.status !== ExaminationStatus.PENDING) {
        throw new ValidationError('只能取消待处理的检查')
      }
    } else if (user.role === 'NURSE') {
      // 护士只能更新状态为进行中
      if (updateData.status && updateData.status !== ExaminationStatus.IN_PROGRESS) {
        throw new ForbiddenError('护士只能将状态更新为进行中')
      }
    }

    // 更新数据
    const updateFields: any = { ...updateData }

    if (updateData.images) {
      updateFields.images = JSON.stringify(updateData.images)
    }

    // 如果状态改为已完成，记录报告信息
    if (updateData.status === ExaminationStatus.COMPLETED) {
      updateFields.reportedAt = new Date()
      updateFields.reportedBy = userId
    }

    const updatedExam = await prisma.examination.update({
      where: { id: examinationId },
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
        requester: {
          select: {
            id: true,
            name: true,
            department: true
          }
        },
        reporter: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      }
    })

    // 记录审计日志
    logAudit('UPDATE_EXAMINATION', userId, {
      patientId: existingExam.patientId,
      patientName: existingExam.patient.name,
      examinationId,
      examType: existingExam.examType,
      examName: existingExam.examName,
      updatedFields: Object.keys(updateData)
    })

    return updatedExam
  }

  // 获取检查检验列表
  static async getExaminationList(options: {
    page?: number
    limit?: number
    patientId?: number
    examType?: ExaminationType
    status?: ExaminationStatus
    search?: string
    dateRange?: { start?: string; end?: string }
  }) {
    const { page = 1, limit = 20, patientId, examType, status, search, dateRange } = options
    const skip = (page - 1) * limit

    const where: any = {}

    if (patientId) where.patientId = patientId
    if (examType) where.examType = examType
    if (status) where.status = status

    if (search) {
      where.OR = [
        { examName: { contains: search } },
        { description: { contains: search } },
        { result: { contains: search } },
        { patient: { name: { contains: search } } }
      ]
    }

    // 日期范围查询
    if (dateRange?.start || dateRange?.end) {
      where.createdAt = {}
      if (dateRange.start) where.createdAt.gte = new Date(dateRange.start)
      if (dateRange.end) where.createdAt.lte = new Date(dateRange.end + ' 23:59:59')
    }

    const [examinations, total] = await Promise.all([
      prisma.examination.findMany({
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
          requester: {
            select: {
              id: true,
              name: true,
              department: true
            }
          },
          reporter: {
            select: {
              id: true,
              name: true,
              department: true
            }
          }
        }
      }),
      prisma.examination.count({ where })
    ])

    return {
      examinations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // 获取检查检验详情
  static async getExaminationById(examinationId: number) {
    const examination = await prisma.examination.findUnique({
      where: { id: examinationId },
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
        requester: {
          select: {
            id: true,
            name: true,
            department: true,
            phone: true
          }
        },
        reporter: {
          select: {
            id: true,
            name: true,
            department: true,
            phone: true
          }
        }
      }
    })

    if (!examination) {
      throw new NotFoundError('检查检验不存在')
    }

    // 解析影像信息
    let images = null
    if (examination.images) {
      try {
        images = JSON.parse(examination.images)
      } catch (error) {
        console.error('Failed to parse images:', error)
      }
    }

    return {
      ...examination,
      images
    }
  }

  // 更新检查检验状态
  static async updateExaminationStatus(examinationId: number, status: ExaminationStatus, userId: number, notes?: string) {
    const examination = await prisma.examination.findUnique({
      where: { id: examinationId },
      select: {
        id: true,
        patientId: true,
        status: true,
        examType: true,
        examName: true,
        patient: {
          select: { name: true }
        }
      }
    })

    if (!examination) {
      throw new NotFoundError('检查检验不存在')
    }

    // 检查状态转换是否合法
    const validTransitions: Record<ExaminationStatus, ExaminationStatus[]> = {
      [ExaminationStatus.PENDING]: [ExaminationStatus.IN_PROGRESS, ExaminationStatus.CANCELLED],
      [ExaminationStatus.IN_PROGRESS]: [ExaminationStatus.COMPLETED, ExaminationStatus.CANCELLED],
      [ExaminationStatus.COMPLETED]: [],
      [ExaminationStatus.CANCELLED]: [ExaminationStatus.PENDING]
    }

    if (!validTransitions[examination.status].includes(status)) {
      throw new ValidationError(`无法从状态 ${examination.status} 转换到 ${status}`)
    }

    const updateData: any = { status }

    if (status === ExaminationStatus.COMPLETED) {
      updateData.reportedAt = new Date()
      updateData.reportedBy = userId
    }

    const updatedExam = await prisma.examination.update({
      where: { id: examinationId },
      data: updateData
    })

    // 记录审计日志
    logAudit('UPDATE_EXAMINATION_STATUS', userId, {
      patientId: examination.patientId,
      patientName: examination.patient.name,
      examinationId,
      examType: examination.examType,
      examName: examination.examName,
      oldStatus: examination.status,
      newStatus: status,
      notes
    })

    return updatedExam
  }

  // 删除检查检验
  static async deleteExamination(examinationId: number, userId: number) {
    const examination = await prisma.examination.findUnique({
      where: { id: examinationId },
      select: {
        id: true,
        patientId: true,
        status: true,
        patient: {
          select: { name: true }
        }
      }
    })

    if (!examination) {
      throw new NotFoundError('检查检验不存在')
    }

    if (examination.status !== ExaminationStatus.PENDING && examination.status !== ExaminationStatus.CANCELLED) {
      throw new ValidationError('只能删除待处理或已取消的检查检验')
    }

    await prisma.examination.delete({
      where: { id: examinationId }
    })

    // 记录审计日志
    logAudit('DELETE_EXAMINATION', userId, {
      patientId: examination.patientId,
      patientName: examination.patient.name,
      examinationId
    })

    return true
  }

  // 批量更新检查检验状态
  static async batchUpdateStatus(examinationIds: number[], status: ExaminationStatus, userId: number, notes?: string) {
    // 检查检查检验是否存在
    const examinations = await prisma.examination.findMany({
      where: {
        id: { in: examinationIds },
        status: { in: [ExaminationStatus.PENDING, ExaminationStatus.IN_PROGRESS] }
      },
      select: {
        id: true,
        patientId: true,
        patient: { select: { name: true } }
      }
    })

    if (examinations.length !== examinationIds.length) {
      throw new ValidationError('部分检查检验不存在或状态不正确')
    }

    const updateData: any = { status }
    if (status === ExaminationStatus.COMPLETED) {
      updateData.reportedAt = new Date()
      updateData.reportedBy = userId
    }

    const updatedExams = await prisma.examination.updateMany({
      where: {
        id: { in: examinationIds }
      },
      data: updateData
    })

    // 记录审计日志
    for (const exam of examinations) {
      logAudit('BATCH_UPDATE_EXAMINATION_STATUS', userId, {
        patientId: exam.patientId,
        patientName: exam.patient.name,
        examinationId: exam.id,
        status,
        notes
      })
    }

    return { count: updatedExams.count }
  }

  // 获取患者的检查检验历史
  static async getPatientExaminationHistory(patientId: number, examType?: ExaminationType) {
    const where: any = { patientId }
    if (examType) where.examType = examType

    const examinations = await prisma.examination.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        examType: true,
        examName: true,
        status: true,
        createdAt: true,
        reportedAt: true,
        requester: {
          select: {
            name: true,
            department: true
          }
        },
        reporter: {
          select: {
            name: true,
            department: true
          }
        }
      }
    })

    return examinations
  }

  // 统计检查检验数量
  static async getExaminationStatistics(startDate?: string, endDate?: string) {
    const where: any = {}

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate + ' 23:59:59')
    }

    const [total, pending, inProgress, completed, cancelled] = await Promise.all([
      prisma.examination.count({ where }),
      prisma.examination.count({ where: { ...where, status: ExaminationStatus.PENDING } }),
      prisma.examination.count({ where: { ...where, status: ExaminationStatus.IN_PROGRESS } }),
      prisma.examination.count({ where: { ...where, status: ExaminationStatus.COMPLETED } }),
      prisma.examination.count({ where: { ...where, status: ExaminationStatus.CANCELLED } })
    ])

    const typeStats = await prisma.examination.groupBy({
      by: ['examType'],
      where,
      _count: true
    })

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      typeStats: typeStats.map(stat => ({
        type: stat.examType,
        count: stat._count
      }))
    }
  }
}