import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { config } from '@/config'
import { UnauthorizedError, ValidationError, NotFoundError } from '@/utils/errors'
import { UserRole } from '@prisma/client'
import { logAudit } from '@/utils/logger'

export class AuthService {
  // 用户注册
  static async register(userData: {
    username: string
    password: string
    name: string
    email?: string
    phone?: string
    role: UserRole
    department?: string
  }) {
    const { username, password, name, email, phone, role, department } = userData

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      throw new ValidationError('用户名已存在')
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      })
      if (existingEmail) {
        throw new ValidationError('邮箱已存在')
      }
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        userId: `U${Date.now()}${Math.floor(Math.random() * 1000)}`,
        username,
        password: passwordHash,
        realName: name,
        email,
        phone,
        role,
        department,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        userId: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        status: true,
        createdAt: true
      }
    })

    // 记录审计日志
    logAudit('USER_REGISTER', user.id, { username, name, role })

    return user
  }

  // 用户登录验证
  static async validateUser(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      throw new UnauthorizedError('用户名或密码错误')
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('账户已被禁用')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedError('用户名或密码错误')
    }

    // 返回用户信息（不包含密码），处理角色和权限信息
    const { password: _, ...userWithoutPassword } = user

    // 构建JWT payload
    return {
      userId: userWithoutPassword.id,
      username: userWithoutPassword.username,
      realName: userWithoutPassword.realName,
      roles: [userWithoutPassword.role], // 直接使用用户的角色字段
      permissions: [], // 这里可以根据角色获取权限
      department: userWithoutPassword.department,
      status: userWithoutPassword.status
    }
  }

  // 修改密码
  static async changePassword(userId: number, oldPassword: string, newPassword: string) {
    // 获取用户当前密码
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    })

    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isOldPasswordValid) {
      throw new UnauthorizedError('原密码错误')
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptRounds)

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash }
    })

    // 记录审计日志
    logAudit('CHANGE_PASSWORD', userId)

    return true
  }

  // 重置密码（管理员操作）
  static async resetPassword(adminId: number, userId: number, newPassword: string) {
    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds)

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash }
    })

    // 记录审计日志
    logAudit('RESET_PASSWORD', adminId, { targetUserId: userId })

    return true
  }

  // 更新用户状态
  static async updateUserStatus(adminId: number, userId: number, status: 'ACTIVE' | 'INACTIVE') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, role: true }
    })

    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    // 不能禁用管理员账户
    if (user.role === UserRole.ADMIN && status === 'INACTIVE') {
      throw new ValidationError('不能禁用管理员账户')
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status }
    })

    // 记录审计日志
    logAudit('UPDATE_USER_STATUS', adminId, {
      targetUserId: userId,
      targetUsername: user.username,
      newStatus: status
    })

    return true
  }

  // 获取用户列表（管理员）
  static async getUserList(options: {
    page?: number
    limit?: number
    role?: UserRole
    status?: string
    search?: string
  }) {
    const { page = 1, limit = 20, role, status, search } = options
    const skip = (page - 1) * limit

    const where: any = {}

    if (role) where.role = role
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          department: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where })
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // 获取用户详细信息
  static async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          medicalRecords: true,
          medicalOrders: true
        }
      }
    })

    if (!user) {
      throw new NotFoundError('用户不存在')
    }

    return user
  }
}