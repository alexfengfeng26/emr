// 医嘱基础信息
export interface MedicalOrder {
  id: number
  orderId: string // 医嘱编号，如 MO20250111001
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
  type: 'MEDICATION' | 'TREATMENT' | 'EXAMINATION' | 'DIET' | 'NURSING' | 'DISCHARGE' // 医嘱类型
  category: string // 医嘱分类
  title: string // 医嘱标题
  content: string // 医嘱内容
  frequency: string // 执行频次，如 "qd", "bid", "tid", "qid", "qod"
  dosage?: string // 剂量
  route?: string // 给药途径，如 "po", "iv", "im", "sc"
  startDate: string // 开始时间
  endDate?: string // 结束时间
  urgency: 'ROUTINE' | 'STAT' | 'AS_NEEDED' // 紧急程度
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED' // 医嘱状态
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' // 优先级
  notes?: string // 备注
  indications?: string // 适应症
  contraindications?: string // 禁忌症
  sideEffects?: string // 副作用
  executionRecords: ExecutionRecord[] // 执行记录
  createdBy: number
  createdAt: string
  updatedBy?: number
  updatedAt: string
  executedBy?: number
  executedAt?: string
  completedAt?: string
  cancelledBy?: number
  cancelledAt?: string
  cancelReason?: string
}

// 医嘱创建表单
export interface MedicalOrderCreateForm {
  patientId: number
  medicalRecordId: number
  type: 'MEDICATION' | 'TREATMENT' | 'EXAMINATION' | 'DIET' | 'NURSING' | 'DISCHARGE'
  category: string
  title: string
  content: string
  frequency: string
  dosage?: string
  route?: string
  startDate: string
  endDate?: string
  urgency: 'ROUTINE' | 'STAT' | 'AS_NEEDED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes?: string
  indications?: string
  contraindications?: string
  sideEffects?: string
}

// 医嘱更新表单
export interface MedicalOrderUpdateForm {
  category?: string
  title?: string
  content?: string
  frequency?: string
  dosage?: string
  route?: string
  startDate?: string
  endDate?: string
  urgency?: 'ROUTINE' | 'STAT' | 'AS_NEEDED'
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes?: string
  indications?: string
  contraindications?: string
  sideEffects?: string
}

// 医嘱查询参数
export interface MedicalOrderQuery {
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
  startDate?: string
  endDate?: string
  department?: string
  keywords?: string
  orderBy?: 'createdAt' | 'updatedAt' | 'startDate' | 'priority'
  orderDirection?: 'asc' | 'desc'
}

// 医嘱列表响应
export interface MedicalOrderListResponse {
  list: MedicalOrder[]
  total: number
  page: number
  pageSize: number
}

// 医嘱统计信息
export interface MedicalOrderStatistics {
  total: number
  pending: number
  active: number
  completed: number
  cancelled: number
  todayOrders: number
  todayExecutions: number
  urgentOrders: number
  expiredOrders: number
  // 按类型统计
  typeStats: {
    MEDICATION: number
    TREATMENT: number
    EXAMINATION: number
    DIET: number
    NURSING: number
    DISCHARGE: number
  }
  // 按科室统计
  departmentStats: Array<{
    department: string
    count: number
  }>
  // 按优先级统计
  priorityStats: {
    LOW: number
    NORMAL: number
    HIGH: number
    URGENT: number
  }
}

// 执行记录
export interface ExecutionRecord {
  id: number
  orderId: number
  executedBy: number
  executor: {
    id: number
    name: string
    role: string
    department: string
  }
  executionTime: string
  result: 'SUCCESS' | 'FAILED' | 'SKIPPED'
  notes?: string
  actualDosage?: string
  reaction?: string
  nextExecutionTime?: string
}

// 医嘱执行表单
export interface MedicalOrderExecuteForm {
  result: 'SUCCESS' | 'FAILED' | 'SKIPPED'
  notes?: string
  actualDosage?: string
  reaction?: string
  nextExecutionTime?: string
}

// 医嘱模板
export interface MedicalOrderTemplate {
  id: number
  name: string
  type: 'MEDICATION' | 'TREATMENT' | 'EXAMINATION' | 'DIET' | 'NURSING' | 'DISCHARGE'
  category: string
  title: string
  content: string
  frequency: string
  dosage?: string
  route?: string
  urgency: 'ROUTINE' | 'STAT' | 'AS_NEEDED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  indications?: string
  contraindications?: string
  sideEffects?: string
  department: string
  isDefault: boolean
  usageCount: number
  createdBy: number
  createdAt: string
  updatedAt: string
}

// 医嘱模板查询参数
export interface MedicalOrderTemplateQuery {
  page?: number
  pageSize?: number
  type?: string
  category?: string
  department?: string
  keywords?: string
  isDefault?: boolean
}

// 医嘱模板列表响应
export interface MedicalOrderTemplateListResponse {
  list: MedicalOrderTemplate[]
  total: number
  page: number
  pageSize: number
}

// 医嘱类型标签映射
export const ORDER_TYPE_LABELS = {
  MEDICATION: '药物医嘱',
  TREATMENT: '治疗医嘱',
  EXAMINATION: '检查医嘱',
  DIET: '饮食医嘱',
  NURSING: '护理医嘱',
  DISCHARGE: '出院医嘱'
} as const

// 医嘱状态标签映射
export const ORDER_STATUS_LABELS = {
  PENDING: '待执行',
  ACTIVE: '执行中',
  SUSPENDED: '已暂停',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
} as const

// 紧急程度标签映射
export const URGENCY_LABELS = {
  ROUTINE: '常规',
  STAT: '紧急',
  AS_NEEDED: '必要时'
} as const

// 优先级标签映射
export const PRIORITY_LABELS = {
  LOW: '低',
  NORMAL: '普通',
  HIGH: '高',
  URGENT: '紧急'
} as const

// 执行结果标签映射
export const EXECUTION_RESULT_LABELS = {
  SUCCESS: '成功',
  FAILED: '失败',
  SKIPPED: '跳过'
} as const

// 给药途径标签映射
export const ROUTE_LABELS = {
  po: '口服',
  iv: '静脉注射',
  im: '肌肉注射',
  sc: '皮下注射',
  topical: '外用',
  inhalation: '吸入',
  rectal: '直肠给药',
  ng: '鼻饲'
} as const

// 频次标签映射
export const FREQUENCY_LABELS = {
  qd: '每日一次',
  bid: '每日两次',
  tid: '每日三次',
  qid: '每日四次',
  qod: '隔日一次',
  qw: '每周一次',
  biw: '每周两次',
  tiw: '每周三次',
  qh: '每小时一次',
  q2h: '每2小时一次',
  q4h: '每4小时一次',
  q6h: '每6小时一次',
  q8h: '每8小时一次',
  q12h: '每12小时一次',
  prn: '必要时',
  stat: '立即'
} as const

// 医嘱类型颜色映射
export const getOrderTypeColor = (type: string) => {
  switch (type) {
    case 'MEDICATION':
      return 'primary'
    case 'TREATMENT':
      return 'success'
    case 'EXAMINATION':
      return 'warning'
    case 'DIET':
      return 'info'
    case 'NURSING':
      return ''
    case 'DISCHARGE':
      return 'danger'
    default:
      return 'info'
  }
}

// 医嘱状态颜色映射
export const getOrderStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'ACTIVE':
      return 'success'
    case 'SUSPENDED':
      return 'info'
    case 'COMPLETED':
      return ''
    case 'CANCELLED':
      return 'danger'
    default:
      return 'info'
  }
}

// 紧急程度颜色映射
export const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'ROUTINE':
      return 'info'
    case 'STAT':
      return 'danger'
    case 'AS_NEEDED':
      return 'warning'
    default:
      return 'info'
  }
}

// 优先级颜色映射
export const getPriorityColor = (priority: string) => {
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

// 执行结果颜色映射
export const getExecutionResultColor = (result: string) => {
  switch (result) {
    case 'SUCCESS':
      return 'success'
    case 'FAILED':
      return 'danger'
    case 'SKIPPED':
      return 'warning'
    default:
      return 'info'
  }
}

// 常用医嘱模板
export const COMMON_ORDER_TEMPLATES = {
  MEDICATION: [
    {
      title: '抗生素治疗',
      content: '抗生素静脉滴注，每日2次',
      frequency: 'bid',
      route: 'iv',
      urgency: 'ROUTINE',
      priority: 'NORMAL'
    },
    {
      title: '止痛药',
      content: '止痛药口服，必要时使用',
      frequency: 'prn',
      route: 'po',
      urgency: 'AS_NEEDED',
      priority: 'NORMAL'
    }
  ],
  TREATMENT: [
    {
      title: '物理降温',
      content: '温水擦浴，体温超过38.5℃时使用',
      frequency: 'prn',
      urgency: 'AS_NEEDED',
      priority: 'NORMAL'
    },
    {
      title: '吸氧',
      content: '鼻导管吸氧，2-3L/min',
      frequency: 'qd',
      urgency: 'ROUTINE',
      priority: 'NORMAL'
    }
  ],
  NURSING: [
    {
      title: '生命体征监测',
      content: '每日测量体温、脉搏、呼吸、血压4次',
      frequency: 'qid',
      urgency: 'ROUTINE',
      priority: 'NORMAL'
    },
    {
      title: '伤口护理',
      content: '每日换药一次，观察伤口愈合情况',
      frequency: 'qd',
      urgency: 'ROUTINE',
      priority: 'NORMAL'
    }
  ]
}