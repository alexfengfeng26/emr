// 药品管理API接口
import request from '@/utils/request'
import type {
  Medicine,
  MedicineCreateForm,
  MedicineUpdateForm,
  MedicineQuery,
  MedicineListResponse,
  MedicineStock,
  MedicineStockQuery,
  MedicineStockListResponse,
  MedicineStockStatistics,
  Prescription,
  PrescriptionCreateForm,
  PrescriptionQuery,
  PrescriptionListResponse,
  PrescriptionStatistics,
  MedicationUsageStatistics
} from '@/types/medicine'

// ==================== 药品目录管理 ====================

// 获取药品列表
export function getMedicines(params?: MedicineQuery) {
  return request.get<MedicineListResponse>('/api/medicines', { params })
}

// 获取药品详情
export function getMedicine(id: number) {
  return request.get<Medicine>(`/api/medicines/${id}`)
}

// 创建药品
export function createMedicine(data: MedicineCreateForm) {
  return request.post<Medicine>('/api/medicines', data)
}

// 更新药品
export function updateMedicine(id: number, data: MedicineUpdateForm) {
  return request.put<Medicine>(`/api/medicines/${id}`, data)
}

// 删除药品
export function deleteMedicine(id: number) {
  return request.delete(`/api/medicines/${id}`)
}

// 批量删除药品
export function batchDeleteMedicines(ids: number[]) {
  return request.delete('/api/medicines/batch', { data: { ids } })
}

// 更新药品状态
export function updateMedicineStatus(id: number, status: Medicine['status']) {
  return request.patch<Medicine>(`/api/medicines/${id}/status`, { status })
}

// 批量更新药品状态
export function batchUpdateMedicineStatus(ids: number[], status: Medicine['status']) {
  return request.patch('/api/medicines/batch/status', { ids, status })
}

// 检查药品编号是否重复
export function checkMedicineId(medicineId: string, excludeId?: number) {
  return request.get<boolean>('/api/medicines/check-id', {
    params: { medicineId, excludeId }
  })
}

// 检查条形码是否重复
export function checkBarcode(barcode: string, excludeId?: number) {
  return request.get<boolean>('/api/medicines/check-barcode', {
    params: { barcode, excludeId }
  })
}

// 获取药品分类
export function getMedicineCategories() {
  return request.get<Array<{ category: string; subcategories: string[] }>>('/api/medicines/categories')
}

// 获取药品制造商列表
export function getMedicineManufacturers() {
  return request.get<Array<{ manufacturer: string; country: string }>>('/api/medicines/manufacturers')
}

// 导入药品数据
export function importMedicines(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<{ success: number; failed: number; errors: string[] }>('/api/medicines/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 导出药品数据
export function exportMedicines(params?: MedicineQuery) {
  return request.get('/api/medicines/export', {
    params,
    responseType: 'blob'
  })
}

// 搜索药品（用于下拉选择）
export function searchMedicines(keyword: string, limit?: number) {
  return request.get<Array<{ id: number; medicineId: string; genericName: string; tradeName: string; specification: string }>>('/api/medicines/search', {
    params: { keyword, limit }
  })
}

// ==================== 药品库存管理 ====================

// 获取库存列表
export function getMedicineStocks(params?: MedicineStockQuery) {
  return request.get<MedicineStockListResponse>('/api/medicines/stocks', { params })
}

// 获取库存详情
export function getMedicineStock(id: number) {
  return request.get<MedicineStock>(`/api/medicines/stocks/${id}`)
}

// 创建库存记录
export function createMedicineStock(data: Partial<MedicineStock>) {
  return request.post<MedicineStock>('/api/medicines/stocks', data)
}

// 更新库存记录
export function updateMedicineStock(id: number, data: Partial<MedicineStock>) {
  return request.put<MedicineStock>(`/api/medicines/stocks/${id}`, data)
}

// 删除库存记录
export function deleteMedicineStock(id: number) {
  return request.delete(`/api/medicines/stocks/${id}`)
}

// 库存入库
export function stockIn(data: {
  medicineId: number
  warehouseId: number
  batchNumber: string
  manufactureDate: string
  expiryDate: string
  quantity: number
  purchasePrice: number
  notes?: string
}) {
  return request.post<MedicineStock>('/api/medicines/stocks/in', data)
}

// 库存出库
export function stockOut(data: {
  stockId: number
  quantity: number
  reason: string
  notes?: string
}) {
  return request.post<MedicineStock>('/api/medicines/stocks/out', data)
}

// 库存盘点
export function stockTaking(data: Array<{
  id: number
  actualQuantity: number
  notes?: string
}>) {
  return request.post<Array<{ id: number; success: boolean; message?: string }>>('/api/medicines/stocks/taking', data)
}

// 库存转移
export function transferStock(data: {
  fromStockId: number
  toWarehouseId: number
  quantity: number
  notes?: string
}) {
  return request.post<MedicineStock>('/api/medicines/stocks/transfer', data)
}

// 获取库存统计
export function getMedicineStockStatistics() {
  return request.get<MedicineStockStatistics>('/api/medicines/stocks/statistics')
}

// 获取低库存药品
export function getLowStockMedicines() {
  return request.get<MedicineStock[]>('/api/medicines/stocks/low-stock')
}

// 获取即将过期药品
export function getExpiringMedicines(days: number = 30) {
  return request.get<MedicineStock[]>('/api/medicines/stocks/expiring', {
    params: { days }
  })
}

// 获取库存变动记录
export function getStockChanges(params: {
  medicineId?: number
  warehouseId?: number
  dateRange?: [string, string]
  type?: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
  page?: number
  pageSize?: number
}) {
  return request.get<{
    list: Array<{
      id: number
      stockId: number
      type: string
      quantity: number
      reason: string
      operator: string
      operatorId: number
      createdAt: string
      notes?: string
    }>
    total: number
    page: number
    pageSize: number
  }>('/api/medicines/stocks/changes', { params })
}

// ==================== 处方管理 ====================

// 获取处方列表
export function getPrescriptions(params?: PrescriptionQuery) {
  return request.get<PrescriptionListResponse>('/api/prescriptions', { params })
}

// 获取处方详情
export function getPrescription(id: number) {
  return request.get<Prescription>(`/api/prescriptions/${id}`)
}

// 创建处方
export function createPrescription(data: PrescriptionCreateForm) {
  return request.post<Prescription>('/api/prescriptions', data)
}

// 更新处方
export function updatePrescription(id: number, data: Partial<Prescription>) {
  return request.put<Prescription>(`/api/prescriptions/${id}`, data)
}

// 删除处方
export function deletePrescription(id: number) {
  return request.delete(`/api/prescriptions/${id}`)
}

// 更新处方状态
export function updatePrescriptionStatus(id: number, status: Prescription['status']) {
  return request.patch<Prescription>(`/api/prescriptions/${id}/status`, { status })
}

// 审核处方
export function approvePrescription(id: number, data: {
  approved: boolean
  notes?: string
}) {
  return request.post<Prescription>(`/api/prescriptions/${id}/approve`, data)
}

// 调剂处方
export function dispensePrescription(id: number, data: {
  items: Array<{
    prescriptionItemId: number
    stockId: number
    quantity: number
    notes?: string
  }>
  notes?: string
}) {
  return request.post<Prescription>(`/api/prescriptions/${id}/dispense`, data)
}

// 完成处方
export function completePrescription(id: number, data?: {
  notes?: string
}) {
  return request.post<Prescription>(`/api/prescriptions/${id}/complete`, data)
}

// 取消处方
export function cancelPrescription(id: number, data: {
  reason: string
  notes?: string
}) {
  return request.post<Prescription>(`/api/prescriptions/${id}/cancel`, data)
}

// 验证处方
export function verifyPrescription(id: number, verificationCode: string) {
  return request.post<{ valid: boolean; prescription?: Prescription }>('/api/prescriptions/verify', {
    id,
    verificationCode
  })
}

// 打印处方
export function printPrescription(id: number) {
  return request.get('/api/prescriptions/print', {
    params: { id },
    responseType: 'blob'
  })
}

// 获取处方统计
export function getPrescriptionStatistics(params?: {
  dateRange?: [string, string]
  doctorId?: number
  departmentId?: number
}) {
  return request.get<PrescriptionStatistics>('/api/prescriptions/statistics', { params })
}

// 检查处方冲突
export function checkPrescriptionConflicts(data: {
  patientId: number
  medicines: Array<{
    medicineId: number
    quantity: number
    dosage: string
    frequency: string
  }>
}) {
  return request.post<{
    hasConflicts: boolean
    conflicts: Array<{
      type: 'DUPLICATE' | 'INTERACTION' | 'ALLERGY' | 'CONTRAINDICATION'
      medicines: string[]
      description: string
      severity: 'LOW' | 'MEDIUM' | 'HIGH'
    }>
  }>('/api/prescriptions/check-conflicts', data)
}

// 获取用药统计
export function getMedicationUsageStatistics(params?: {
  dateRange?: [string, string]
  categoryId?: number
  doctorId?: number
  departmentId?: number
}) {
  return request.get<MedicationUsageStatistics>('/api/prescriptions/usage-statistics', { params })
}

// 获取患者处方历史
export function getPatientPrescriptionHistory(patientId: number, params?: {
  limit?: number
  status?: Prescription['status']
}) {
  return request.get<Prescription[]>(`/api/prescriptions/patient/${patientId}/history`, { params })
}

// ==================== 供应商管理 ====================

// 获取供应商列表
export function getSuppliers(params?: {
  keyword?: string
  page?: number
  pageSize?: number
}) {
  return request.get<{
    list: Array<{
      id: number
      name: string
      contact: string
      phone: string
      address: string
      email?: string
      licenseNumber?: string
      status: 'ACTIVE' | 'INACTIVE'
      createdAt: string
    }>
    total: number
    page: number
    pageSize: number
  }>('/api/medicines/suppliers', { params })
}

// 创建供应商
export function createSupplier(data: {
  name: string
  contact: string
  phone: string
  address: string
  email?: string
  licenseNumber?: string
}) {
  return request.post('/api/medicines/suppliers', data)
}

// 更新供应商
export function updateSupplier(id: number, data: Partial<{
  name: string
  contact: string
  phone: string
  address: string
  email: string
  licenseNumber: string
  status: 'ACTIVE' | 'INACTIVE'
}>) {
  return request.put(`/api/medicines/suppliers/${id}`, data)
}

// 删除供应商
export function deleteSupplier(id: number) {
  return request.delete(`/api/medicines/suppliers/${id}`)
}

// ==================== 仓库管理 ====================

// 获取仓库列表
export function getWarehouses(params?: {
  keyword?: string
  status?: 'ACTIVE' | 'INACTIVE'
}) {
  return request.get<Array<{
    id: number
    name: string
    location: string
    manager: string
    phone: string
    capacity: number
    currentUsage: number
    status: 'ACTIVE' | 'INACTIVE'
    createdAt: string
  }>>('/api/medicines/warehouses', { params })
}

// 创建仓库
export function createWarehouse(data: {
  name: string
  location: string
  manager: string
  phone: string
  capacity: number
}) {
  return request.post('/api/medicines/warehouses', data)
}

// 更新仓库
export function updateWarehouse(id: number, data: Partial<{
  name: string
  location: string
  manager: string
  phone: string
  capacity: number
  status: 'ACTIVE' | 'INACTIVE'
}>) {
  return request.put(`/api/medicines/warehouses/${id}`, data)
}

// 删除仓库
export function deleteWarehouse(id: number) {
  return request.delete(`/api/medicines/warehouses/${id}`)
}

// 获取仓库利用率
export function getWarehouseUtilization() {
  return request.get<Array<{
    warehouseId: number
    warehouseName: string
    utilization: number
    status: 'NORMAL' | 'HIGH' | 'OVERLOAD'
  }>>('/api/medicines/warehouses/utilization')
}