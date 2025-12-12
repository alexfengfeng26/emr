import { PrismaClient, UserStatus, RoleStatus } from '@prisma/client'
import { prisma } from '@/utils/prisma'

export class SystemService {
  // 用户管理
  async getUsers(params: {
    page?: number
    pageSize?: number
    keyword?: string
    departmentId?: number
    status?: string
    roleId?: number
    position?: string
    createdAtStart?: string
    createdAtEnd?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      departmentId,
      status,
      roleId,
      position,
      createdAtStart,
      createdAtEnd,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params

    const skip = (page - 1) * pageSize
    const where: any = {}

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { realName: { contains: keyword } },
        { email: { contains: keyword } }
      ]
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (status) {
      where.status = status
    }

    if (position) {
      where.position = { contains: position }
    }

    if (createdAtStart || createdAtEnd) {
      where.createdAt = {}
      if (createdAtStart) {
        where.createdAt.gte = new Date(createdAtStart)
      }
      if (createdAtEnd) {
        where.createdAt.lte = new Date(createdAtEnd)
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          department: {
            select: { id: true, name: true, code: true }
          },
          roles: {
            include: {
              role: {
                select: { id: true, name: true, code: true }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize
      }),
      prisma.user.count({ where })
    ])

    return {
      items: users.map(user => ({
        ...user,
        roles: user.roles.map(ur => ur.role),
        password: undefined
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async getUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    return {
      ...user,
      roles: user.roles.map(ur => ur.role),
      password: undefined
    }
  }

  async createUser(data: {
    username: string
    password: string
    realName: string
    email: string
    phone: string
    avatar?: string
    departmentId?: number
    position: string
    title: string
    status: UserStatus
    roleIds: number[]
  }) {
    const { roleIds, ...userData } = data

    const user = await prisma.user.create({
      data: {
        ...userData,
        userId: `U${Date.now()}${Math.floor(Math.random() * 1000)}`,
        roles: {
          create: roleIds.map(roleId => ({
            roleId
          }))
        }
      },
      include: {
        department: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    return {
      ...user,
      roles: user.roles.map(ur => ur.role),
      password: undefined
    }
  }

  async updateUser(id: number, data: {
    realName?: string
    email?: string
    phone?: string
    avatar?: string
    departmentId?: number
    position?: string
    title?: string
    status?: UserStatus
    roleIds?: number[]
  }) {
    const { roleIds, ...userData } = data

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(roleIds && {
          roles: {
            deleteMany: {},
            create: roleIds.map(roleId => ({
              roleId
            }))
          }
        })
      },
      include: {
        department: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    return {
      ...user,
      roles: user.roles.map(ur => ur.role),
      password: undefined
    }
  }

  async deleteUser(id: number) {
    await prisma.user.delete({
      where: { id }
    })
  }

  // 角色管理
  async getRoles(params: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: string
    isSystem?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      status,
      isSystem,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params

    const skip = (page - 1) * pageSize
    const where: any = {}

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { description: { contains: keyword } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (typeof isSystem === 'boolean') {
      where.isSystem = isSystem
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: { users: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize
      }),
      prisma.role.count({ where })
    ])

    return {
      items: roles.map(role => ({
        ...role,
        permissions: role.permissions.map(rp => rp.permission),
        userCount: role._count.users
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async createRole(data: {
    name: string
    code: string
    description?: string
    permissionIds: number[]
    status: RoleStatus
  }) {
    const { permissionIds, ...roleData } = data

    const role = await prisma.role.create({
      data: {
        ...roleData,
        permissions: {
          create: permissionIds.map(permissionId => ({
            permissionId
          }))
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    return {
      ...role,
      permissions: role.permissions.map(rp => rp.permission)
    }
  }

  async updateRole(id: number, data: {
    name?: string
    description?: string
    permissionIds?: number[]
    status?: RoleStatus
  }) {
    const { permissionIds, ...roleData } = data

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        ...(permissionIds && {
          permissions: {
            deleteMany: {},
            create: permissionIds.map(permissionId => ({
              permissionId
            }))
          }
        })
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    return {
      ...role,
      permissions: role.permissions.map(rp => rp.permission)
    }
  }

  async deleteRole(id: number) {
    await prisma.role.delete({
      where: { id }
    })
  }

  // 科室管理
  async getDepartments(params: {
    page?: number
    pageSize?: number
    keyword?: string
    type?: string
    parentId?: number
    isActive?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      type,
      parentId,
      isActive,
      sortBy = 'sort',
      sortOrder = 'asc'
    } = params

    const skip = (page - 1) * pageSize
    const where: any = {}

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { description: { contains: keyword } }
      ]
    }

    if (type) {
      where.type = type
    }

    if (parentId !== undefined) {
      where.parentId = parentId
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          parent: {
            select: { id: true, name: true }
          },
          leader: {
            select: { id: true, realName: true, position: true }
          },
          _count: {
            select: { users: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize
      }),
      prisma.department.count({ where })
    ])

    return {
      items: departments.map(dept => ({
        ...dept,
        userCount: dept._count.users
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async createDepartment(data: {
    code: string
    name: string
    description?: string
    type: string
    parentId?: number
    sort: number
    leaderId?: number
    phone?: string
    location?: string
    bedCount?: number
    isActive: boolean
  }) {
    return await prisma.department.create({
      data,
      include: {
        parent: {
          select: { id: true, name: true }
        },
        leader: {
          select: { id: true, realName: true, position: true }
        }
      }
    })
  }

  async updateDepartment(id: number, data: {
    name?: string
    description?: string
    type?: string
    parentId?: number
    sort?: number
    leaderId?: number
    phone?: string
    location?: string
    bedCount?: number
    isActive?: boolean
  }) {
    return await prisma.department.update({
      where: { id },
      data,
      include: {
        parent: {
          select: { id: true, name: true }
        },
        leader: {
          select: { id: true, realName: true, position: true }
        }
      }
    })
  }

  async deleteDepartment(id: number) {
    await prisma.department.delete({
      where: { id }
    })
  }

  // 系统设置
  async getSettings(params: {
    page?: number
    pageSize?: number
    keyword?: string
    category?: string
    isPublic?: boolean
    isEditable?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      category,
      isPublic,
      isEditable,
      sortBy = 'sort',
      sortOrder = 'asc'
    } = params

    const skip = (page - 1) * pageSize
    const where: any = {}

    if (keyword) {
      where.OR = [
        { key: { contains: keyword } },
        { description: { contains: keyword } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (typeof isPublic === 'boolean') {
      where.isPublic = isPublic
    }

    if (typeof isEditable === 'boolean') {
      where.isEditable = isEditable
    }

    const [settings, total] = await Promise.all([
      prisma.systemSetting.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize
      }),
      prisma.systemSetting.count({ where })
    ])

    return {
      items: settings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async createSetting(data: {
    key: string
    value: string
    description?: string
    type: string
    category: string
    isPublic: boolean
    isEditable: boolean
    validation?: string
    sort: number
  }) {
    return await prisma.systemSetting.create({
      data
    })
  }

  async updateSetting(id: number, data: {
    value: string
    description?: string
    isPublic?: boolean
    isEditable?: boolean
    validation?: string
    sort?: number
  }) {
    return await prisma.systemSetting.update({
      where: { id },
      data
    })
  }

  async deleteSetting(id: number) {
    await prisma.systemSetting.delete({
      where: { id }
    })
  }

  // 操作日志
  async getOperationLogs(params: {
    page?: number
    pageSize?: number
    userId?: number
    module?: string
    action?: string
    result?: string
    ipAddress?: string
    createdAtStart?: string
    createdAtEnd?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      pageSize = 20,
      userId,
      module,
      action,
      result,
      ipAddress,
      createdAtStart,
      createdAtEnd,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params

    const skip = (page - 1) * pageSize
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (module) {
      where.module = module
    }

    if (action) {
      where.action = action
    }

    if (result) {
      where.result = result
    }

    if (ipAddress) {
      where.ipAddress = ipAddress
    }

    if (createdAtStart || createdAtEnd) {
      where.createdAt = {}
      if (createdAtStart) {
        where.createdAt.gte = new Date(createdAtStart)
      }
      if (createdAtEnd) {
        where.createdAt.lte = new Date(createdAtEnd)
      }
    }

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, realName: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize
      }),
      prisma.operationLog.count({ where })
    ])

    return {
      items: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  // 获取权限树
  async getPermissionTree() {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { level: 'asc' },
        { sort: 'asc' }
      ]
    })

    // 构建树形结构
    const buildTree = (items: any[], parentId: number | null = null): any[] => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          id: item.id,
          name: item.name,
          code: item.code,
          description: item.description,
          module: item.module,
          action: item.action,
          resource: item.resource,
          type: item.type,
          level: item.level,
          sort: item.sort,
          icon: item.icon,
          path: item.path,
          children: buildTree(items, item.id)
        }))
    }

    return buildTree(permissions)
  }
}

export const systemService = new SystemService()