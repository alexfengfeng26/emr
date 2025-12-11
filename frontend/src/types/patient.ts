// 患者基础信息
export interface Patient {
  id: number
  patientId: string // 患者编号，如 P20250111001
  name: string // 姓名
  gender: 'MALE' | 'FEMALE' // 性别
  birthDate: string // 出生日期，YYYY-MM-DD
  age?: number // 年龄（自动计算）
  phone: string // 手机号码
  idCard: string // 身份证号
  email?: string // 邮箱
  address: string // 地址
  emergencyContact: string // 紧急联系人
  emergencyPhone: string // 紧急联系人电话
  bloodType: 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN' // 血型
  rhFactor: 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN' // Rh因子
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' // 婚姻状况
  occupation?: string // 职业
  employer?: string // 工作单位
  insuranceType: 'BASIC' | 'COMMERCIAL' | 'SELF_PAY' | 'OTHER' // 医保类型
  insuranceNumber?: string // 医保号
  allergies?: string[] // 过敏史
  medicalHistory?: string // 病史
  familyHistory?: string // 家族史
  status: 'ACTIVE' | 'INACTIVE' | 'DECEASED' // 状态
  createdAt: string
  updatedAt: string
}

// 患者创建表单
export interface PatientCreateForm {
  name: string
  gender: 'MALE' | 'FEMALE'
  birthDate: string
  phone: string
  idCard: string
  email?: string
  address: string
  emergencyContact: string
  emergencyPhone: string
  bloodType: 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN'
  rhFactor: 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN'
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'
  occupation?: string
  employer?: string
  insuranceType: 'BASIC' | 'COMMERCIAL' | 'SELF_PAY' | 'OTHER'
  insuranceNumber?: string
  allergies?: string[]
  medicalHistory?: string
  familyHistory?: string
}

// 患者更新表单
export interface PatientUpdateForm extends Partial<PatientCreateForm> {
  status?: 'ACTIVE' | 'INACTIVE' | 'DECEASED'
}

// 患者查询参数
export interface PatientQuery {
  page?: number
  pageSize?: number
  keyword?: string // 关键词搜索（姓名、手机号、身份证号、患者编号）
  gender?: 'MALE' | 'FEMALE'
  ageMin?: number
  ageMax?: number
  bloodType?: string
  insuranceType?: string
  status?: string
  sortBy?: 'createdAt' | 'name' | 'age'
  sortOrder?: 'asc' | 'desc'
}

// 患者列表响应
export interface PatientListResponse {
  items: Patient[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 患者统计信息
export interface PatientStatistics {
  total: number
  active: number
  inactive: number
  maleCount: number
  femaleCount: number
  ageGroups: {
    '0-18': number
    '19-35': number
    '36-50': number
    '51-65': number
    '65+': number
  }
  bloodTypeStats: {
    A: number
    B: number
    AB: number
    O: number
    UNKNOWN: number
  }
}

// 性别显示映射
export const GENDER_MAP: Record<string, string> = {
  MALE: '男',
  FEMALE: '女'
}

// 血型显示映射
export const BLOOD_TYPE_MAP: Record<string, string> = {
  A: 'A型',
  B: 'B型',
  AB: 'AB型',
  O: 'O型',
  UNKNOWN: '未知'
}

// Rh因子显示映射
export const RH_FACTOR_MAP: Record<string, string> = {
  POSITIVE: '阳性',
  NEGATIVE: '阴性',
  UNKNOWN: '未知'
}

// 婚姻状况显示映射
export const MARITAL_STATUS_MAP: Record<string, string> = {
  SINGLE: '未婚',
  MARRIED: '已婚',
  DIVORCED: '离异',
  WIDOWED: '丧偶'
}

// 医保类型显示映射
export const INSURANCE_TYPE_MAP: Record<string, string> = {
  BASIC: '基本医保',
  COMMERCIAL: '商业保险',
  SELF_PAY: '自费',
  OTHER: '其他'
}

// 状态显示映射
export const PATIENT_STATUS_MAP: Record<string, string> = {
  ACTIVE: '正常',
  INACTIVE: '停诊',
  DECEASED: '已故'
}