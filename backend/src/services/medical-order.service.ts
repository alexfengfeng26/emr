import { prisma } from '@/utils/prisma'
import { ValidationError, NotFoundError, ForbiddenError } from '@/middleware/error-handler'
import { MedicalOrderType, OrderStatus, OrderPriority } from '@prisma/client'
import { logAudit } from '@/utils/logger'

export class MedicalOrderService {
  // 创建医嘱
  static async createMedicalOrder(orderData: {
    patientId: number
    orderType: MedicalOrderType
    content: string
    dosage?: string
    frequency?: string
    duration?: string
    priority?: OrderPriority
    notes?: string
  }, doctorId: number) {
    const { patientId, orderType, content, dosage, frequency, duration, priority = OrderPriority.NORMAL, notes } = orderData

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
      throw new ValidationError('只能为活跃患者创建医嘱')
    }

    // 检查医生权限
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, name: true, role: true }
    })

    if (!doctor) {
      throw new NotFoundError('医生不存在')
    }

    // 创建医嘱
    const medicalOrder = await prisma.medicalOrder.create({
      data: {
        patientId,
        doctorId,
        orderType,
        content,
        dosage,
        frequency,
        duration,
        priority,
        notes,
        status: OrderStatus.PENDING
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
    logAudit('CREATE_MEDICAL_ORDER', doctorId, {
      patientId,
      patientName: patient.name,
      orderType,
      orderId: medicalOrder.id
    })

    return medicalOrder
  }

  // 更新医嘱
  static async updateMedicalOrder(orderId: number, updateData: {
    content?: string
    dosage?: string
    frequency?: string
    duration?: string
    priority?: OrderPriority
    notes?: string
    status?: OrderStatus
  }, doctorId: number) {
    // 检查医嘱是否存在
    const existingOrder = await prisma.medicalOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        status: true,
        orderType: true,
        patient: {
          select: { name: true }
        }
      }
    })

    if (!existingOrder) {
      throw new NotFoundError('医嘱不存在')
    }

    // 检查权限（医生可以更新自己创建的医嘱，护士可以更新执行状态）
    const user = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { role: true }
    })

    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    // 如果是医生更新，只能更新自己创建的医嘱
    if (user.role === 'DOCTOR' && existingOrder.doctorId !== doctorId) {
      throw new ForbiddenError('只能修改自己创建的医嘱')
    }

    // 如果是护士更新，只能更新执行状态
    if (user.role === 'NURSE') {
      const allowedFields = ['status']
      const updateFields = Object.keys(updateData)
      const hasInvalidFields = updateFields.some(field => !allowedFields.includes(field))

      if (hasInvalidFields) {
        throw new ForbiddenError('护士只能更新医嘱执行状态')
      }
    }

    // 检查医嘱状态
    if (existingOrder.status === OrderStatus.EXECUTED && updateData.status !== OrderStatus.CANCELLED) {
      throw new ValidationError('已执行的医嘱不能修改')
    }

    // 更新数据
    const updateFields: any = { ...updateData }

    // 如果状态改为执行中或已执行，记录执行信息
    if (updateData.status === OrderStatus.EXECUTED) {
      updateFields.executedAt = new Date()
      updateFields.executedBy = doctorId
    }

    const updatedOrder = await prisma.medicalOrder.update({
      where: { id: orderId },
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
    logAudit('UPDATE_MEDICAL_ORDER', doctorId, {
      patientId: existingOrder.patientId,
      patientName: existingOrder.patient.name,
      orderId,
      orderType: existingOrder.orderType,
      updatedFields: Object.keys(updateData)
    })

    return updatedOrder
  }

  // 获取医嘱列表
  static async getMedicalOrderList(options: {
    page?: number
    limit?: number
    patientId?: number
    doctorId?: number
    orderType?: MedicalOrderType
    status?: OrderStatus
    priority?: OrderPriority
    search?: string
    dateRange?: { start?: string; end?: string }
  }) {
    const { page = 1, limit = 20, patientId, doctorId, orderType, status, priority, search, dateRange } = options
    const skip = (page - 1) * limit

    const where: any = {}

    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId
    if (orderType) where.orderType = orderType
    if (status) where.status = status
    if (priority) where.priority = priority

    if (search) {
      where.OR = [
        { content: { contains: search } },
        { patient: { name: { contains: search } } }
      ]
    }

    // 日期范围查询
    if (dateRange?.start || dateRange?.end) {
      where.createdAt = {}
      if (dateRange.start) where.createdAt.gte = new Date(dateRange.start)
      if (dateRange.end) where.createdAt.lte = new Date(dateRange.end + ' 23:59:59')
    }

    const [orders, total] = await Promise.all([
      prisma.medicalOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
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
              realName: true,
              department: true
            }
          }
        }
      }),
      prisma.medicalOrder.count({ where })
    ])

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // 获取医嘱详情
  static async getMedicalOrderById(orderId: number) {
    const order = await prisma.medicalOrder.findUnique({
      where: { id: orderId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthDate: true,
            phone: true,
            bloodType: true,
            allergies: true
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

    if (!order) {
      throw new NotFoundError('医嘱不存在')
    }

    return order
  }

  // 批量执行医嘱
  static async executeMedicalOrders(orderIds: number[], userId: number, notes?: string) {
    // 检查用户权限
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    if (user.role !== 'NURSE' && user.role !== 'ADMIN') {
      throw new ForbiddenError('只有护士或管理员可以执行医嘱')
    }

    // 检查医嘱是否存在且可以执行
    const orders = await prisma.medicalOrder.findMany({
      where: {
        id: { in: orderIds },
        status: { in: [OrderStatus.PENDING, OrderStatus.APPROVED] }
      },
      select: {
        id: true,
        patientId: true,
        patient: { select: { name: true } }
      }
    })

    if (orders.length !== orderIds.length) {
      throw new ValidationError('部分医嘱不存在或状态不正确')
    }

    // 批量更新医嘱状态
    const updatedOrders = await prisma.medicalOrder.updateMany({
      where: {
        id: { in: orderIds }
      },
      data: {
        status: OrderStatus.EXECUTED,
        executedAt: new Date(),
        executedBy: userId
      }
    })

    // 记录审计日志
    for (const order of orders) {
      logAudit('EXECUTE_MEDICAL_ORDER', userId, {
        patientId: order.patientId,
        patientName: order.patient.name,
        orderId: order.id,
        notes
      })
    }

    return { count: updatedOrders.count }
  }

  // 批量取消医嘱
  static async cancelMedicalOrders(orderIds: number[], userId: number, reason?: string) {
    // 检查医嘱是否存在且可以取消
    const orders = await prisma.medicalOrder.findMany({
      where: {
        id: { in: orderIds },
        status: { in: [OrderStatus.PENDING, OrderStatus.APPROVED, OrderStatus.SUSPENDED] }
      },
      select: {
        id: true,
        doctorId: true,
        patientId: true,
        patient: { select: { name: true } }
      }
    })

    if (orders.length !== orderIds.length) {
      throw new ValidationError('部分医嘱不存在或状态不正确')
    }

    // 检查权限（医生可以取消自己创建的医嘱，护士和管理员可以取消任何医嘱）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    for (const order of orders) {
      if (user.role === 'DOCTOR' && order.doctorId !== userId) {
        throw new ForbiddenError('只能取消自己创建的医嘱')
      }
    }

    // 批量更新医嘱状态
    const updatedOrders = await prisma.medicalOrder.updateMany({
      where: {
        id: { in: orderIds }
      },
      data: {
        status: OrderStatus.CANCELLED,
        notes: reason ? `${reason}` : null
      }
    })

    // 记录审计日志
    for (const order of orders) {
      logAudit('CANCEL_MEDICAL_ORDER', userId, {
        patientId: order.patientId,
        patientName: order.patient.name,
        orderId: order.id,
        reason
      })
    }

    return { count: updatedOrders.count }
  }

  // 删除医嘱
  static async deleteMedicalOrder(orderId: number, doctorId: number) {
    const order = await prisma.medicalOrder.findUnique({
      where: { id: orderId },
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

    if (!order) {
      throw new NotFoundError('医嘱不存在')
    }

    if (order.doctorId !== doctorId) {
      throw new ForbiddenError('只能删除自己创建的医嘱')
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CANCELLED) {
      throw new ValidationError('只能删除待处理或已取消的医嘱')
    }

    await prisma.medicalOrder.delete({
      where: { id: orderId }
    })

    // 记录审计日志
    logAudit('DELETE_MEDICAL_ORDER', doctorId, {
      patientId: order.patientId,
      patientName: order.patient.name,
      orderId
    })

    return true
  }

  // 获取患者当前有效的医嘱
  static async getPatientActiveOrders(patientId: number) {
    const orders = await prisma.medicalOrder.findMany({
      where: {
        patientId,
        status: { in: [OrderStatus.PENDING, OrderStatus.APPROVED] }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        doctor: {
          select: {
            name: true,
            department: true
          }
        }
      }
    })

    return orders
  }
}