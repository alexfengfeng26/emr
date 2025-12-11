// 药品基础信息
export interface Medicine {
  id: number
  medicineId: string // 药品编号，如 MD20250111001
  genericName: string // 通用名
  tradeName: string // 商品名
  brandName: string // 品牌名
  category: string // 药品分类
  subcategory: string // 子分类
  type: 'PRESCRIPTION' | 'OTC' | 'INJECTABLE' | 'TOPICAL' | 'INHALATION' | 'SUPPOSITORY' | 'EYE_DROP' | 'EAR_DROP' | 'NOSE_SPRAY' | 'OTHER' // 药品类型
  dosageForm: string // 剂型（片剂、胶囊、注射液等）
  specification: string // 规格
  strength: string // 含量规格
  manufacturer: string // 生产厂家
  country: string // 生产国家
  approvalNumber: string // 批准文号
  licenseNumber: string // 许可证号
  barcode: string // 条形码
  description: string // 药品描述
  indications: string[] // 适应症
  contraindications: string[] // 禁忌症
  sideEffects: string[] // 副作用
  dosageAdministration: string[] // 用法用量
  precautions: string[] // 注意事项
  storageConditions: string // 储存条件
  shelfLife: number // 保质期（月）
  price: number // 单价
  retailPrice: number // 零售价
  purchasePrice: number // 进货价
  insuranceCoverage: boolean // 医保覆盖
  prescriptionRequired: boolean // 需要处方
  controlledSubstance: boolean // 管制药品
  highRiskMedicine: boolean // 高危药品
  specialStorage: boolean // 特殊储存要求
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'RECALLLED' // 药品状态
  supplier: {
    id: number
    name: string
    contact: string
    phone: string
    address: string
  }
  createdAt: string
  updatedAt: string
  createdBy: number
  updatedBy?: number
}

// 药品创建表单
export interface MedicineCreateForm {
  genericName: string
  tradeName: string
  brandName?: string
  category: string
  subcategory: string
  type: 'PRESCRIPTION' | 'OTC' | 'INJECTABLE' | 'TOPICAL' | 'INHALATION' | 'SUPPOSITORY' | 'EYE_DROP' | 'EAR_DROP' | 'NOSE_SPRAY' | 'OTHER'
  dosageForm: string
  specification: string
  strength: string
  manufacturer: string
  country: string
  approvalNumber: string
  licenseNumber: string
  barcode?: string
  description: string
  indications: string[]
  contraindications: string[]
  sideEffects: string[]
  dosageAdministration: string[]
  precautions: string[]
  storageConditions: string
  shelfLife: number
  price: number
  retailPrice: number
  purchasePrice: number
  insuranceCoverage: boolean
  prescriptionRequired: boolean
  controlledSubstance: boolean
  highRiskMedicine: boolean
  specialStorage: boolean
  supplierId: number
}

// 药品更新表单
export interface MedicineUpdateForm {
  genericName?: string
  tradeName?: string
  brandName?: string
  category?: string
  subcategory?: string
  type?: 'PRESCRIPTION' | 'OTC' | 'INJECTABLE' | 'TOPICAL' | 'INHALATION' | 'SUPPOSITORY' | 'EYE_DROP' | 'EAR_DROP' | 'NOSE_SPRAY' | 'OTHER'
  dosageForm?: string
  specification?: string
  strength?: string
  manufacturer?: string
  country?: string
  approvalNumber?: string
  licenseNumber?: string
  barcode?: string
  description?: string
  indications?: string[]
  contraindications?: string[]
  sideEffects?: string[]
  dosageAdministration?: string[]
  precautions?: string[]
  storageConditions?: string
  shelfLife?: number
  price?: number
  retailPrice?: number
  purchasePrice?: number
  insuranceCoverage?: boolean
  prescriptionRequired?: boolean
  controlledSubstance?: boolean
  highRiskMedicine?: boolean
  specialStorage?: boolean
  supplierId?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'RECALLED'
}

// 药品查询参数
export interface MedicineQuery {
  page?: number
  pageSize?: number
  genericName?: string
  tradeName?: string
  brandName?: string
  category?: string
  subcategory?: string
  type?: string
  dosageForm?: string
  manufacturer?: string
  country?: string
  supplierId?: number
  barcode?: string
  status?: string
  priceRange?: [number, number]
  insuranceCoverage?: boolean
  prescriptionRequired?: boolean
  controlledSubstance?: boolean
  highRiskMedicine?: boolean
  keywords?: string
  orderBy?: 'genericName' | 'tradeName' | 'createdAt' | 'price' | 'stock'
  orderDirection?: 'asc' | 'desc'
}

// 药品列表响应
export interface MedicineListResponse {
  list: Medicine[]
  total: number
  page: number
  pageSize: number
}

// 药品库存
export interface MedicineStock {
  id: number
  medicineId: number
  medicine: {
    id: number
    genericName: string
    tradeName: string
    brandName: string
    specification: string
    manufacturer: string
    dosageForm: string
  }
  warehouse: {
    id: number
    name: string
    location: string
    manager: string
  }
  batchNumber: string // 批次号
  manufactureDate: string // 生产日期
  expiryDate: string // 过期日期
  currentStock: number // 当前库存
  minStock: number // 最低库存
  maxStock: number // 最高库存
  unit: string // 单位
  location: string // 存储位置
  status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'DAMAGED' | 'QUARANTINE' | 'DISPOSED' // 库存状态
  lastRestockDate: string // 最后补货日期
  lastUsageDate: string // 最后使用日期
  averageMonthlyUsage: number // 月均用量
  purchasePrice: number // 采购价格
  sellingPrice: number // 销售价格
  totalValue: number // 总价值
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' // 风险评估
  notes?: string // 备注
  createdAt: string
  updatedAt: string
}

// 药品库存查询参数
export interface MedicineStockQuery {
  page?: number
  pageSize?: number
  medicineId?: number
  warehouseId?: number
  batchNumber?: string
  status?: string
  riskAssessment?: string
  lowStock?: boolean
  expired?: boolean
  location?: string
  unit?: string
  manufactureDateRange?: [string, string]
  expiryDateRange?: [string, string]
  stockRange?: [number, number]
  orderBy?: 'currentStock' | 'expiryDate' | 'lastUsageDate' | 'totalValue'
  orderDirection?: 'asc' | 'desc'
}

// 药品库存列表响应
export interface MedicineStockListResponse {
  list: MedicineStock[]
  total: number
  page: number
  pageSize: number
}

// 药品库存统计
export interface MedicineStockStatistics {
  totalMedicines: number
  totalWarehouses: number
  totalValue: number
  totalItems: number
  normalStock: number
  lowStock: number
  outOfStock: number
  expiredItems: number
  expiredValue: number
  riskAssessment: {
    LOW: number
    MEDIUM: number
    HIGH: number
    CRITICAL: number
  }
  categoryStats: Array<{
    category: string
    count: number
    value: number
    percentage: number
  }>
  warehouseStats: Array<{
    warehouse: string
    count: number
    value: number
    utilization: number
  }>
  stockTurnover: {
    turnoverRate: number
    averageTurnoverDays: number
    categoryTurnovers: Array<{
      category: string
      turnoverRate: number
      averageTurnoverDays: number
    }>
  }
}

// 处方
export interface Prescription {
  id: number
  prescriptionId: string // 处方编号，如 RX20250111001
  patientId: number
  patient: {
    id: number
    name: string
    gender: string
    age: number
    phone: string
    medicalRecordNumber: string
  }
  doctorId: number
  doctor: {
    id: number
    name: string
    department: string
    title: string
    licenseNumber: string
  }
  medicalRecordId: number
  prescriptionDate: string // 开具日期
  prescriptionType: 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY' // 处方类型
  diagnosis: string[] // 诊断
  items: PrescriptionItem[] // 处方项目
  totalAmount: number // 总金额
  insuranceAmount: number // 医保金额
  selfPayAmount: number // 自付金额
  status: 'DRAFT' | 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' // 处方状态
  priority: 'ROUTINE' | 'URGENT' | 'STAT' // 优先级
  notes?: string // 备注
  pharmacistId?: number // 审核药剂师ID
  pharmacist?: {
    id: number
    name: string
    department: string
    licenseNumber: string
  }
  dispensingPharmacistId?: number // 调剂药剂师ID
  dispensingPharmacist?: {
    id: number
    name: string
    department: string
    licenseNumber: string
  }
  paymentStatus: 'UNPAID' | 'PARTIAL_PAID' | 'PAID' | 'REFUNDED' // 支付状态
  paymentMethod: 'CASH' | 'CARD' | 'INSURANCE' | 'ONLINE' | 'OTHER' // 支付方式
  insuranceType?: string // 医保类型
  verificationCode?: string // 处方验证码
  digitalSignature?: string // 数字签名
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// 处方项目
export interface PrescriptionItem {
  id: number
  prescriptionId: number
  medicineId: number
  medicine: {
    id: number
    genericName: string
    tradeName: string
    specification: string
    dosageForm: string
    manufacturer: string
    category: string
  }
  quantity: number // 数量
  unit: string // 单位
  dosage: string // 用量
  frequency: string // 频次
  duration: number // 疗程天数
  route: string // 给药途径
  instructions: string // 用法说明
  indication: string // 适应症
  unitPrice: number // 单价
  totalPrice: number // 总价
  discount: number // 折扣
  finalPrice: number // 最终价格
  stockId?: number // 库存ID
  stockBatch?: string // 库存批次
  notes?: string // 备注
  status: 'ACTIVE' | 'MODIFIED' | 'CANCELLED' // 项目状态
}

// 处方创建表单
export interface PrescriptionCreateForm {
  patientId: number
  medicalRecordId: number
  prescriptionType: 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY'
  diagnosis: string[]
  items: Array<{
    medicineId: number
    quantity: number
    unit: string
    dosage: string
    frequency: string
    duration: number
    route: string
    instructions: string
    indication: string
    unitPrice: number
    discount: number
    notes?: string
  }>
  totalAmount: number
  insuranceAmount: number
  selfPayAmount: number
  priority: 'ROUTINE' | 'URGENT' | 'STAT'
  notes?: string
  insuranceType?: string
}

// 处方查询参数
export interface PrescriptionQuery {
  page?: number
  pageSize?: number
  patientId?: number
  patientName?: string
  doctorId?: number
  doctorName?: string
  medicalRecordId?: number
  prescriptionType?: string
  status?: string
  priority?: string
  prescriptionDate?: string
  dateRange?: [string, string]
  paymentStatus?: string
  insuranceType?: string
  keywords?: string
  totalAmountRange?: [number, number]
  orderBy?: 'prescriptionDate' | 'totalAmount' | 'status' | 'priority'
  orderDirection?: 'asc' | 'desc'
}

// 处方列表响应
export interface PrescriptionListResponse {
  list: Prescription[]
  total: number
  page: number
  pageSize: number
}

// 处方统计信息
export interface PrescriptionStatistics {
  totalPrescriptions: number
  todayPrescriptions: number
  thisWeekPrescriptions: number
  thisMonthPrescriptions: number
  totalAmount: number
  todayAmount: number
  thisWeekAmount: number
  thisMonthAmount: number
  insuranceAmount: number
  selfPayAmount: number
  averageAmount: number
  typeStats: {
    OUTPATIENT: number
    INPATIENT: number
    EMERGENCY: number
  }
  statusStats: {
    DRAFT: number
    SUBMITTED: number
    PROCESSING: number
    COMPLETED: number
    CANCELLED: number
    REJECTED: number
  }
  paymentStats: {
    UNPAID: number
    PARTIAL_PAID: number
    PAID: number
    REFUNDED: number
  }
  topMedicines: Array<{
    medicineName: string
    frequency: number
    totalQuantity: number
    totalAmount: number
  }>
  doctorStats: Array<{
    doctorName: string
    department: string
    prescriptionCount: number
    totalAmount: number
    averageAmount: number
  }>
}

// 用药统计
export interface MedicationUsageStatistics {
  totalMedications: number
  thisMonthMedications: number
  thisYearMedications: number
  totalPatients: number
  averageMedicationsPerPatient: number
  topCategories: Array<{
    category: string
    count: number
    percentage: number
    amount: number
  }>
  topMedicines: Array<{
    medicineName: string
    count: number
    amount: number
    stockTurnover: number
  }>
  departmentUsage: Array<{
    department: string
    prescriptionCount: number
    totalAmount: number
    averageAmount: number
  }>
  monthlyUsage: Array<{
    month: string
    prescriptionCount: number
    totalAmount: number
    patientCount: number
  }>
  ageGroupUsage: Array<{
    ageGroup: string
    prescriptionCount: number
    averageAmount: number
    commonCategories: string[]
  }>
}

// 药品类型标签映射
export const MEDICINE_TYPE_LABELS = {
  PRESCRIPTION: '处方药',
  OTC: '非处方药',
  INJECTABLE: '注射剂',
  TOPICAL: '外用药',
  INHALATION: '吸入剂',
  SUPPOSITORY: '栓剂',
  EYE_DROP: '眼药水',
  EAR_DROP: '耳滴剂',
  NOSE_SPRAY: '鼻喷剂',
  OTHER: '其他'
} as const

// 药品状态标签映射
export const MEDICINE_STATUS_LABELS = {
  ACTIVE: '在售',
  INACTIVE: '停用',
  DISCONTINUED: '停产',
  RECALLED: '召回'
} as const

// 库存状态标签映射
export const STOCK_STATUS_LABELS = {
  NORMAL: '正常',
  LOW_STOCK: '库存不足',
  OUT_OF_STOCK: '缺货',
  EXPIRED: '已过期',
  DAMAGED: '损坏',
  QUARANTINE: '隔离',
  DISPOSED: '已处理'
} as const

// 处方类型标签映射
export const PRESCRIPTION_TYPE_LABELS = {
  OUTPATIENT: '门诊处方',
  INPATIENT: '住院处方',
  EMERGENCY: '急诊处方'
} as const

// 处方状态标签映射
export const PRESCRIPTION_STATUS_LABELS = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REJECTED: '已拒绝'
} as const

// 支付状态标签映射
export const PAYMENT_STATUS_LABELS = {
  UNPAID: '未支付',
  PARTIAL_PAID: '部分支付',
  PAID: '已支付',
  REFUNDED: '已退款'
} as const

// 药品类型颜色映射
export const getMedicineTypeColor = (type: string) => {
  switch (type) {
    case 'PRESCRIPTION':
      return 'primary'
    case 'OTC':
      return 'success'
    case 'INJECTABLE':
      return 'warning'
    case 'TOPICAL':
      return 'info'
    case 'INHALATION':
      return ''
    case 'SUPPOSITORY':
      return ''
    case 'EYE_DROP':
      return ''
    case 'EAR_DROP':
      return ''
    case 'NOSE_SPRAY':
      return ''
    case 'OTHER':
      return 'info'
    default:
      return 'info'
  }
}

// 药品状态颜色映射
export const getMedicineStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'warning'
    case 'DISCONTINUED':
      return 'info'
    case 'RECALLED':
      return 'danger'
    default:
      return 'info'
  }
}

// 库存状态颜色映射
export const getStockStatusColor = (status: string) => {
  switch (status) {
    case 'NORMAL':
      return 'success'
    case 'LOW_STOCK':
      return 'warning'
    case 'OUT_OF_STOCK':
      return 'danger'
    case 'EXPIRED':
      return 'danger'
    case 'DAMAGED':
      return 'warning'
    case 'QUARANTINE':
      return 'warning'
    case 'DISPOSED':
      return 'info'
    default:
      return 'info'
  }
}

// 处方类型颜色映射
export const getPrescriptionTypeColor = (type: string) => {
  switch (type) {
    case 'OUTPATIENT':
      return 'primary'
    case 'INPATIENT':
      return 'success'
    case 'EMERGENCY':
      return 'danger'
    default:
      return 'info'
  }
}

// 处方状态颜色映射
export const getPrescriptionStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'info'
    case 'SUBMITTED':
      return 'primary'
    case 'PROCESSING':
      return 'warning'
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'warning'
    case 'REJECTED':
      return 'danger'
    default:
      return 'info'
  }
}

// 支付状态颜色映射
export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'UNPAID':
      return 'danger'
    case 'PARTIAL_PAID':
      return 'warning'
    case 'PAID':
      return 'success'
    case 'REFUNDED':
      return 'info'
    default:
      return 'info'
  }
}

// 风险评估颜色映射
export const getRiskAssessmentColor = (risk: string) => {
  switch (risk) {
    case 'LOW':
      return 'success'
    case 'MEDIUM':
      return 'warning'
    case 'HIGH':
      return 'danger'
    case 'CRITICAL':
      return 'danger'
    default:
      return 'info'
  }
}

// 常用药品分类
export const COMMON_MEDICINE_CATEGORIES = [
  '抗生素类',
  '心血管系统用药',
  '消化系统用药',
  '呼吸系统用药',
  '神经系统用药',
  '内分泌系统用药',
  '泌尿系统用药',
  '抗肿瘤药',
  '解热镇痛药',
  '维生素类',
  '营养治疗药',
  '皮肤科用药',
  '眼科用药',
  '耳鼻喉科用药',
  '妇科用药',
  '儿科用药',
  '外科用药',
  '麻醉药',
  '诊断用药',
  '中成药',
  '生物制品',
  '造影剂',
  '消毒用品'
]

// 常用给药途径
export const COMMON_ROUTES = [
  { value: 'po', label: '口服' },
  { value: 'im', label: '肌肉注射' },
  { value: 'iv', label: '静脉注射' },
  { value: 'sc', label: '皮下注射' },
  { value: 'topical', label: '外用' },
  { value: 'inhalation', label: '吸入' },
  { value: 'rectal', label: '直肠给药' },
  { value: 'ophthalmic', label: '眼用' },
  { value: 'otic', label: '耳用' },
  { value: 'nasal', label: '鼻用' }
]

// 常用频次
export const COMMON_FREQUENCIES = [
  { value: 'qd', label: '每日1次' },
  { value: 'bid', label: '每日2次' },
  { value: 'tid', label: '每日3次' },
  { value: 'qid', label: '每日4次' },
  { value: 'qod', label: '隔日1次' },
  { value: 'qw', label: '每周1次' },
  { value: 'biw', label: '每周2次' },
  { value: 'tiw', label: '每周3次' },
  { value: 'qh', label: '每小时1次' },
  { value: 'q2h', label: '每2小时1次' },
  { value: 'q4h', label: '每4小时1次' },
  { value: 'q6h', label: '每6小时1次' },
  { value: 'q8h', label: '每8小时1次' },
  { value: 'q12h', label: '每12小时1次' },
  { value: 'prn', label: '必要时' },
  { value: 'stat', label: '立即' }
]

// 常用剂型
export const COMMON_DOSAGE_FORMS = [
  '片剂',
  '胶囊',
  '注射剂',
  '口服液',
  '颗粒剂',
  '散剂',
  '软膏',
  '乳膏',
  '栓剂',
  '滴眼液',
  '滴耳液',
  '滴鼻液',
  '吸入剂',
  '贴剂',
  '喷雾剂'
]