import request from '@/utils/request'
import type {
  Patient,
  PatientCreateForm,
  PatientUpdateForm,
  PatientQuery,
  PatientListResponse,
  PatientStatistics
} from '@/types/patient'

export const patientApi = {
  // 获取患者列表
  getPatients: (query?: PatientQuery) => {
    return request.get<PatientListResponse>('/patients', { params: query })
  },

  // 获取患者详情
  getPatientById: (id: number) => {
    return request.get<Patient>(`/patients/${id}`)
  },

  // 创建患者
  createPatient: (data: PatientCreateForm) => {
    return request.post<Patient>('/patients', data)
  },

  // 更新患者信息
  updatePatient: (id: number, data: PatientUpdateForm) => {
    return request.put<Patient>(`/patients/${id}`, data)
  },

  // 删除患者
  deletePatient: (id: number) => {
    return request.delete(`/patients/${id}`)
  },

  // 搜索患者（简单搜索）
  searchPatients: (keyword: string, limit?: number) => {
    return request.get<Patient[]>('/patients/search', {
      params: { keyword, limit: limit || 10 }
    })
  },

  // 获取患者统计信息
  getPatientStatistics: () => {
    return request.get<PatientStatistics>('/patients/statistics')
  },

  // 检查手机号是否存在
  checkPhoneExists: (phone: string, excludeId?: number) => {
    return request.get<{ exists: boolean }>('/patients/check-phone', {
      params: { phone, excludeId }
    })
  },

  // 检查身份证号是否存在
  checkIdCardExists: (idCard: string, excludeId?: number) => {
    return request.get<{ exists: boolean }>('/patients/check-id-card', {
      params: { idCard, excludeId }
    })
  },

  // 导出患者数据
  exportPatients: (query?: PatientQuery) => {
    return request.get('/patients/export', {
      params: query,
      responseType: 'blob'
    })
  },

  // 导入患者数据
  importPatients: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/patients/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}