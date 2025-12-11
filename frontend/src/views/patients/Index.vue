<template>
  <div class="patients-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2>患者管理</h2>
        <p>管理患者基本信息，支持新增、编辑、查看和搜索</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增患者
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ statistics.total || 0 }}</h3>
                <p>患者总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon active">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ statistics.active || 0 }}</h3>
                <p>正常就诊</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon male">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ statistics.maleCount || 0 }}</h3>
                <p>男性患者</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon female">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ statistics.femaleCount || 0 }}</h3>
                <p>女性患者</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名/手机号/身份证号/患者编号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="searchForm.gender" placeholder="全部" clearable>
            <el-option
              v-for="(label, value) in GENDER_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="血型">
          <el-select v-model="searchForm.bloodType" placeholder="全部" clearable>
            <el-option
              v-for="(label, value) in BLOOD_TYPE_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="医保类型">
          <el-select v-model="searchForm.insuranceType" placeholder="全部" clearable>
            <el-option
              v-for="(label, value) in INSURANCE_TYPE_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 患者列表 -->
    <el-card class="table-card">
      <el-table
        :data="patientList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="patientId" label="患者编号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ GENDER_MAP[row.gender] }}
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="idCard" label="身份证号" width="180">
          <template #default="{ row }">
            {{ maskIdCard(row.idCard) }}
          </template>
        </el-table-column>
        <el-table-column prop="bloodType" label="血型" width="80">
          <template #default="{ row }">
            {{ BLOOD_TYPE_MAP[row.bloodType] }}
          </template>
        </el-table-column>
        <el-table-column prop="insuranceType" label="医保类型" width="100">
          <template #default="{ row }">
            {{ INSURANCE_TYPE_MAP[row.insuranceType] }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ PATIENT_STATUS_MAP[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">
              查看
            </el-button>
            <el-button type="warning" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 批量操作 -->
    <div v-if="selectedPatients.length > 0" class="batch-actions">
      <span>已选择 {{ selectedPatients.length }} 项</span>
      <el-button type="danger" @click="handleBatchDelete">
        批量删除
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Download,
  Upload,
  Search,
  Refresh,
  User,
  Check
} from '@element-plus/icons-vue'
import { patientApi } from '@/api/patients'
import type {
  Patient,
  PatientQuery,
  PatientStatistics
} from '@/types/patient'
import {
  GENDER_MAP,
  BLOOD_TYPE_MAP,
  INSURANCE_TYPE_MAP,
  PATIENT_STATUS_MAP
} from '@/types/patient'

const router = useRouter()

// 数据状态
const loading = ref(false)
const patientList = ref<Patient[]>([])
const selectedPatients = ref<Patient[]>([])
const statistics = ref<PatientStatistics>({})

// 搜索表单
const searchForm = reactive<PatientQuery>({
  keyword: '',
  gender: undefined,
  bloodType: undefined,
  insuranceType: undefined,
  page: 1,
  pageSize: 20
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 加载患者列表
const loadPatients = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const response = await patientApi.getPatients(params)

    patientList.value = response.items
    pagination.total = response.total
  } catch (error) {
    ElMessage.error('加载患者列表失败')
  } finally {
    loading.value = false
  }
}

// 加载统计信息
const loadStatistics = async () => {
  try {
    const data = await patientApi.getPatientStatistics()
    statistics.value = data
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadPatients()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    gender: undefined,
    bloodType: undefined,
    insuranceType: undefined
  })
  pagination.page = 1
  loadPatients()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  loadPatients()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadPatients()
}

// 选择变化
const handleSelectionChange = (selection: Patient[]) => {
  selectedPatients.value = selection
}

// 新增患者
const handleCreate = () => {
  router.push('/patients/create')
}

// 查看患者
const handleView = (patient: Patient) => {
  router.push(`/patients/${patient.id}`)
}

// 编辑患者
const handleEdit = (patient: Patient) => {
  router.push(`/patients/${patient.id}/edit`)
}

// 删除患者
const handleDelete = async (patient: Patient) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除患者 "${patient.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await patientApi.deletePatient(patient.id)
    ElMessage.success('删除成功')
    loadPatients()
    loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedPatients.value.length} 位患者吗？此操作不可恢复。`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const promises = selectedPatients.value.map(patient =>
      patientApi.deletePatient(patient.id)
    )
    await Promise.all(promises)

    ElMessage.success('批量删除成功')
    selectedPatients.value = []
    loadPatients()
    loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 导出数据
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 导入数据
const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

// 身份证号脱敏
const maskIdCard = (idCard: string) => {
  if (!idCard) return ''
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    DECEASED: 'info'
  }
  return statusMap[status] || 'info'
}

// 初始化
onMounted(() => {
  loadPatients()
  loadStatistics()
})
</script>

<style scoped>
.patients-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.male {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.female {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info h3 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-info p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}
</style>