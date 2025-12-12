<template>
  <div class="medical-record-detail-container">
    <!-- 页面头部 -->
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <div class="title-section">
            <h2>病历详情</h2>
            <div class="record-status">
              <el-tag :type="getStatusColor(medicalRecord?.status)" size="large">
                {{ STATUS_LABELS[medicalRecord?.status] }}
              </el-tag>
            </div>
          </div>
          <div class="header-actions">
            <el-button @click="handleGoBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <el-button
              v-if="canEdit"
              type="primary"
              @click="handleEdit"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              v-if="canPrint"
              type="success"
              @click="handlePrint"
            >
              <el-icon><Printer /></el-icon>
              打印
            </el-button>
            <el-dropdown @command="handleMoreCommand">
              <el-button>
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy" v-if="canCopy">
                    <el-icon><CopyDocument /></el-icon>
                    复制病历
                  </el-dropdown-item>
                  <el-dropdown-item command="export" v-if="canExport">
                    <el-icon><Download /></el-icon>
                    导出病历
                  </el-dropdown-item>
                  <el-dropdown-item command="withdraw" v-if="canWithdraw">
                    <el-icon><RefreshLeft /></el-icon>
                    撤回病历
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>
    </el-card>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="medicalRecord" class="detail-content">
      <!-- 患者信息卡片 -->
      <el-card class="patient-card">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>患者信息</span>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="患者姓名">{{ medicalRecord.patientName }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ medicalRecord.patientGender }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ medicalRecord.patientAge }}岁</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ medicalRecord.patientIdCard }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ medicalRecord.patientPhone }}</el-descriptions-item>
          <el-descriptions-item label="患者ID">{{ medicalRecord.patientId }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 病历基本信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>病历基本信息</span>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="病历编号">{{ medicalRecord.id }}</el-descriptions-item>
          <el-descriptions-item label="病历类型">
            <el-tag :type="getRecordTypeColor(medicalRecord.recordType)">
              {{ RECORD_TYPE_LABELS[medicalRecord.recordType] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="就诊日期">{{ medicalRecord.visitDate }}</el-descriptions-item>
          <el-descriptions-item label="就诊科室">{{ medicalRecord.department }}</el-descriptions-item>
          <el-descriptions-item label="主治医生">{{ medicalRecord.doctorName }}</el-descriptions-item>
          <el-descriptions-item label="就诊方式">{{ medicalRecord.visitType }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(medicalRecord.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ formatDateTime(medicalRecord.updatedAt) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 病历内容 -->
      <el-card class="content-card">
        <template #header>
          <div class="card-header">
            <el-icon><EditPen /></el-icon>
            <span>病历内容</span>
          </div>
        </template>

        <el-tabs v-model="contentTab" type="card">
          <!-- 主诉和病史 -->
          <el-tab-pane label="主诉和病史" name="history">
            <div class="content-section">
              <div class="section-item">
                <h4>主诉</h4>
                <div class="content-text">{{ medicalRecord.chiefComplaint || '-' }}</div>
              </div>
              <div class="section-item">
                <h4>现病史</h4>
                <div class="content-text" v-html="medicalRecord.presentIllnessHistory || '-'"></div>
              </div>
              <div class="section-item">
                <h4>既往史</h4>
                <div class="content-text" v-html="medicalRecord.pastHistory || '-'"></div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 体格检查 -->
          <el-tab-pane label="体格检查" name="examination">
            <div class="content-section">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="体温">{{ medicalRecord.physicalExamination?.general?.temperature || '-' }}℃</el-descriptions-item>
                <el-descriptions-item label="脉搏">{{ medicalRecord.physicalExamination?.general?.pulse || '-' }}次/分</el-descriptions-item>
                <el-descriptions-item label="血压">{{ medicalRecord.physicalExamination?.general?.bloodPressure || '-' }}mmHg</el-descriptions-item>
                <el-descriptions-item label="呼吸">{{ medicalRecord.physicalExamination?.general?.respiration || '-' }}次/分</el-descriptions-item>
              </el-descriptions>

              <div class="section-item" style="margin-top: 20px;">
                <h4>专科检查</h4>
                <div class="content-text" v-html="medicalRecord.physicalExamination?.specialist || '-'"></div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 辅助检查 -->
          <el-tab-pane label="辅助检查" name="auxiliary">
            <div class="content-section">
              <div class="section-item">
                <h4>辅助检查结果</h4>
                <div class="content-text" v-html="medicalRecord.auxiliaryExamination || '-'"></div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 诊断和治疗 -->
          <el-tab-pane label="诊断和治疗" name="treatment">
            <div class="content-section">
              <div class="section-item">
                <h4>初步诊断</h4>
                <div class="diagnosis-list">
                  <el-tag
                    v-for="diagnosis in medicalRecord.preliminaryDiagnosis"
                    :key="diagnosis"
                    type="info"
                    style="margin-right: 8px; margin-bottom: 8px"
                  >
                    {{ diagnosis }}
                  </el-tag>
                  <span v-if="!medicalRecord.preliminaryDiagnosis?.length">-</span>
                </div>
              </div>
              <div class="section-item">
                <h4>治疗方案</h4>
                <div class="content-text" v-html="medicalRecord.treatmentPlan || '-'"></div>
              </div>
              <div class="section-item">
                <h4>医嘱</h4>
                <div class="content-text" v-html="medicalRecord.medicalAdvice || '-'"></div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 处方信息 -->
          <el-tab-pane label="处方信息" name="prescription" v-if="medicalRecord.prescriptions?.length">
            <div class="content-section">
              <el-table :data="medicalRecord.prescriptions" border>
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="medicineName" label="药品名称" />
                <el-table-column prop="specification" label="规格" width="120" />
                <el-table-column prop="dosage" label="用量" width="100" />
                <el-table-column prop="frequency" label="频次" width="120" />
                <el-table-column prop="duration" label="疗程" width="100" />
                <el-table-column prop="usage" label="用法" />
              </el-table>
            </div>
          </el-tab-pane>

          <!-- 审核历史 -->
          <el-tab-pane label="审核历史" name="approval" v-if="medicalRecord.approvalHistory?.length">
            <div class="content-section">
              <el-timeline>
                <el-timeline-item
                  v-for="(history, index) in medicalRecord.approvalHistory"
                  :key="index"
                  :timestamp="formatDateTime(history.createdAt)"
                  :type="getTimelineType(history.action)"
                >
                  <div class="approval-item">
                    <div class="approval-header">
                      <span class="action-type">{{ getActionLabel(history.action) }}</span>
                      <span class="approver-name">{{ history.approverName }}</span>
                    </div>
                    <div class="approval-comment" v-if="history.comment">
                      {{ history.comment }}
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 附件信息 -->
      <el-card class="attachment-card" v-if="medicalRecord.attachments?.length">
        <template #header>
          <div class="card-header">
            <el-icon><Paperclip /></el-icon>
            <span>附件信息</span>
          </div>
        </template>
        <el-table :data="medicalRecord.attachments" border>
          <el-table-column prop="fileName" label="文件名" />
          <el-table-column prop="fileSize" label="文件大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.fileSize) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadedAt" label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.uploadedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="handleDownloadAttachment(row)"
              >
                下载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <div v-else class="empty-container">
      <el-empty description="病历不存在或已被删除" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ArrowDown,
  Edit,
  Printer,
  CopyDocument,
  Download,
  RefreshLeft,
  User,
  Document,
  EditPen,
  Paperclip
} from '@element-plus/icons-vue'
import {
  medicalRecordApi,
  type MedicalRecord,
  RECORD_TYPE_LABELS,
  STATUS_LABELS,
  getRecordTypeColor,
  getStatusColor
} from '@/api/medical-records'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const medicalRecord = ref<MedicalRecord | null>(null)
const contentTab = ref('history')

// 计算属性
const canEdit = computed(() => {
  return medicalRecord.value?.status === 'DRAFT' || medicalRecord.value?.status === 'REJECTED'
})

const canPrint = computed(() => {
  return medicalRecord.value?.status === 'APPROVED'
})

const canCopy = computed(() => {
  return medicalRecord.value?.status === 'APPROVED'
})

const canExport = computed(() => {
  return medicalRecord.value?.status === 'APPROVED'
})

const canWithdraw = computed(() => {
  return medicalRecord.value?.status === 'SUBMITTED' || medicalRecord.value?.status === 'REVIEWING'
})

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (!size) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let fileSize = size

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024
    unitIndex++
  }

  return `${fileSize.toFixed(2)} ${units[unitIndex]}`
}

// 获取时间线类型
const getTimelineType = (action: string) => {
  switch (action) {
    case 'SUBMIT':
      return 'primary'
    case 'APPROVE':
      return 'success'
    case 'REJECT':
      return 'danger'
    case 'WITHDRAW':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取操作标签
const getActionLabel = (action: string) => {
  switch (action) {
    case 'SUBMIT':
      return '提交审核'
    case 'APPROVE':
      return '审核通过'
    case 'REJECT':
      return '审核拒绝'
    case 'WITHDRAW':
      return '撤回'
    default:
      return action
  }
}

// 加载病历详情
const loadMedicalRecord = async () => {
  try {
    loading.value = true
    const id = Number(route.params.id)
    const response = await medicalRecordApi.getMedicalRecordById(id)
    medicalRecord.value = response.data
  } catch (error) {
    console.error('加载病历详情失败:', error)
    ElMessage.error('加载病历详情失败')
  } finally {
    loading.value = false
  }
}

// 返回上一页
const handleGoBack = () => {
  router.back()
}

// 编辑病历
const handleEdit = () => {
  if (medicalRecord.value) {
    router.push(`/medical-records/${medicalRecord.value.id}/edit`)
  }
}

// 打印病历
const handlePrint = async () => {
  try {
    if (medicalRecord.value) {
      const response = await medicalRecordApi.printMedicalRecord(medicalRecord.value.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      window.open(url)
    }
  } catch (error) {
    console.error('打印失败:', error)
    ElMessage.error('打印失败')
  }
}

// 更多操作
const handleMoreCommand = async (command: string) => {
  switch (command) {
    case 'copy':
      await handleCopyRecord()
      break
    case 'export':
      await handleExportRecord()
      break
    case 'withdraw':
      await handleWithdrawRecord()
      break
  }
}

// 复制病历
const handleCopyRecord = async () => {
  try {
    if (medicalRecord.value) {
      const response = await medicalRecordApi.copyMedicalRecord(medicalRecord.value.id)
      ElMessage.success('病历复制成功')
      router.push(`/medical-records/${response.id}/edit`)
    }
  } catch (error) {
    console.error('复制病历失败:', error)
    ElMessage.error('复制病历失败')
  }
}

// 导出病历
const handleExportRecord = async () => {
  try {
    if (medicalRecord.value) {
      const response = await medicalRecordApi.exportMedicalRecords({
        ids: [medicalRecord.value.id]
      })
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `病历_${medicalRecord.value.patientName}_${medicalRecord.value.id}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error('导出病历失败:', error)
    ElMessage.error('导出病历失败')
  }
}

// 撤回病历
const handleWithdrawRecord = async () => {
  try {
    await ElMessageBox.prompt('请输入撤回原因：', '撤回病历', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputValidator: (value: string) => {
        if (!value || value.trim() === '') {
          return '请输入撤回原因'
        }
        return true
      }
    })

    if (medicalRecord.value) {
      await medicalRecordApi.withdrawMedicalRecord(medicalRecord.value.id, '撤回原因')
      ElMessage.success('病历撤回成功')
      loadMedicalRecord()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤回病历失败:', error)
      ElMessage.error('撤回病历失败')
    }
  }
}

// 下载附件
const handleDownloadAttachment = async (attachment: any) => {
  try {
    // 这里应该调用下载附件的API
    ElMessage.success(`下载附件: ${attachment.fileName}`)
  } catch (error) {
    console.error('下载附件失败:', error)
    ElMessage.error('下载附件失败')
  }
}

// 组件挂载
onMounted(() => {
  loadMedicalRecord()
})
</script>

<style scoped>
.medical-record-detail-container {
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.header-card {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-section h2 {
  margin: 0;
  color: #303133;
}

.record-status .el-tag {
  font-size: 14px;
  padding: 8px 16px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.loading-container {
  background-color: white;
  padding: 24px;
  border-radius: 4px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.patient-card,
.info-card,
.content-card,
.attachment-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.content-section {
  padding: 20px 0;
}

.section-item {
  margin-bottom: 24px;
}

.section-item:last-child {
  margin-bottom: 0;
}

.section-item h4 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.content-text {
  color: #606266;
  line-height: 1.6;
  background-color: #fafafa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.diagnosis-list {
  background-color: #fafafa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.approval-item {
  background-color: #fafafa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.approval-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.action-type {
  font-weight: 500;
  color: #303133;
}

.approver-name {
  color: #606266;
}

.approval-comment {
  color: #606266;
  line-height: 1.5;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background-color: white;
  border-radius: 4px;
}

:deep(.el-card__header) {
  background-color: #f5f7fa;
}

:deep(.el-descriptions__body) {
  background-color: #fafafa;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-table) {
  background-color: #fafafa;
}

:deep(.el-timeline-item__content) {
  padding-bottom: 20px;
}
</style>