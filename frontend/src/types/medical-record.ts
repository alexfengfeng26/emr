// 病历基础信息
export interface MedicalRecord {
  id: number
  recordId: string // 病历编号，如 MR20250111001
  patientId: number
  patient: {
    id: number
    name: string
    gender: string
    age: number
    phone: string
  }
  doctorId: number
  doctor: {
    id: number
    name: string
    department: string
    title: string
  }
  type: 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY' | 'CONSULTATION' // 病历类型
  visitDate: string // 就诊日期
  department: string // 就诊科室
  chiefComplaint: string // 主诉
  presentIllness: string // 现病史
  pastHistory: string // 既往史
  physicalExam: string // 体格检查
  diagnosis: string // 诊断
  treatment: string // 治疗方案
  prescription: string // 处方
  notes: string // 备注
  attachments: string[] // 附件路径数组
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' // 状态
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' // 紧急程度
  tags: string[] // 标签
  createdAt: string
  updatedAt: string
  submittedAt?: string // 提交时间
  approvedAt?: string // 审核通过时间
  approvedBy?: {
    id: number
    name: string
    title: string
  } // 审核人
}

// 病历创建表单
export interface MedicalRecordCreateForm {
  patientId: number
  doctorId: number
  type: 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY' | 'CONSULTATION'
  visitDate: string
  department: string
  chiefComplaint: string
  presentIllness: string
  pastHistory: string
  physicalExam: string
  diagnosis: string
  treatment: string
  prescription: string
  notes: string
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  tags: string[]
}

// 病历更新表单
export interface MedicalRecordUpdateForm extends Partial<MedicalRecordCreateForm> {
  status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED'
}

// 病历查询参数
export interface MedicalRecordQuery {
  page?: number
  pageSize?: number
  keyword?: string // 关键词搜索（患者姓名、病历编号、诊断）
  patientId?: number
  doctorId?: number
  department?: string
  type?: string
  status?: string
  urgency?: string
  visitDateStart?: string
  visitDateEnd?: string
  tags?: string[]
  sortBy?: 'createdAt' | 'visitDate' | 'urgency'
  sortOrder?: 'asc' | 'desc'
}

// 病历列表响应
export interface MedicalRecordListResponse {
  items: MedicalRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 病历统计信息
export interface MedicalRecordStatistics {
  total: number
  draft: number
  submitted: number
  reviewing: number
  approved: number
  rejected: number
  byType: {
    OUTPATIENT: number
    INPATIENT: number
    EMERGENCY: number
    CONSULTATION: number
  }
  byUrgency: {
    LOW: number
    NORMAL: number
    HIGH: number
    URGENT: number
  }
  recentTrends: {
    date: string
    count: number
  }[]
}

// 病历审核表单
export interface MedicalRecordApproveForm {
  action: 'APPROVE' | 'REJECT'
  comment: string
  approvedBy: number
}

// 病历模板
export interface MedicalRecordTemplate {
  id: number
  name: string
  description: string
  type: 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY' | 'CONSULTATION'
  department: string
  content: string // 模板内容（JSON格式）
  isPublic: boolean
  createdBy: {
    id: number
    name: string
    department: string
  }
  createdAt: string
  updatedAt: string
  usageCount: number // 使用次数
}

// 病历模板查询参数
export interface MedicalRecordTemplateQuery {
  page?: number
  pageSize?: number
  keyword?: string
  type?: string
  department?: string
  isPublic?: boolean
  createdBy?: number
}

// 病历模板列表响应
export interface MedicalRecordTemplateListResponse {
  items: MedicalRecordTemplate[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 病历类型显示映射
export const RECORD_TYPE_MAP: Record<string, string> = {
  OUTPATIENT: '门诊病历',
  INPATIENT: '住院病历',
  EMERGENCY: '急诊病历',
  CONSULTATION: '会诊病历'
}

// 病历状态显示映射
export const RECORD_STATUS_MAP: Record<string, string> = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  REVIEWING: '审核中',
  APPROVED: '已审核',
  REJECTED: '已驳回'
}

// 紧急程度显示映射
export const RECORD_URGENCY_MAP: Record<string, string> = {
  LOW: '低',
  NORMAL: '普通',
  HIGH: '高',
  URGENT: '紧急'
}

// 病历状态颜色映射
export const RECORD_STATUS_COLOR_MAP: Record<string, string> = {
  DRAFT: 'info',
  SUBMITTED: 'warning',
  REVIEWING: 'primary',
  APPROVED: 'success',
  REJECTED: 'danger'
}

// 紧急程度颜色映射
export const RECORD_URGENCY_COLOR_MAP: Record<string, string> = {
  LOW: 'info',
  NORMAL: 'primary',
  HIGH: 'warning',
  URGENT: 'danger'
}

// 常用标签
export const COMMON_TAGS = [
  '高血压',
  '糖尿病',
  '心脏病',
  '感冒',
  '发烧',
  '头痛',
  '腹痛',
  '外伤',
  '过敏',
  '慢性病',
  '急性病',
  '术后',
  '复查',
  '随访'
]

// 常用诊断模板
export const COMMON_DIAGNOSES = [
  '上呼吸道感染',
  '急性胃肠炎',
  '高血压病',
  '2型糖尿病',
  '冠心病',
  '脑梗塞',
  '肺炎',
  '胃炎',
  '过敏性鼻炎',
  '颈椎病',
  '腰椎间盘突出',
  '急性阑尾炎',
  '胆囊炎',
  '泌尿系感染',
  '皮炎湿疹'
]

// 体格检查模板
export const PHYSICAL_EXAM_TEMPLATE = `一般情况：
体温：℃ 脉搏：次/分 呼吸：次/分 血压：mmHg
神志清楚，精神状态可，发育正常，营养中等

皮肤黏膜：
皮肤弹性可，无黄染、皮疹、出血点

头颈部：
头颅无畸形，眼结膜无充血，巩膜无黄染
鼻翼无扇动，咽部无充血，扁桃体无肿大
颈软，无抵抗，气管居中，甲状腺无肿大

胸部：
胸廓对称，无畸形
双肺呼吸音清晰，未闻及干湿啰音
心界不大，心率次/分，律齐，各瓣膜听诊区未闻及病理性杂音

腹部：
腹平软，无压痛、反跳痛，肝脾肋下未及
肠鸣音正常，次/分

四肢脊柱：
四肢无畸形，关节活动可，无双下肢水肿
脊柱生理弯曲存在，无压痛、叩击痛

神经系统：
生理反射存在，病理反射未引出`

// 专科检查模板（根据科室定制）
export const SPECIALIZED_EXAM_TEMPLATES: Record<string, string> = {
  '内科': PHYSICAL_EXAM_TEMPLATE,
  '外科': `一般情况：同内科\n\n专科检查：\n外科情况：伤口无红肿、渗出，愈合良好\n腹部：腹平软，无压痛，未触及包块\n四肢：无畸形，活动自如，肌力正常\n神经系统：生理反射正常，病理反射未引出`,
  '儿科': `一般情况：\n体重：kg 身高：cm\n体温：℃ 脉搏：次/分 呼吸：次/分\n发育营养：可\n\n皮肤黏膜：弹性可，无黄染、皮疹\n\n头颈部：头围cm，前囟平坦\n眼结膜无充血，口腔黏膜光滑\n\n胸部：胸廓对称，双肺呼吸音清晰\n心音有力，心率次/分，律齐\n\n腹部：腹平软，肝脾肋下未及\n肠鸣音正常\n\n四肢脊柱：无畸形，肌张力正常`
}

// 处方模板
export const PRESCRIPTION_TEMPLATE = `Rp：

用法：
每次剂量，每日次数，用药途径
连续使用天数

注意：
用药期间注意事项
禁忌症和不良反应`

// 病历类型标签映射
export const RECORD_TYPE_LABELS = {
  OUTPATIENT: '门诊病历',
  INPATIENT: '住院病历',
  EMERGENCY: '急诊病历',
  CONSULTATION: '会诊病历'
} as const

// 病历状态标签映射
export const STATUS_LABELS = {
  DRAFT: '草稿',
  SUBMITTED: '待审核',
  REVIEWING: '审核中',
  APPROVED: '已审核',
  REJECTED: '已拒绝'
} as const

// 病历状态颜色映射
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'info'
    case 'SUBMITTED':
      return 'warning'
    case 'REVIEWING':
      return 'primary'
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'danger'
    default:
      return 'info'
  }
}

// 病历类型颜色映射
export const getRecordTypeColor = (type: string) => {
  switch (type) {
    case 'OUTPATIENT':
      return 'primary'
    case 'INPATIENT':
      return 'success'
    case 'EMERGENCY':
      return 'danger'
    case 'CONSULTATION':
      return 'warning'
    default:
      return 'info'
  }
}