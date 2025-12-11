<template>
  <div class="medicine-detail-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <h2>药品详情</h2>
          <div class="header-actions">
            <el-button @click="handleBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <el-button type="warning" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="primary" @click="handlePrint">
              <el-icon><Printer /></el-icon>
              打印
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="medicine" class="medicine-content">
        <!-- 基本信息 -->
        <el-descriptions title="基本信息" :column="3" border>
          <el-descriptions-item label="药品编号">{{ medicine.medicineId }}</el-descriptions-item>
          <el-descriptions-item label="通用名">{{ medicine.genericName }}</el-descriptions-item>
          <el-descriptions-item label="商品名">{{ medicine.tradeName }}</el-descriptions-item>
          <el-descriptions-item label="品牌名">{{ medicine.brandName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="药品分类">{{ medicine.category }}</el-descriptions-item>
          <el-descriptions-item label="子分类">{{ medicine.subcategory }}</el-descriptions-item>
          <el-descriptions-item label="药品类型">
            <el-tag :type="getMedicineTypeColor(medicine.type)">
              {{ MEDICINE_TYPE_LABELS[medicine.type] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="剂型">{{ medicine.dosageForm }}</el-descriptions-item>
          <el-descriptions-item label="规格">{{ medicine.specification }}</el-descriptions-item>
          <el-descriptions-item label="含量规格">{{ medicine.strength }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getMedicineStatusColor(medicine.status)">
              {{ MEDICINE_STATUS_LABELS[medicine.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="条形码">{{ medicine.barcode || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 生产信息 -->
        <el-descriptions title="生产信息" :column="3" border style="margin-top: 20px">
          <el-descriptions-item label="生产厂家">{{ medicine.manufacturer }}</el-descriptions-item>
          <el-descriptions-item label="生产国家">{{ medicine.country }}</el-descriptions-item>
          <el-descriptions-item label="批准文号">{{ medicine.approvalNumber }}</el-descriptions-item>
          <el-descriptions-item label="许可证号">{{ medicine.licenseNumber }}</el-descriptions-item>
          <el-descriptions-item label="保质期">{{ medicine.shelfLife }} 个月</el-descriptions-item>
          <el-descriptions-item label="储存条件">{{ medicine.storageConditions }}</el-descriptions-item>
        </el-descriptions>

        <!-- 价格信息 -->
        <el-descriptions title="价格信息" :column="3" border style="margin-top: 20px">
          <el-descriptions-item label="单价">¥{{ medicine.price.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="零售价">¥{{ medicine.retailPrice.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="进货价">¥{{ medicine.purchasePrice.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="医保覆盖">
            <el-tag :type="medicine.insuranceCoverage ? 'success' : 'info'">
              {{ medicine.insuranceCoverage ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="毛利率">{{ calculateMargin() }}%</el-descriptions-item>
        </el-descriptions>

        <!-- 特殊属性 -->
        <el-descriptions title="特殊属性" :column="4" border style="margin-top: 20px">
          <el-descriptions-item label="需要处方">
            <el-tag :type="medicine.prescriptionRequired ? 'warning' : 'info'">
              {{ medicine.prescriptionRequired ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="管制药品">
            <el-tag :type="medicine.controlledSubstance ? 'danger' : 'info'">
              {{ medicine.controlledSubstance ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="高危药品">
            <el-tag :type="medicine.highRiskMedicine ? 'danger' : 'info'">
              {{ medicine.highRiskMedicine ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="特殊储存">
            <el-tag :type="medicine.specialStorage ? 'warning' : 'info'">
              {{ medicine.specialStorage ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 供应商信息 -->
        <el-descriptions title="供应商信息" :column="2" border style="margin-top: 20px">
          <el-descriptions-item label="供应商名称">{{ medicine.supplier.name }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ medicine.supplier.contact }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ medicine.supplier.phone }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ medicine.supplier.address }}</el-descriptions-item>
        </el-descriptions>

        <!-- 医学信息 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <span>医学信息</span>
          </template>

          <el-row :gutter="20">
            <el-col :span="24">
              <h4>药品描述</h4>
              <p>{{ medicine.description || '暂无描述' }}</p>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="12">
              <h4>适应症</h4>
              <div class="tag-list">
                <el-tag
                  v-for="(indication, index) in medicine.indications"
                  :key="index"
                  style="margin-right: 10px; margin-bottom: 10px"
                >
                  {{ indication }}
                </el-tag>
                <span v-if="!medicine.indications.length" class="empty-text">暂无适应症</span>
              </div>
            </el-col>
            <el-col :span="12">
              <h4>禁忌症</h4>
              <div class="tag-list">
                <el-tag
                  v-for="(contraindication, index) in medicine.contraindications"
                  :key="index"
                  type="danger"
                  style="margin-right: 10px; margin-bottom: 10px"
                >
                  {{ contraindication }}
                </el-tag>
                <span v-if="!medicine.contraindications.length" class="empty-text">暂无禁忌症</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="12">
              <h4>副作用</h4>
              <div class="tag-list">
                <el-tag
                  v-for="(sideEffect, index) in medicine.sideEffects"
                  :key="index"
                  type="warning"
                  style="margin-right: 10px; margin-bottom: 10px"
                >
                  {{ sideEffect }}
                </el-tag>
                <span v-if="!medicine.sideEffects.length" class="empty-text">暂无副作用</span>
              </div>
            </el-col>
            <el-col :span="12">
              <h4>用法用量</h4>
              <div class="tag-list">
                <el-tag
                  v-for="(dosage, index) in medicine.dosageAdministration"
                  :key="index"
                  type="success"
                  style="margin-right: 10px; margin-bottom: 10px"
                >
                  {{ dosage }}
                </el-tag>
                <span v-if="!medicine.dosageAdministration.length" class="empty-text">暂无用法用量</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="24">
              <h4>注意事项</h4>
              <div class="tag-list">
                <el-tag
                  v-for="(precaution, index) in medicine.precautions"
                  :key="index"
                  type="info"
                  style="margin-right: 10px; margin-bottom: 10px"
                >
                  {{ precaution }}
                </el-tag>
                <span v-if="!medicine.precautions.length" class="empty-text">暂无注意事项</span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 库存信息 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>库存信息</span>
              <el-button type="primary" link @click="viewStockDetails">
                查看详细库存
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总库存" :value="stockInfo.totalStock" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="可用库存" :value="stockInfo.availableStock" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="预警数量" :value="stockInfo.lowStockCount" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="库存价值" :value="stockInfo.totalValue" prefix="¥" />
            </el-col>
          </el-row>
        </el-card>

        <!-- 操作记录 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <span>操作记录</span>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="record in operationRecords"
              :key="record.id"
              :timestamp="record.timestamp"
              :type="record.type"
            >
              {{ record.content }}
              <div style="color: #909399; font-size: 12px; margin-top: 4px">
                操作人：{{ record.operator }}
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>

      <div v-else class="empty-content">
        <el-empty description="药品信息不存在" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Edit,
  Printer,
  ArrowRight
} from '@element-plus/icons-vue'
import type { Medicine } from '@/types/medicine'
import { getMedicine } from '@/api/medicines'
import {
  MEDICINE_TYPE_LABELS,
  MEDICINE_STATUS_LABELS,
  getMedicineTypeColor,
  getMedicineStatusColor
} from '@/types/medicine'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(false)
const medicine = ref<Medicine | null>(null)

// 库存信息
const stockInfo = reactive({
  totalStock: 0,
  availableStock: 0,
  lowStockCount: 0,
  totalValue: 0
})

// 操作记录
const operationRecords = reactive([
  {
    id: 1,
    timestamp: '2024-12-11 14:30:00',
    content: '药品信息创建',
    operator: '张三',
    type: 'primary'
  },
  {
    id: 2,
    timestamp: '2024-12-11 15:20:00',
    content: '药品信息更新',
    operator: '李四',
    type: 'warning'
  },
  {
    id: 3,
    timestamp: '2024-12-11 16:10:00',
    content: '价格调整',
    operator: '王五',
    type: 'info'
  }
])

// 获取药品详情
const fetchMedicine = async (id: number) => {
  loading.value = true
  try {
    const response = await getMedicine(id)
    medicine.value = response.data

    // 模拟库存数据
    stockInfo.totalStock = Math.floor(Math.random() * 1000) + 100
    stockInfo.availableStock = stockInfo.totalStock - Math.floor(Math.random() * 100)
    stockInfo.lowStockCount = Math.floor(Math.random() * 5)
    stockInfo.totalValue = stockInfo.availableStock * medicine.value.price
  } catch (error) {
    ElMessage.error('获取药品详情失败')
    router.push('/medicines')
  } finally {
    loading.value = false
  }
}

// 计算毛利率
const calculateMargin = () => {
  if (!medicine.value) return 0
  const margin = ((medicine.value.retailPrice - medicine.value.purchasePrice) / medicine.value.purchasePrice) * 100
  return margin.toFixed(2)
}

// 返回
const handleBack = () => {
  router.push('/medicines')
}

// 编辑
const handleEdit = () => {
  if (medicine.value) {
    router.push(`/medicines/${medicine.value.id}/edit`)
  }
}

// 打印
const handlePrint = () => {
  window.print()
}

// 查看库存详情
const viewStockDetails = () => {
  router.push('/medicines/stocks')
}

// 初始化
onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    fetchMedicine(id)
  } else {
    ElMessage.error('无效的药品ID')
    router.push('/medicines')
  }
})
</script>

<style scoped>
.medicine-detail-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.medicine-content {
  margin-top: 20px;
}

.tag-list {
  min-height: 40px;
}

.empty-text {
  color: #909399;
  font-style: italic;
}

:deep(.el-descriptions__label) {
  font-weight: bold;
  color: #606266;
}

:deep(.el-statistic__content) {
  color: #409eff;
  font-weight: bold;
}

:deep(.el-card__header) {
  font-weight: bold;
  color: #303133;
}

/* 打印样式 */
@media print {
  .card-header,
  .header-actions {
    display: none;
  }

  .medicine-detail-container {
    padding: 0;
  }
}
</style>