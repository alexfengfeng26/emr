import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { AuthService } from '@/services/auth.service'
import { logAudit } from '@/utils/logger'
import { loginSchema, registerSchema, changePasswordSchema } from '@/types/auth'
import { requireAdmin, authenticate } from '@/middleware/auth'
import { UnauthorizedError } from '@/utils/errors'
import { prisma } from '@/lib/prisma'

// 用户注册
const register = async (request: FastifyRequest, reply: FastifyReply) => {
  const userData = registerSchema.parse(request.body)

  const user = await AuthService.register(userData)

  // 生成JWT token
  const token = await reply.jwtSign({
    userId: user.id,
    username: user.username,
    role: user.role
  })

  logAudit('USER_REGISTER', user.id, { ip: request.ip, userAgent: request.headers['user-agent'] })

  return {
    code: 0,
    message: '注册成功',
    data: {
      token,
      user,
      expiresIn: '24h'
    }
  }
}

// 用户登录
const login = async (request: FastifyRequest, reply: FastifyReply) => {
  const { username, password } = loginSchema.parse(request.body)

  const user = await AuthService.validateUser(username, password)

  // 生成JWT token
  const token = await reply.jwtSign({
    userId: user.id,
    username: user.username,
    role: user.role
  })

  // 记录登录日志
  logAudit('LOGIN', user.id, { ip: request.ip, userAgent: request.headers['user-agent'] })

  return {
    code: 0,
    message: '登录成功',
    data: {
      token,
      user,
      expiresIn: '24h'
    }
  }
}

// 获取当前用户信息
const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as any

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
      updatedAt: true
    }
  })

  if (!user) {
    throw new UnauthorizedError('用户不存在')
  }

  return {
    code: 0,
    message: '获取成功',
    data: {
      user
    }
  }
}

// 用户登出
const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as any

  // 记录登出日志
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'LOGOUT',
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      result: 'success'
    }
  })

  return {
    code: 0,
    message: '登出成功'
  }
}

// 刷新token
const refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId, username, role } = request.user as any

  // 生成新的token
  const token = await reply.jwtSign({
    userId,
    username,
    role
  })

  return {
    code: 0,
    message: '刷新成功',
    data: {
      token,
      expiresIn: '24h'
    }
  }
}

// 修改密码
const changePassword = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as any
  const { oldPassword, newPassword } = changePasswordSchema.parse(request.body)

  await AuthService.changePassword(userId, oldPassword, newPassword)

  logAudit('CHANGE_PASSWORD', userId, { ip: request.ip, userAgent: request.headers['user-agent'] })

  return {
    code: 0,
    message: '密码修改成功'
  }
}

// 管理员获取用户列表
const getUserList = async (request: FastifyRequest, reply: FastifyReply) => {
  const options = request.query as any
  const result = await AuthService.getUserList(options)

  return {
    code: 0,
    message: '获取成功',
    data: result
  }
}

// 管理员获取用户详情
const getUserById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as any
  const user = await AuthService.getUserById(parseInt(id))

  return {
    code: 0,
    message: '获取成功',
    data: { user }
  }
}

// 管理员更新用户状态
const updateUserStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId: adminId } = request.user as any
  const { id } = request.params as any
  const { status } = request.body as any

  await AuthService.updateUserStatus(adminId, parseInt(id), status)

  logAudit('UPDATE_USER_STATUS', adminId, {
    targetUserId: parseInt(id),
    newStatus: status,
    ip: request.ip,
    userAgent: request.headers['user-agent']
  })

  return {
    code: 0,
    message: '更新成功'
  }
}

export const authRoutes = async (fastify: FastifyInstance) => {
  // 公开路由（不需要认证）
  fastify.post('/register', register)
  fastify.post('/login', login)

  // 需要认证的路由
  fastify.get('/me', { preHandler: authenticate }, getMe)
  fastify.post('/logout', { preHandler: authenticate }, logout)
  fastify.post('/refresh', { preHandler: authenticate }, refreshToken)
  fastify.post('/change-password', { preHandler: authenticate }, changePassword)

  // 管理员路由
  fastify.get('/users', { preHandler: [authenticate, requireAdmin] }, getUserList)
  fastify.get('/users/:id', { preHandler: [authenticate, requireAdmin] }, getUserById)
  fastify.put('/users/:id/status', { preHandler: [authenticate, requireAdmin] }, updateUserStatus)
}