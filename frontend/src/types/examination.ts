// 检查基础信息
export interface Examination {
  id: number
  examId: string // 检查编号，如 EX20250111001
  patientId: number
  patient: {
    id: number
    name: string
    gender: string
    age: number
    phone: string
    bedNumber?: string
  }
  doctorId: number
  doctor: {
    id: number
    name: string
    department: string
    title: string
  }
  medicalRecordId: number // 关联病历ID
  type: 'LABORATORY' | 'IMAGING' | 'PATHOLOGY' | 'FUNCTION' | 'ENDOSCOPY' | 'ULTRASOUND' | 'OTHER' // 检查类型
  category: string // 检查分类
  name: string // 检查名称
  description: string // 检查描述
  clinicalIndication: string // 临床指征
  preparation: string // 检查前准备
  procedure: string // 检查方法
  status: 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REPORTED' // 检查状态
  urgency: 'ROUTINE' | 'URGENT' | 'STAT' | 'ASAP' // 紧急程度
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' // 优先级
  scheduledDate?: string // 预定检查时间
  scheduledLocation?: string // 检查地点
  estimatedDuration?: number // 预计耗时（分钟）
  notes?: string // 备注
  cost?: number // 费用
  insuranceCoverage?: number // 医保覆盖
  patientPreparation: string // 患者准备事项
  contraindications?: string // 禁忌症
  risks?: string // 风险告知
  reports: ExaminationReport[] // 检查报告
  attachments: ExaminationAttachment[] // 附件
  requestBy: number // 申请医生ID
  requestedAt: string // 申请时间
  confirmedBy?: number // 确认医生ID
  confirmedAt?: string // 确认时间
  performedBy?: number // 执行技师ID
  performedAt?: string // 实际检查时间
  completedAt?: string // 完成时间
  createdBy: number
  createdAt: string
  updatedBy?: number
  updatedAt: string
}

// 检查创建表单
export interface ExaminationCreateForm {
  patientId: number
  medicalRecordId: number
  type: 'LABORATORY' | 'IMAGING' | 'PATHOLOGY' | 'FUNCTION' | 'ENDOSCOPY' | 'ULTRASOUND' | 'OTHER'
  category: string
  name: string
  description: string
  clinicalIndication: string
  preparation: string
  procedure: string
  urgency: 'ROUTINE' | 'URGENT' | 'STAT' | 'ASAP'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  scheduledDate?: string
  scheduledLocation?: string
  estimatedDuration?: number
  notes?: string
  cost?: number
  insuranceCoverage?: number
  patientPreparation: string
  contraindications?: string
  risks?: string
}

// 检查更新表单
export interface ExaminationUpdateForm {
  category?: string
  name?: string
  description?: string
  clinicalIndication?: string
  preparation?: string
  procedure?: string
  urgency?: 'ROUTINE' | 'URGENT' | 'STAT' | 'ASAP'
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  scheduledDate?: string
  scheduledLocation?: string
  estimatedDuration?: number
  notes?: string
  cost?: number
  insuranceCoverage?: number
  patientPreparation?: string
  contraindications?: string
  risks?: string
}

// 检查查询参数
export interface ExaminationQuery {
  page?: number
  pageSize?: number
  patientId?: number
  patientName?: string
  doctorId?: number
  doctorName?: string
  medicalRecordId?: number
  type?: string
  category?: string
  status?: string
  urgency?: string
  priority?: string
  scheduledDate?: string
  startDate?: string
  endDate?: string
  department?: string
  keywords?: string
  orderBy?: 'requestedAt' | 'scheduledDate' | 'completedAt' | 'priority'
  orderDirection?: 'asc' | 'desc'
}

// 检查列表响应
export interface ExaminationListResponse {
  list: Examination[]
  total: number
  page: number
  pageSize: number
}

// 检查统计信息
export interface ExaminationStatistics {
  total: number
  requested: number
  scheduled: number
  inProgress: number
  completed: number
  reported: number
  cancelled: number
  todayExaminations: number
  thisWeekExaminations: number
  thisMonthExaminations: number
  urgentExaminations: number
  delayedExaminations: number
  // 按类型统计
  typeStats: {
    LABORATORY: number
    IMAGING: number
    PATHOLOGY: number
    FUNCTION: number
    ENDOSCOPY: number
    ULTRASOUND: number
    OTHER: number
  }
  // 按科室统计
  departmentStats: Array<{
    department: string
    count: number
  }>
  // 按状态统计
  statusStats: {
    REQUESTED: number
    SCHEDULED: number
    IN_PROGRESS: number
    COMPLETED: number
    REPORTED: number
    CANCELLED: number
  }
  // 收入统计
  revenueStats: {
    totalRevenue: number
    insuranceRevenue: number
    selfPayRevenue: number
  }
}

// 检查报告
export interface ExaminationReport {
  id: number
  examinationId: number
  reportId: string // 报告编号
  reportType: 'PRELIMINARY' | 'FINAL' | 'ADDENDUM' // 报告类型
  title: string // 报告标题
  findings: string // 检查发现
  impression: string // 影像印象/诊断意见
  conclusion: string // 结论
  recommendation: string // 建议
  abnormalFindings: string // 异常发现
  normalFindings: string // 正常发现
  technique: string // 检查技术
  comparison: string // 对比检查
  radiologistId?: number // 影像科医生ID（适用于影像检查）
  pathologistId?: number // 病理科医生ID（适用于病理检查）
  technologistId?: number // 技师ID
  reportDoctor: {
    id: number
    name: string
    department: string
    title: string
    signature?: string
  }
  reportDate: string // 报告日期
  verifiedDate?: string // 审核日期
  verifiedBy?: {
    id: number
    name: string
    department: string
    title: string
  }
  status: 'DRAFT' | 'PENDING' | 'VERIFIED' | 'SIGNED' | 'ISSUED' // 报告状态
  images: ReportImage[] // 报告图片
  attachments: ReportAttachment[] // 报告附件
  criticalFindings?: string // 重要发现
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' // 图像质量
  limitations?: string // 检查限制
  createdAt: string
  updatedAt: string
}

// 检查报告创建表单
export interface ExaminationReportCreateForm {
  examinationId: number
  reportType: 'PRELIMINARY' | 'FINAL' | 'ADDENDUM'
  title: string
  findings: string
  impression: string
  conclusion: string
  recommendation: string
  abnormalFindings?: string
  normalFindings?: string
  technique: string
  comparison?: string
  criticalFindings?: string
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  limitations?: string
}

// 报告图片
export interface ReportImage {
  id: number
  reportId: number
  imageId: string // 图片编号
  imageType: 'ORIGINAL' | 'PROCESSED' | 'ANNOTATED' // 图片类型
  seriesNumber: number // 序列号
  viewPosition: string // 摄影位置
  description?: string // 图片描述
  findings?: string // 图片发现
  imageUrl: string // 图片URL
  thumbnailUrl: string // 缩略图URL
  fileSize: number // 文件大小
  dimensions: {
    width: number
    height: number
  }
  acquisitionDate: string // 采集时间
  technician: string // 技术员
  equipment: string // 设备
  parameters: Record<string, any> // 检查参数
}

// 报告附件
export interface ReportAttachment {
  id: number
  reportId: number
  fileName: string
  fileOriginalName: string
  fileType: string
  fileSize: number
  filePath: string
  description?: string
  uploadedBy: number
  uploadedAt: string
}

// 检查附件
export interface ExaminationAttachment {
  id: number
  examinationId: number
  fileName: string
  fileOriginalName: string
  fileType: string
  fileSize: number
  filePath: string
  fileUrl: string
  thumbnailUrl?: string
  description?: string
  category: 'REQUEST_FORM' | 'CONSENT' | 'PREVIOUS_REPORT' | 'OTHER' // 附件分类
  uploadedBy: number
  uploadedAt: string
}

// 检查模板
export interface ExaminationTemplate {
  id: number
  name: string
  type: 'LABORATORY' | 'IMAGING' | 'PATHOLOGY' | 'FUNCTION' | 'ENDOSCOPY' | 'ULTRASOUND' | 'OTHER'
  category: string
  name: string
  description: string
  clinicalIndication: string
  preparation: string
  procedure: string
  patientPreparation: string
  contraindications: string
  risks: string
  department: string
  isDefault: boolean
  usageCount: number
  averageDuration: number // 平均耗时
  estimatedCost: number // 预估费用
  createdBy: number
  createdAt: string
  updatedAt: string
}

// 检查模板查询参数
export interface ExaminationTemplateQuery {
  page?: number
  pageSize?: number
  type?: string
  category?: string
  department?: string
  keywords?: string
  isDefault?: boolean
}

// 检查模板列表响应
export interface ExaminationTemplateListResponse {
  list: ExaminationTemplate[]
  total: number
  page: number
  pageSize: number
}

// 检查预约
export interface ExaminationSchedule {
  id: number
  examinationId: number
  patientId: number
  patient: {
    id: number
    name: string
    gender: string
    age: number
    phone: string
  }
  examination: {
    id: number
    name: string
    type: string
    category: string
    duration: number
  }
  scheduledDate: string
  scheduledTime: string
  duration: number
  location: string
  equipment?: string
  technicianId?: number
  technician?: {
    id: number
    name: string
    department: string
  }
  room: string
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  preparationTime?: string
  reminderSent: boolean
  confirmedBy?: number
  confirmedAt?: string
  completedAt?: string
  cancelReason?: string
  createdBy: number
  createdAt: string
  updatedAt: string
}

// 检查类型标签映射
export const EXAMINATION_TYPE_LABELS = {
  LABORATORY: '实验室检查',
  IMAGING: '影像检查',
  PATHOLOGY: '病理检查',
  FUNCTION: '功能检查',
  ENDOSCOPY: '内镜检查',
  ULTRASOUND: '超声检查',
  OTHER: '其他检查'
} as const

// 检查状态标签映射
export const EXAMINATION_STATUS_LABELS = {
  REQUESTED: '已申请',
  SCHEDULED: '已安排',
  IN_PROGRESS: '检查中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REPORTED: '已报告'
} as const

// 紧急程度标签映射
export const EXAMINATION_URGENCY_LABELS = {
  ROUTINE: '常规',
  URGENT: '紧急',
  STAT: '立即',
  ASAP: '尽快'
} as const

// 优先级标签映射
export const EXAMINATION_PRIORITY_LABELS = {
  LOW: '低',
  NORMAL: '普通',
  HIGH: '高',
  URGENT: '紧急'
} as const

// 报告类型标签映射
export const REPORT_TYPE_LABELS = {
  PRELIMINARY: '初步报告',
  FINAL: '最终报告',
  ADDENDUM: '补充报告'
} as const

// 报告状态标签映射
export const REPORT_STATUS_LABELS = {
  DRAFT: '草稿',
  PENDING: '待审核',
  VERIFIED: '已审核',
  SIGNED: '已签名',
  ISSUED: '已发布'
} as const

// 图像质量标签映射
export const IMAGE_QUALITY_LABELS = {
  EXCELLENT: '优秀',
  GOOD: '良好',
  FAIR: '一般',
  POOR: '差'
} as const

// 检查类型颜色映射
export const getExaminationTypeColor = (type: string) => {
  switch (type) {
    case 'LABORATORY':
      return 'primary'
    case 'IMAGING':
      return 'success'
    case 'PATHOLOGY':
      return 'warning'
    case 'FUNCTION':
      return 'info'
    case 'ENDOSCOPY':
      return ''
    case 'ULTRASOUND':
      return ''
    case 'OTHER':
      return 'info'
    default:
      return 'info'
  }
}

// 检查状态颜色映射
export const getExaminationStatusColor = (status: string) => {
  switch (status) {
    case 'REQUESTED':
      return 'info'
    case 'SCHEDULED':
      return 'primary'
    case 'IN_PROGRESS':
      return 'warning'
    case 'COMPLETED':
      return 'success'
    case 'REPORTED':
      return ''
    case 'CANCELLED':
      return 'danger'
    default:
      return 'info'
  }
}

// 紧急程度颜色映射
export const getExaminationUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'ROUTINE':
      return 'info'
    case 'URGENT':
      return 'warning'
    case 'STAT':
      return 'danger'
    case 'ASAP':
      return 'warning'
    default:
      return 'info'
  }
}

// 优先级颜色映射
export const getExaminationPriorityColor = (priority: string) => {
  switch (priority) {
    case 'LOW':
      return 'info'
    case 'NORMAL':
      return ''
    case 'HIGH':
      return 'warning'
    case 'URGENT':
      return 'danger'
    default:
      return 'info'
  }
}

// 常用检查模板
export const COMMON_EXAMINATION_TEMPLATES = {
  LABORATORY: [
    {
      name: '血常规检查',
      description: '全血细胞计数和分类',
      preparation: '无需特殊准备',
      procedure: '静脉采血2ml，EDTA抗凝',
      patientPreparation: '空腹8-12小时',
      estimatedDuration: 5,
      estimatedCost: 30
    },
    {
      name: '尿常规检查',
      description: '尿液物理、化学和显微镜检查',
      preparation: '清洁容器收集晨尿',
      procedure: '收集中段尿10ml',
      patientPreparation: '避免剧烈运动',
      estimatedDuration: 5,
      estimatedCost: 25
    }
  ],
  IMAGING: [
    {
      name: '胸部X光检查',
      description: '胸部正侧位片',
      preparation: '去除胸前金属物品',
      procedure: '立位拍摄正侧位片',
      patientPreparation: '深吸气屏气配合',
      estimatedDuration: 15,
      estimatedCost: 150
    },
    {
      name: '腹部超声检查',
      description: '腹部脏器超声检查',
      preparation: '空腹8-12小时',
      procedure: '仰卧位多切面扫查',
      patientPreparation: '检查前大量饮水充盈膀胱',
      estimatedDuration: 30,
      estimatedCost: 200
    }
  ]
}