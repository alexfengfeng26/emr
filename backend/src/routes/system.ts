import { FastifyInstance } from 'fastify'
import { systemService } from '@/services/system.service'
import { authenticate } from '@/middleware/auth'

export async function systemRoutes(fastify: FastifyInstance) {
  // 用户管理路由
  fastify.get('/users', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100 },
          keyword: { type: 'string' },
          departmentId: { type: 'number' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          roleId: { type: 'number' },
          position: { type: 'string' },
          createdAtStart: { type: 'string' },
          createdAtEnd: { type: 'string' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await systemService.getUsers(request.query as any)
      return {
        code: 0,
        message: '获取用户列表成功',
        data: result
      }
    } catch (error) {
      fastify.log.error({
        message: '获取用户列表失败',
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
        method: request.method,
        query: request.query
      })
      reply.status(500)
      return {
        code: 500,
        message: '获取用户列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.get('/users/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      const user = await systemService.getUserById(id)
      return {
        code: 0,
        message: '获取用户详情成功',
        data: user
      }
    } catch (error) {
      fastify.log.error(error)
      if (error instanceof Error && error.message === '用户不存在') {
        reply.status(404)
        return {
          code: 404,
          message: error.message
        }
      }
      reply.status(500)
      return {
        code: 500,
        message: '获取用户详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.post('/users', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password', 'realName', 'email', 'phone', 'position', 'title', 'status', 'roleIds'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6 },
          realName: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', minLength: 11, maxLength: 20 },
          avatar: { type: 'string' },
          departmentId: { type: 'number' },
          position: { type: 'string', maxLength: 100 },
          title: { type: 'string', maxLength: 100 },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          roleIds: { type: 'array', items: { type: 'number' }, minItems: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = await systemService.createUser(request.body as any)
      return {
        code: 0,
        message: '创建用户成功',
        data: user
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '创建用户失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.put('/users/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          realName: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', minLength: 11, maxLength: 20 },
          avatar: { type: 'string' },
          departmentId: { type: 'number' },
          position: { type: 'string', maxLength: 100 },
          title: { type: 'string', maxLength: 100 },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          roleIds: { type: 'array', items: { type: 'number' } }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      const user = await systemService.updateUser(id, request.body as any)
      return {
        code: 0,
        message: '更新用户成功',
        data: user
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '更新用户失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.delete('/users/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      await systemService.deleteUser(id)
      return {
        code: 0,
        message: '删除用户成功'
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '删除用户失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  // 角色管理路由
  fastify.get('/roles', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100 },
          keyword: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          isSystem: { type: 'boolean' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await systemService.getRoles(request.query as any)
      return {
        code: 0,
        message: '获取角色列表成功',
        data: result
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '获取角色列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.post('/roles', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'code', 'permissionIds', 'status'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          code: { type: 'string', minLength: 1, maxLength: 50 },
          description: { type: 'string' },
          permissionIds: { type: 'array', items: { type: 'number' }, minItems: 1 },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const role = await systemService.createRole(request.body as any)
      return {
        code: 0,
        message: '创建角色成功',
        data: role
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '创建角色失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.put('/roles/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string' },
          permissionIds: { type: 'array', items: { type: 'number' } },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      const role = await systemService.updateRole(id, request.body as any)
      return {
        code: 0,
        message: '更新角色成功',
        data: role
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '更新角色失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.delete('/roles/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      await systemService.deleteRole(id)
      return {
        code: 0,
        message: '删除角色成功'
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '删除角色失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  // 科室管理路由
  fastify.get('/departments', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100 },
          keyword: { type: 'string' },
          type: { type: 'string' },
          parentId: { type: 'number' },
          isActive: { type: 'boolean' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await systemService.getDepartments(request.query as any)
      return {
        code: 0,
        message: '获取科室列表成功',
        data: result
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '获取科室列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.post('/departments', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['code', 'name', 'type', 'sort', 'isActive'],
        properties: {
          code: { type: 'string', minLength: 1, maxLength: 50 },
          name: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string' },
          type: { type: 'string', enum: ['CLINICAL', 'MEDICAL_TECH', 'NURSING', 'ADMIN', 'SUPPORT'] },
          parentId: { type: 'number' },
          sort: { type: 'number', minimum: 0 },
          leaderId: { type: 'number' },
          phone: { type: 'string', maxLength: 20 },
          location: { type: 'string' },
          bedCount: { type: 'number', minimum: 0 },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const department = await systemService.createDepartment(request.body as any)
      return {
        code: 0,
        message: '创建科室成功',
        data: department
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '创建科室失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.put('/departments/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string' },
          type: { type: 'string', enum: ['CLINICAL', 'MEDICAL_TECH', 'NURSING', 'ADMIN', 'SUPPORT'] },
          parentId: { type: 'number' },
          sort: { type: 'number', minimum: 0 },
          leaderId: { type: 'number' },
          phone: { type: 'string', maxLength: 20 },
          location: { type: 'string' },
          bedCount: { type: 'number', minimum: 0 },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      const department = await systemService.updateDepartment(id, request.body as any)
      return {
        code: 0,
        message: '更新科室成功',
        data: department
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '更新科室失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.delete('/departments/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      await systemService.deleteDepartment(id)
      return {
        code: 0,
        message: '删除科室成功'
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '删除科室失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  // 系统设置路由
  fastify.get('/settings', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100 },
          keyword: { type: 'string' },
          category: { type: 'string' },
          isPublic: { type: 'boolean' },
          isEditable: { type: 'boolean' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await systemService.getSettings(request.query as any)
      return {
        code: 0,
        message: '获取系统设置成功',
        data: result
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '获取系统设置失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.post('/settings', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['key', 'value', 'type', 'category', 'isPublic', 'isEditable', 'sort'],
        properties: {
          key: { type: 'string', minLength: 1, maxLength: 100 },
          value: { type: 'string' },
          description: { type: 'string', maxLength: 255 },
          type: { type: 'string', enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'TEXT'] },
          category: { type: 'string', maxLength: 50 },
          isPublic: { type: 'boolean' },
          isEditable: { type: 'boolean' },
          validation: { type: 'string' },
          sort: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const setting = await systemService.createSetting(request.body as any)
      return {
        code: 0,
        message: '创建系统设置成功',
        data: setting
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '创建系统设置失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.put('/settings/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        required: ['value'],
        properties: {
          value: { type: 'string' },
          description: { type: 'string', maxLength: 255 },
          isPublic: { type: 'boolean' },
          isEditable: { type: 'boolean' },
          validation: { type: 'string' },
          sort: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      const setting = await systemService.updateSetting(id, request.body as any)
      return {
        code: 0,
        message: '更新系统设置成功',
        data: setting
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '更新系统设置失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  fastify.delete('/settings/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number }
      await systemService.deleteSetting(id)
      return {
        code: 0,
        message: '删除系统设置成功'
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '删除系统设置失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  // 操作日志路由
  fastify.get('/logs', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1 },
          pageSize: { type: 'number', minimum: 1, maximum: 100 },
          userId: { type: 'number' },
          module: { type: 'string' },
          action: { type: 'string' },
          result: { type: 'string', enum: ['SUCCESS', 'FAILURE'] },
          ipAddress: { type: 'string' },
          createdAtStart: { type: 'string' },
          createdAtEnd: { type: 'string' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await systemService.getOperationLogs(request.query as any)
      return {
        code: 0,
        message: '获取操作日志成功',
        data: result
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '获取操作日志失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  // 权限树路由
  fastify.get('/permissions/tree', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const permissions = await systemService.getPermissionTree()
      return {
        code: 0,
        message: '获取权限树成功',
        data: { permissions }
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return {
        code: 500,
        message: '获取权限树失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })
}