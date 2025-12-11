import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { FhirService } from '@/services/fhir.service'
import { requireDoctorOrNurse, authenticateApiKey } from '@/middleware/auth'
import { z } from 'zod'

// FHIR资源查询schema
const fhirQuerySchema = z.object({
  resourceType: z.string().min(1, '资源类型不能为空'),
  id: z.string().optional(),
  searchParams: z.record(z.string()).optional()
})

// 患者ID查询schema
const patientIdSchema = z.object({
  patientId: z.number().int().positive('患者ID必须是正整数')
})

// 检查检验ID查询schema
const examinationIdSchema = z.object({
  examinationId: z.number().int().positive('检查检验ID必须是正整数')
})

// 获取FHIR资源
const getFhirResource = async (request: FastifyRequest, reply: FastifyReply) => {
  const { resourceType, id, searchParams } = fhirQuerySchema.parse(request.query)

  try {
    if (id) {
      // 获取单个资源
      const result = await FhirService.getFromFhirServer(resourceType, id)
      if (!result.success) {
        return reply.code(404).send({
          resourceType: 'OperationOutcome',
          id: FhirService.generateUUID(),
          text: {
            status: 'generated',
            div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>错误</h1><p>${result.error}</p></div>`
          },
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: result.error
          }]
        })
      }
      return reply.type('application/fhir+json').send(result.data)
    } else {
      // 搜索资源
      const result = await FhirService.getFromFhirServer(resourceType, undefined, searchParams)
      if (!result.success) {
        return reply.code(400).send({
          resourceType: 'OperationOutcome',
          id: FhirService.generateUUID(),
          text: {
            status: 'generated',
            div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>错误</h1><p>${result.error}</p></div>`
          },
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: result.error
          }]
        })
      }
      return reply.type('application/fhir+json').send(result.data)
    }
  } catch (error) {
    return reply.code(500).send({
      resourceType: 'OperationOutcome',
      id: FhirService.generateUUID(),
      text: {
        status: 'generated',
        div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>服务器错误</h1><p>${error instanceof Error ? error.message : '未知错误'}</p></div>`
      },
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error instanceof Error ? error.message : '未知错误'
      }]
    })
  }
}

// 同步患者到FHIR
const syncPatientToFhir = async (request: FastifyRequest, reply: FastifyReply) => {
  const { patientId } = patientIdSchema.parse(request.params)

  try {
    // 这里应该获取患者数据，示例中使用模拟数据
    const patient = await getPatientData(patientId)
    if (!patient) {
      return reply.code(404).send({
        resourceType: 'OperationOutcome',
        id: FhirService.generateUUID(),
        text: {
          status: 'generated',
          div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>错误</h1><p>患者不存在</p></div>`
        },
        issue: [{
          severity: 'error',
          code: 'not-found',
          diagnostics: '患者不存在'
        }]
      })
    }

    // 转换为FHIR格式
    const fhirPatient = FhirService.patientToFhir(patient)

    // 验证FHIR资源
    const validation = FhirService.validateFhirResource(fhirPatient)
    if (!validation.valid) {
      return reply.code(400).send({
        resourceType: 'OperationOutcome',
        id: FhirService.generateUUID(),
        text: {
          status: 'generated',
          div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>验证错误</h1><p>${validation.errors.join(', ')}</p></div>`
        },
        issue: validation.errors.map(error => ({
          severity: 'error',
          code: 'invalid',
          diagnostics: error
        }))
      })
    }

    // 同步到FHIR服务器
    const syncResult = await FhirService.syncToFhirServer(fhirPatient)
    if (!syncResult.success) {
      return reply.code(500).send({
        resourceType: 'OperationOutcome',
        id: FhirService.generateUUID(),
        text: {
          status: 'generated',
          div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>同步失败</h1><p>${syncResult.error}</p></div>`
        },
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: syncResult.error
        }]
      })
    }

    return reply.type('application/fhir+json').send(fhirPatient)
  } catch (error) {
    return reply.code(500).send({
      resourceType: 'OperationOutcome',
      id: FhirService.generateUUID(),
      text: {
        status: 'generated',
        div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>服务器错误</h1><p>${error instanceof Error ? error.message : '未知错误'}</p></div>`
      },
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error instanceof Error ? error.message : '未知错误'
      }]
    })
  }
}

// 同步检查检验结果到FHIR
const syncExaminationToFhir = async (request: FastifyRequest, reply: FastifyReply) => {
  const { examinationId } = examinationIdSchema.parse(request.params)

  try {
    // 这里应该获取检查检验数据，示例中使用模拟数据
    const examination = await getExaminationData(examinationId)
    if (!examination) {
      return reply.code(404).send({
        resourceType: 'OperationOutcome',
        id: FhirService.generateUUID(),
        text: {
          status: 'generated',
          div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>错误</h1><p>检查检验不存在</p></div>`
        },
        issue: [{
          severity: 'error',
          code: 'not-found',
          diagnostics: '检查检验不存在'
        }]
      })
    }

    // 转换为FHIR Observation格式
    const fhirObservation = FhirService.examinationToFhirObservation(examination)

    // 验证FHIR资源
    const validation = FhirService.validateFhirResource(fhirObservation)
    if (!validation.valid) {
      return reply.code(400).send({
        resourceType: 'OperationOutcome',
        id: FhirService.generateUUID(),
        text: {
          status: 'generated',
          div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>验证错误</h1><p>${validation.errors.join(', ')}</p></div>`
        },
        issue: validation.errors.map(error => ({
          severity: 'error',
          code: 'invalid',
          diagnostics: error
        }))
      })
    }

    // 同步到FHIR服务器
    const syncResult = await FhirService.syncToFhirServer(fhirObservation)
    if (!syncResult.success) {
      return reply.code(500).send({
        resourceType: 'OperationOutcome',
        id: FhirService.generateUUID(),
        text: {
          status: 'generated',
          div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>同步失败</h1><p>${syncResult.error}</p></div>`
        },
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: syncResult.error
        }]
      })
    }

    return reply.type('application/fhir+json').send(fhirObservation)
  } catch (error) {
    return reply.code(500).send({
      resourceType: 'OperationOutcome',
      id: FhirService.generateUUID(),
      text: {
        status: 'generated',
        div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>服务器错误</h1><p>${error instanceof Error ? error.message : '未知错误'}</p></div>`
      },
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error instanceof Error ? error.message : '未知错误'
      }]
    })
  }
}

// 获取FHIR Capability Statement
const getFhirCapabilityStatement = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const capabilityStatement = FhirService.generateCapabilityStatement()
    return reply.type('application/fhir+json').send(capabilityStatement)
  } catch (error) {
    return reply.code(500).send({
      resourceType: 'OperationOutcome',
      id: FhirService.generateUUID(),
      text: {
        status: 'generated',
        div: `<div xmlns=\"http://www.w3.org/1999/xhtml\"><h1>服务器错误</h1><p>${error instanceof Error ? error.message : '未知错误'}</p></div>`
      },
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error instanceof Error ? error.message : '未知错误'
      }]
    })
  }
}

// 从FHIR服务器获取数据
const getFromFhirServer = async (request: FastifyRequest, reply: FastifyReply) => {
  const { resourceType, id, searchParams } = fhirQuerySchema.parse(request.query)

  try {
    const result = await FhirService.getFromFhirServer(resourceType, id, searchParams)

    if (!result.success) {
      return reply.code(400).send({
        success: false,
        error: result.error
      })
    }

    return reply.send({
      success: true,
      data: result.data
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 批量同步到FHIR服务器
const batchSyncToFhir = async (request: FastifyRequest, reply: FastifyReply) => {
  const { resourceType, resourceIds } = request.body as {
    resourceType: string
    resourceIds: number[]
  }

  try {
    const results = []

    for (const id of resourceIds) {
      // 这里应该根据resourceType获取相应的数据
      let data
      let fhirResource

      switch (resourceType) {
        case 'Patient':
          data = await getPatientData(id)
          fhirResource = FhirService.patientToFhir(data)
          break
        case 'Observation':
          data = await getExaminationData(id)
          fhirResource = FhirService.examinationToFhirObservation(data)
          break
        default:
          continue
      }

      if (fhirResource) {
        const validation = FhirService.validateFhirResource(fhirResource)
        if (validation.valid) {
          const syncResult = await FhirService.syncToFhirServer(fhirResource)
          results.push({
            id,
            success: syncResult.success,
            error: syncResult.error
          })
        } else {
          results.push({
            id,
            success: false,
            errors: validation.errors
          })
        }
      }
    }

    return reply.send({
      success: true,
      results
    })
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

// 模拟获取患者数据（实际应该从数据库获取）
async function getPatientData(patientId: number): Promise<any> {
  return {
    id: patientId,
    name: '张三',
    gender: 'MALE',
    birthDate: '1980-05-15',
    phone: '13800138001',
    address: '北京市朝阳区',
    idCard: '110101198005150001',
    status: 'ACTIVE'
  }
}

// 模拟获取检查检验数据（实际应该从数据库获取）
async function getExaminationData(examinationId: number): Promise<any> {
  return {
    id: examinationId,
    patientId: 1,
    examType: 'LABORATORY',
    examName: '血常规检查',
    result: '白细胞计数正常，血红蛋白略低',
    status: 'COMPLETED',
    createdAt: '2024-01-10T10:00:00Z',
    reportedAt: '2024-01-10T15:00:00Z',
    patient: {
      id: 1,
      name: '张三'
    },
    reporter: {
      id: 2,
      name: '李医生'
    }
  }
}

export const fhirRoutes = async (fastify: FastifyInstance) => {
  // FHIR标准接口（支持JSON和XML格式）
  fastify.get('/fhir/metadata', getFhirCapabilityStatement)

  // FHIR资源接口
  fastify.get('/fhir/:resourceType', getFhirResource)
  fastify.get('/fhir/:resourceType/:id', getFhirResource)

  // 同步接口
  fastify.post('/api/fhir/patients/:patientId/sync', {
    preHandler: requireDoctorOrNurse
  }, syncPatientToFhir)

  fastify.post('/api/fhir/examinations/:examinationId/sync', {
    preHandler: requireDoctorOrNurse
  }, syncExaminationToFhir)

  fastify.post('/api/fhir/batch-sync', {
    preHandler: requireDoctorOrNurse
  }, batchSyncToFhir)

  // 外部系统接口（API密钥认证）
  fastify.get('/api/fhir/server/get', {
    preHandler: authenticateApiKey
  }, getFromFhirServer)
}