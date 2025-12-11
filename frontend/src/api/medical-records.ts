import request from '@/utils/request'
import type {
  MedicalRecord,
  MedicalRecordCreateForm,
  MedicalRecordUpdateForm,
  MedicalRecordQuery,
  MedicalRecordListResponse,
  MedicalRecordStatistics,
  MedicalRecordApproveForm,
  MedicalRecordTemplate,
  MedicalRecordTemplateQuery,
  MedicalRecordTemplateListResponse
} from '@/types/medical-record'
import {
  RECORD_TYPE_LABELS,
  STATUS_LABELS,
  getRecordTypeColor,
  getStatusColor
} from '@/types/medical-record'

export const medicalRecordApi = {
  // 获取病历列表
  getMedicalRecords: (query?: MedicalRecordQuery) => {
    return request.get<MedicalRecordListResponse>('/medical-records', { params: query })
  },

  // 获取病历详情
  getMedicalRecordById: (id: number) => {
    return request.get<MedicalRecord>(`/medical-records/${id}`)
  },

  // 创建病历
  createMedicalRecord: (data: MedicalRecordCreateForm) => {
    return request.post<MedicalRecord>('/medical-records', data)
  },

  // 更新病历信息
  updateMedicalRecord: (id: number, data: MedicalRecordUpdateForm) => {
    return request.put<MedicalRecord>(`/medical-records/${id}`, data)
  },

  // 删除病历
  deleteMedicalRecord: (id: number) => {
    return request.delete(`/medical-records/${id}`)
  },

  // 提交病历审核
  submitMedicalRecord: (id: number) => {
    return request.post(`/medical-records/${id}/submit`)
  },

  // 审核病历
  approveMedicalRecord: (id: number, data: MedicalRecordApproveForm) => {
    return request.post(`/medical-records/${id}/approve`, data)
  },

  // 撤回病历
  withdrawMedicalRecord: (id: number, reason: string) => {
    return request.post(`/medical-records/${id}/withdraw`, { reason })
  },

  // 搜索病历
  searchMedicalRecords: (keyword: string, limit?: number) => {
    return request.get<MedicalRecord[]>('/medical-records/search', {
      params: { keyword, limit: limit || 10 }
    })
  },

  // 获取病历统计信息
  getMedicalRecordStatistics: () => {
    return request.get<MedicalRecordStatistics>('/medical-records/statistics')
  },

  // 获取我的病历列表（医生视角）
  getMyMedicalRecords: (query?: MedicalRecordQuery) => {
    return request.get<MedicalRecordListResponse>('/medical-records/my', { params: query })
  },

  // 获取患者病历列表
  getPatientMedicalRecords: (patientId: number, query?: MedicalRecordQuery) => {
    return request.get<MedicalRecordListResponse>(`/medical-records/patient/${patientId}`, { params: query })
  },

  // 导出病历数据
  exportMedicalRecords: (query?: MedicalRecordQuery) => {
    return request.get('/medical-records/export', {
      params: query,
      responseType: 'blob'
    })
  },

  // 上传病历附件
  uploadAttachment: (recordId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`/medical-records/${recordId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除病历附件
  deleteAttachment: (recordId: number, attachmentId: string) => {
    return request.delete(`/medical-records/${recordId}/attachments/${attachmentId}`)
  },

  // 复制病历
  copyMedicalRecord: (id: number) => {
    return request.post<MedicalRecord>(`/medical-records/${id}/copy`)
  },

  // 获取病历模板列表
  getMedicalRecordTemplates: (query?: MedicalRecordTemplateQuery) => {
    return request.get<MedicalRecordTemplateListResponse>('/medical-records/templates', { params: query })
  },

  // 获取病历模板详情
  getMedicalRecordTemplateById: (id: number) => {
    return request.get<MedicalRecordTemplate>(`/medical-records/templates/${id}`)
  },

  // 创建病历模板
  createMedicalRecordTemplate: (data: Partial<MedicalRecordTemplate>) => {
    return request.post<MedicalRecordTemplate>('/medical-records/templates', data)
  },

  // 更新病历模板
  updateMedicalRecordTemplate: (id: number, data: Partial<MedicalRecordTemplate>) => {
    return request.put<MedicalRecordTemplate>(`/medical-records/templates/${id}`, data)
  },

  // 删除病历模板
  deleteMedicalRecordTemplate: (id: number) => {
    return request.delete(`/medical-records/templates/${id}`)
  },

  // 使用模板创建病历
  createMedicalRecordFromTemplate: (templateId: number, patientId: number) => {
    return request.post<MedicalRecord>('/medical-records/from-template', {
      templateId,
      patientId
    })
  },

  // 获取常用诊断
  getCommonDiagnoses: (keyword?: string) => {
    return request.get<string[]>('/medical-records/common-diagnoses', {
      params: { keyword }
    })
  },

  // 获取常用药品
  getCommonMedicines: (keyword?: string) => {
    return request.get<any[]>('/medical-records/common-medicines', {
      params: { keyword }
    })
  },

  // 打印病历
  printMedicalRecord: (id: number) => {
    return request.get(`/medical-records/${id}/print`, {
      responseType: 'blob'
    })
  }
}

// 重新导出常量和函数
export {
  RECORD_TYPE_LABELS,
  STATUS_LABELS,
  getRecordTypeColor,
  getStatusColor
}