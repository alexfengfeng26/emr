import request from '@/utils/request'
import type {
  Examination,
  ExaminationCreateForm,
  ExaminationUpdateForm,
  ExaminationQuery,
  ExaminationListResponse,
  ExaminationStatistics,
  ExaminationReport,
  ExaminationReportCreateForm,
  ExaminationSchedule,
  ExaminationTemplate,
  ExaminationTemplateQuery,
  ExaminationTemplateListResponse,
  ExaminationAttachment,
  ReportImage,
  ReportAttachment
} from '@/types/examination'

export const examinationApi = {
  // 获取检查列表
  getExaminations: (query?: ExaminationQuery) => {
    return request.get<ExaminationListResponse>('/examinations', { params: query })
  },

  // 获取检查详情
  getExaminationById: (id: number) => {
    return request.get<Examination>(`/examinations/${id}`)
  },

  // 创建检查
  createExamination: (data: ExaminationCreateForm) => {
    return request.post<Examination>('/examinations', data)
  },

  // 更新检查信息
  updateExamination: (id: number, data: ExaminationUpdateForm) => {
    return request.put<Examination>(`/examinations/${id}`, data)
  },

  // 删除检查
  deleteExamination: (id: number) => {
    return request.delete(`/examinations/${id}`)
  },

  // 取消检查
  cancelExamination: (id: number, reason: string) => {
    return request.post(`/examinations/${id}/cancel`, { reason })
  },

  // 安排检查
  scheduleExamination: (id: number, data: { scheduledDate: string, scheduledLocation: string, technicianId?: number }) => {
    return request.post(`/examinations/${id}/schedule`, data)
  },

  // 确认检查
  confirmExamination: (id: number) => {
    return request.post(`/examinations/${id}/confirm`)
  },

  // 开始检查
  startExamination: (id: number) => {
    return request.post(`/examinations/${id}/start`)
  },

  // 完成检查
  completeExamination: (id: number, data?: { actualDuration: number, notes?: string }) => {
    return request.post(`/examinations/${id}/complete`, data)
  },

  // 搜索检查
  searchExaminations: (keyword: string, limit?: number) => {
    return request.get<Examination[]>('/examinations/search', {
      params: { keyword, limit: limit || 10 }
    })
  },

  // 获取检查统计信息
  getExaminationStatistics: () => {
    return request.get<ExaminationStatistics>('/examinations/statistics')
  },

  // 获取我的检查列表（医生视角）
  getMyExaminations: (query?: ExaminationQuery) => {
    return request.get<ExaminationListResponse>('/examinations/my', { params: query })
  },

  // 获取患者检查列表
  getPatientExaminations: (patientId: number, query?: ExaminationQuery) => {
    return request.get<ExaminationListResponse>(`/examinations/patient/${patientId}`, { params: query })
  },

  // 获取今日检查
  getTodayExaminations: (department?: string) => {
    return request.get<Examination[]>('/examinations/today', {
      params: { department }
    })
  },

  // 获取待安排检查
  getPendingExaminations: (department?: string) => {
    return request.get<Examination[]>('/examinations/pending', {
      params: { department }
    })
  },

  // 获取紧急检查
  getUrgentExaminations: (department?: string) => {
    return request.get<Examination[]>('/examinations/urgent', {
      params: { department }
    })
  },

  // 获取延误检查
  getDelayedExaminations: (department?: string) => {
    return request.get<Examination[]>('/examinations/delayed', {
      params: { department }
    })
  },

  // 导出检查数据
  exportExaminations: (query?: ExaminationQuery) => {
    return request.get('/examinations/export', {
      params: query,
      responseType: 'blob'
    })
  },

  // 打印检查申请单
  printExaminationRequest: (id: number) => {
    return request.get(`/examinations/${id}/print-request`, {
      responseType: 'blob'
    })
  },

  // 批量打印检查申请单
  printExaminationRequests: (data: { examinationIds: number[] }) => {
    return request.post('/examinations/print-requests', data, {
      responseType: 'blob'
    })
  },

  // 复制检查
  copyExamination: (id: number) => {
    return request.post<Examination>(`/examinations/${id}/copy`)
  },

  // 获取检查报告
  getExaminationReports: (examinationId: number) => {
    return request.get<ExaminationReport[]>(`/examinations/${examinationId}/reports`)
  },

  // 获取检查报告详情
  getExaminationReportById: (id: number) => {
    return request.get<ExaminationReport>(`/examination-reports/${id}`)
  },

  // 创建检查报告
  createExaminationReport: (data: ExaminationReportCreateForm) => {
    return request.post<ExaminationReport>('/examination-reports', data)
  },

  // 更新检查报告
  updateExaminationReport: (id: number, data: Partial<ExaminationReportCreateForm>) => {
    return request.put<ExaminationReport>(`/examination-reports/${id}`, data)
  },

  // 删除检查报告
  deleteExaminationReport: (id: number) => {
    return request.delete(`/examination-reports/${id}`)
  },

  // 审核检查报告
  verifyExaminationReport: (id: number) => {
    return request.post(`/examination-reports/${id}/verify`)
  },

  // 签名检查报告
  signExaminationReport: (id: number, signatureData?: string) => {
    return request.post(`/examination-reports/${id}/sign`, { signatureData })
  },

  // 发布检查报告
  issueExaminationReport: (id: number) => {
    return request.post(`/examination-reports/${id}/issue`)
  },

  // 打印检查报告
  printExaminationReport: (id: number) => {
    return request.get(`/examination-reports/${id}/print`, {
      responseType: 'blob'
    })
  },

  // 获取检查预约
  getExaminationSchedules: (startDate: string, endDate: string, department?: string) => {
    return request.get<ExaminationSchedule[]>('/examinations/schedules', {
      params: { startDate, endDate, department }
    })
  },

  // 创建检查预约
  createExaminationSchedule: (data: {
    examinationId: number
    scheduledDate: string
    scheduledTime: string
    location: string
    technicianId?: number
    duration: number
    room: string
  }) => {
    return request.post<ExaminationSchedule>('/examinations/schedules', data)
  },

  // 更新检查预约
  updateExaminationSchedule: (id: number, data: Partial<ExaminationSchedule>) => {
    return request.put<ExaminationSchedule>(`/examinations/schedules/${id}`, data)
  },

  // 取消检查预约
  cancelExaminationSchedule: (id: number, reason: string) => {
    return request.post(`/examinations/schedules/${id}/cancel`, { reason })
  },

  // 确认检查预约
  confirmExaminationSchedule: (id: number) => {
    return request.post(`/examinations/schedules/${id}/confirm`)
  },

  // 获取检查模板列表
  getExaminationTemplates: (query?: ExaminationTemplateQuery) => {
    return request.get<ExaminationTemplateListResponse>('/examinations/templates', { params: query })
  },

  // 获取检查模板详情
  getExaminationTemplateById: (id: number) => {
    return request.get<ExaminationTemplate>(`/examinations/templates/${id}`)
  },

  // 创建检查模板
  createExaminationTemplate: (data: Partial<ExaminationTemplate>) => {
    return request.post<ExaminationTemplate>('/examinations/templates', data)
  },

  // 更新检查模板
  updateExaminationTemplate: (id: number, data: Partial<ExaminationTemplate>) => {
    return request.put<ExaminationTemplate>(`/examinations/templates/${id}`, data)
  },

  // 删除检查模板
  deleteExaminationTemplate: (id: number) => {
    return request.delete(`/examinations/templates/${id}`)
  },

  // 使用模板创建检查
  createExaminationFromTemplate: (templateId: number, patientId: number, medicalRecordId: number) => {
    return request.post<Examination>('/examinations/from-template', {
      templateId,
      patientId,
      medicalRecordId
    })
  },

  // 上传检查附件
  uploadExaminationAttachment: (examinationId: number, file: File, category: string, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    if (description) {
      formData.append('description', description)
    }
    return request.post(`/examinations/${examinationId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除检查附件
  deleteExaminationAttachment: (examinationId: number, attachmentId: number) => {
    return request.delete(`/examinations/${examinationId}/attachments/${attachmentId}`)
  },

  // 上传报告图片
  uploadReportImage: (reportId: number, file: File, data: {
    seriesNumber: number
    viewPosition?: string
    description?: string
    findings?: string
  }) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('seriesNumber', String(data.seriesNumber))
    if (data.viewPosition) {
      formData.append('viewPosition', data.viewPosition)
    }
    if (data.description) {
      formData.append('description', data.description)
    }
    if (data.findings) {
      formData.append('findings', data.findings)
    }
    return request.post(`/examination-reports/${reportId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除报告图片
  deleteReportImage: (reportId: number, imageId: number) => {
    return request.delete(`/examination-reports/${reportId}/images/${imageId}`)
  },

  // 上传报告附件
  uploadReportAttachment: (reportId: number, file: File, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }
    return request.post(`/examination-reports/${reportId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除报告附件
  deleteReportAttachment: (reportId: number, attachmentId: number) => {
    return request.delete(`/examination-reports/${reportId}/attachments/${attachmentId}`)
  },

  // 获取常用检查类型
  getCommonExaminationTypes: () => {
    return request.get<string[]>('/examinations/common-types')
  },

  // 获取常用检查分类
  getCommonExaminationCategories: (type?: string) => {
    return request.get<string[]>('/examinations/common-categories', {
      params: { type }
    })
  },

  // 获取检查费用估算
  getExaminationCostEstimate: (examinationIds: number[], insuranceType?: string) => {
    return request.post('/examinations/cost-estimate', {
      examinationIds,
      insuranceType
    })
  },

  // 获取检查时间预估
  getExaminationTimeEstimate: (examinationIds: number[]) => {
    return request.post('/examinations/time-estimate', {
      examinationIds
    })
  },

  // 检查冲突检查
  checkExaminationConflict: (data: {
    patientId: number
    examinationType: string
    scheduledDate: string
    duration: number
  }) => {
    return request.post('/examinations/check-conflict', data)
  },

  // 获取设备可用性
  getEquipmentAvailability: (equipment: string, startDate: string, endDate: string) => {
    return request.get('/examinations/equipment-availability', {
      params: { equipment, startDate, endDate }
    })
  },

  // 获取技师工作负荷
  getTechnicianWorkload: (technicianId: number, startDate: string, endDate: string) => {
    return request.get(`/examinations/technician/${technicianId}/workload`, {
      params: { startDate, endDate }
    })
  },

  // 获取房间使用情况
  getRoomUsage: (room: string, startDate: string, endDate: string) => {
    return request.get('/examinations/room-usage', {
      params: { room, startDate, endDate }
    })
  },

  // 发送检查提醒
  sendExaminationReminder: (examinationId: number, reminderType: 'SMS' | 'EMAIL' | 'PHONE') => {
    return request.post(`/examinations/${examinationId}/reminder`, { reminderType })
  },

  // 批量发送检查提醒
  sendBatchExaminationReminders: (data: { examinationIds: number[], reminderType: 'SMS' | 'EMAIL' | 'PHONE' }) => {
    return request.post('/examinations/batch-reminders', data)
  },

  // 获取检查执行提醒
  getExaminationReminders: () => {
    return request.get<Array<{
      id: number
      examinationId: number
      patientName: string
      examinationName: string
      scheduledTime: string
      reminderType: string
    }>>('/examinations/reminders')
  },

  // 标记提醒为已处理
  markReminderProcessed: (reminderId: number) => {
    return request.post(`/examinations/reminders/${reminderId}/processed`)
  },

  // 获取检查执行统计
  getExaminationExecutionStats: (startDate?: string, endDate?: string) => {
    return request.get('/examinations/execution-stats', {
      params: { startDate, endDate }
    })
  }
}

// 重新导出常量和函数
export {
  EXAMINATION_TYPE_LABELS,
  EXAMINATION_STATUS_LABELS,
  EXAMINATION_URGENCY_LABELS,
  EXAMINATION_PRIORITY_LABELS,
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  IMAGE_QUALITY_LABELS,
  getExaminationTypeColor,
  getExaminationStatusColor,
  getExaminationUrgencyColor,
  getExaminationPriorityColor,
  COMMON_EXAMINATION_TEMPLATES
} from '@/types/examination'