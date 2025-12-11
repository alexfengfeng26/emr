import request from '@/utils/request'
import type {
  MedicalOrder,
  MedicalOrderCreateForm,
  MedicalOrderUpdateForm,
  MedicalOrderQuery,
  MedicalOrderListResponse,
  MedicalOrderStatistics,
  MedicalOrderExecuteForm,
  MedicalOrderTemplate,
  MedicalOrderTemplateQuery,
  MedicalOrderTemplateListResponse
} from '@/types/medical-order'

export const medicalOrderApi = {
  // 获取医嘱列表
  getMedicalOrders: (query?: MedicalOrderQuery) => {
    return request.get<MedicalOrderListResponse>('/medical-orders', { params: query })
  },

  // 获取医嘱详情
  getMedicalOrderById: (id: number) => {
    return request.get<MedicalOrder>(`/medical-orders/${id}`)
  },

  // 创建医嘱
  createMedicalOrder: (data: MedicalOrderCreateForm) => {
    return request.post<MedicalOrder>('/medical-orders', data)
  },

  // 更新医嘱信息
  updateMedicalOrder: (id: number, data: MedicalOrderUpdateForm) => {
    return request.put<MedicalOrder>(`/medical-orders/${id}`, data)
  },

  // 删除医嘱
  deleteMedicalOrder: (id: number) => {
    return request.delete(`/medical-orders/${id}`)
  },

  // 取消医嘱
  cancelMedicalOrder: (id: number, reason: string) => {
    return request.post(`/medical-orders/${id}/cancel`, { reason })
  },

  // 暂停医嘱
  suspendMedicalOrder: (id: number, reason: string) => {
    return request.post(`/medical-orders/${id}/suspend`, { reason })
  },

  // 恢复医嘱
  resumeMedicalOrder: (id: number) => {
    return request.post(`/medical-orders/${id}/resume`)
  },

  // 完成医嘱
  completeMedicalOrder: (id: number) => {
    return request.post(`/medical-orders/${id}/complete`)
  },

  // 执行医嘱
  executeMedicalOrder: (id: number, data: MedicalOrderExecuteForm) => {
    return request.post(`/medical-orders/${id}/execute`, data)
  },

  // 获取医嘱执行记录
  getExecutionRecords: (orderId: number) => {
    return request.get(`/medical-orders/${orderId}/executions`)
  },

  // 批量执行医嘱
  batchExecuteOrders: (data: Array<{ id: number, executionData: MedicalOrderExecuteForm }>) => {
    return request.post('/medical-orders/batch-execute', data)
  },

  // 搜索医嘱
  searchMedicalOrders: (keyword: string, limit?: number) => {
    return request.get<MedicalOrder[]>('/medical-orders/search', {
      params: { keyword, limit: limit || 10 }
    })
  },

  // 获取医嘱统计信息
  getMedicalOrderStatistics: () => {
    return request.get<MedicalOrderStatistics>('/medical-orders/statistics')
  },

  // 获取我的医嘱列表（医生视角）
  getMyMedicalOrders: (query?: MedicalOrderQuery) => {
    return request.get<MedicalOrderListResponse>('/medical-orders/my', { params: query })
  },

  // 获取患者医嘱列表
  getPatientMedicalOrders: (patientId: number, query?: MedicalOrderQuery) => {
    return request.get<MedicalOrderListResponse>(`/medical-orders/patient/${patientId}`, { params: query })
  },

  // 获取今日医嘱
  getTodayOrders: (department?: string) => {
    return request.get<MedicalOrder[]>('/medical-orders/today', {
      params: { department }
    })
  },

  // 获取待执行医嘱
  getPendingOrders: (department?: string) => {
    return request.get<MedicalOrder[]>('/medical-orders/pending', {
      params: { department }
    })
  },

  // 获取紧急医嘱
  getUrgentOrders: (department?: string) => {
    return request.get<MedicalOrder[]>('/medical-orders/urgent', {
      params: { department }
    })
  },

  // 导出医嘱数据
  exportMedicalOrders: (query?: MedicalOrderQuery) => {
    return request.get('/medical-orders/export', {
      params: query,
      responseType: 'blob'
    })
  },

  // 打印医嘱
  printMedicalOrder: (id: number) => {
    return request.get(`/medical-orders/${id}/print`, {
      responseType: 'blob'
    })
  },

  // 批量打印医嘱
  printMedicalOrders: (patientId: number) => {
    return request.get(`/medical-orders/patient/${patientId}/print`, {
      responseType: 'blob'
    })
  },

  // 验证医嘱冲突
  validateOrderConflict: (data: MedicalOrderCreateForm) => {
    return request.post('/medical-orders/validate-conflict', data)
  },

  // 复制医嘱
  copyMedicalOrder: (id: number) => {
    return request.post<MedicalOrder>(`/medical-orders/${id}/copy`)
  },

  // 获取医嘱模板列表
  getMedicalOrderTemplates: (query?: MedicalOrderTemplateQuery) => {
    return request.get<MedicalOrderTemplateListResponse>('/medical-orders/templates', { params: query })
  },

  // 获取医嘱模板详情
  getMedicalOrderTemplateById: (id: number) => {
    return request.get<MedicalOrderTemplate>(`/medical-orders/templates/${id}`)
  },

  // 创建医嘱模板
  createMedicalOrderTemplate: (data: Partial<MedicalOrderTemplate>) => {
    return request.post<MedicalOrderTemplate>('/medical-orders/templates', data)
  },

  // 更新医嘱模板
  updateMedicalOrderTemplate: (id: number, data: Partial<MedicalOrderTemplate>) => {
    return request.put<MedicalOrderTemplate>(`/medical-orders/templates/${id}`, data)
  },

  // 删除医嘱模板
  deleteMedicalOrderTemplate: (id: number) => {
    return request.delete(`/medical-orders/templates/${id}`)
  },

  // 使用模板创建医嘱
  createOrderFromTemplate: (templateId: number, patientId: number, medicalRecordId: number) => {
    return request.post<MedicalOrder>('/medical-orders/from-template', {
      templateId,
      patientId,
      medicalRecordId
    })
  },

  // 获取常用频次
  getCommonFrequencies: () => {
    return request.get<string[]>('/medical-orders/common-frequencies')
  },

  // 获取常用给药途径
  getCommonRoutes: () => {
    return request.get<string[]>('/medical-orders/common-routes')
  },

  // 获取常用医嘱分类
  getCommonCategories: (type?: string) => {
    return request.get<string[]>('/medical-orders/common-categories', {
      params: { type }
    })
  },

  // 获取药物相互作用检查
  checkDrugInteractions: (medications: string[]) => {
    return request.post('/medical-orders/check-drug-interactions', { medications })
  },

  // 获取药物过敏检查
  checkAllergyConflict: (patientId: number, medications: string[]) => {
    return request.post(`/medical-orders/patient/${patientId}/check-allergy`, { medications })
  },

  // 获取剂量检查
  checkDosage: (medication: string, dosage: string, patientAge?: number, patientWeight?: number) => {
    return request.post('/medical-orders/check-dosage', {
      medication,
      dosage,
      patientAge,
      patientWeight
    })
  },

  // 获取医嘱执行提醒
  getExecutionReminders: () => {
    return request.get<Array<{
      id: number
      orderId: number
      patientName: string
      orderTitle: string
      scheduledTime: string
      priority: string
    }>>('/medical-orders/execution-reminders')
  },

  // 标记提醒为已读
  markReminderRead: (reminderId: number) => {
    return request.post(`/medical-orders/reminders/${reminderId}/read`)
  },

  // 获取医嘱执行统计
  getExecutionStatistics: (startDate?: string, endDate?: string) => {
    return request.get('/medical-orders/execution-statistics', {
      params: { startDate, endDate }
    })
  },

  // 获取科室医嘱统计
  getDepartmentOrderStats: (department: string, startDate?: string, endDate?: string) => {
    return request.get(`/medical-orders/department/${department}/stats`, {
      params: { startDate, endDate }
    })
  },

  // 获取医生医嘱统计
  getDoctorOrderStats: (doctorId: number, startDate?: string, endDate?: string) => {
    return request.get(`/medical-orders/doctor/${doctorId}/stats`, {
      params: { startDate, endDate }
    })
  }
}

// 重新导出常量和函数
export {
  ORDER_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  URGENCY_LABELS,
  PRIORITY_LABELS,
  EXECUTION_RESULT_LABELS,
  ROUTE_LABELS,
  FREQUENCY_LABELS,
  getOrderTypeColor,
  getOrderStatusColor,
  getUrgencyColor,
  getPriorityColor,
  getExecutionResultColor,
  COMMON_ORDER_TEMPLATES
} from '@/types/medical-order'