<template>
  <div class="outpatient-statistics-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>门诊统计</h2>
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :model="filterForm" inline class="filter-form">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleFilterChange"
            />
          </el-form-item>
          <el-form-item label="科室">
            <el-select
              v-model="filterForm.departmentId"
              placeholder="请选择科室"
              clearable
              @change="handleFilterChange"
            >
              <el-option
                v-for="dept in departments"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="医生">
            <el-select
              v-model="filterForm.doctorId"
              placeholder="请选择医生"
              clearable
              @change="handleFilterChange"
            >
              <el-option
                v-for="doctor in doctors"
                :key="doctor.id"
                :label="doctor.name"
                :value="doctor.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="统计维度">
            <el-select
              v-model="filterForm.dimension"
              placeholder="请选择统计维度"
              @change="handleDimensionChange"
            >
              <el-option label="按日统计" value="day" />
              <el-option label="按周统计" value="week" />
              <el-option label="按月统计" value="month" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 统计卡片 -->
      <div class="statistics-cards">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.totalVisits }}</div>
                <div class="stat-label">总就诊人次</div>
                <div class="stat-trend">
                  <el-icon v-if="statistics.visitsTrend > 0" class="trend-up"><CaretTop /></el-icon>
                  <el-icon v-else class="trend-down"><CaretBottom /></el-icon>
                  {{ Math.abs(statistics.visitsTrend) }}%
                </div>
              </div>
              <el-icon class="stat-icon"><UserFilled /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.averageWaitTime }}</div>
                <div class="stat-label">平均候诊时间</div>
                <div class="stat-trend">分钟</div>
              </div>
              <el-icon class="stat-icon"><Clock /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">¥{{ formatNumber(statistics.totalRevenue) }}</div>
                <div class="stat-label">门诊总收入</div>
                <div class="stat-trend">
                  <el-icon v-if="statistics.revenueTrend > 0" class="trend-up"><CaretTop /></el-icon>
                  <el-icon v-else class="trend-down"><CaretBottom /></el-icon>
                  {{ Math.abs(statistics.revenueTrend) }}%
                </div>
              </div>
              <el-icon class="stat-icon"><Money /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">¥{{ formatNumber(statistics.averageRevenue) }}</div>
                <div class="stat-label">人均消费</div>
                <div class="stat-trend">元</div>
              </div>
              <el-icon class="stat-icon"><Wallet /></el-icon>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>门诊量趋势图</span>
                  <el-button-group size="small">
                    <el-button
                      :type="chartPeriod === '7' ? 'primary' : ''"
                      @click="changeChartPeriod('7')"
                    >
                      近7天
                    </el-button>
                    <el-button
                      :type="chartPeriod === '30' ? 'primary' : ''"
                      @click="changeChartPeriod('30')"
                    >
                      近30天
                    </el-button>
                    <el-button
                      :type="chartPeriod === '90' ? 'primary' : ''"
                      @click="changeChartPeriod('90')"
                    >
                      近90天
                    </el-button>
                  </el-button-group>
                </div>
              </template>
              <div ref="visitsTrendChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>科室就诊分布</span>
              </template>
              <div ref="departmentChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>时间段就诊分布</span>
              </template>
              <div ref="timeDistributionChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>疾病类型统计</span>
              </template>
              <div ref="diseaseChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 详细数据表格 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>详细统计数据</span>
            <div>
              <el-button type="success" @click="handleExport">
                <el-icon><Download /></el-icon>
                导出报表
              </el-button>
              <el-button type="primary" @click="handleRefresh">
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          v-loading="loading"
          :data="tableData"
          border
          stripe
        >
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="totalVisits" label="总人次" width="100" align="center" />
          <el-table-column prop="newPatients" label="新患者" width="100" align="center" />
          <el-table-column prop="returnPatients" label="复诊" width="100" align="center" />
          <el-table-column prop="averageWaitTime" label="平均候诊时间" width="120" align="center">
            <template #default="{ row }">
              {{ row.averageWaitTime }} 分钟
            </template>
          </el-table-column>
          <el-table-column prop="totalRevenue" label="总收入" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.totalRevenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="prescriptionCount" label="处方数" width="100" align="center" />
          <el-table-column prop="laboratoryCount" label="检查数" width="100" align="center" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  UserFilled,
  Clock,
  Money,
  Wallet,
  CaretTop,
  CaretBottom,
  Download,
  Refresh
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()

// 图表引用
const visitsTrendChartRef = ref<HTMLElement>()
const departmentChartRef = ref<HTMLElement>()
const timeDistributionChartRef = ref<HTMLElement>()
const diseaseChartRef = ref<HTMLElement>()

// 图表实例
let visitsTrendChart: echarts.ECharts | null = null
let departmentChart: echarts.ECharts | null = null
let timeDistributionChart: echarts.ECharts | null = null
let diseaseChart: echarts.ECharts | null = null

// 响应式数据
const loading = ref(false)
const chartPeriod = ref('30')

// 筛选表单
const filterForm = reactive({
  dateRange: [],
  departmentId: '',
  doctorId: '',
  dimension: 'day'
})

// 科室列表
const departments = ref([
  { id: 1, name: '内科' },
  { id: 2, name: '外科' },
  { id: 3, name: '儿科' },
  { id: 4, name: '妇产科' },
  { id: 5, name: '眼科' },
  { id: 6, name: '耳鼻喉科' },
  { id: 7, name: '口腔科' }
])

// 医生列表
const doctors = ref([
  { id: 1, name: '张医生' },
  { id: 2, name: '李医生' },
  { id: 3, name: '王医生' },
  { id: 4, name: '陈医生' },
  { id: 5, name: '刘医生' }
])

// 统计数据
const statistics = reactive({
  totalVisits: 2845,
  averageWaitTime: 25,
  totalRevenue: 586420,
  averageRevenue: 206,
  visitsTrend: 12.5,
  revenueTrend: 8.3
})

// 表格数据
const tableData = ref([
  {
    date: '2024-12-11',
    totalVisits: 145,
    newPatients: 68,
    returnPatients: 77,
    averageWaitTime: 28,
    totalRevenue: 28960,
    prescriptionCount: 120,
    laboratoryCount: 85
  },
  {
    date: '2024-12-10',
    totalVisits: 132,
    newPatients: 55,
    returnPatients: 77,
    averageWaitTime: 22,
    totalRevenue: 25680,
    prescriptionCount: 108,
    laboratoryCount: 72
  },
  {
    date: '2024-12-09',
    totalVisits: 158,
    newPatients: 72,
    returnPatients: 86,
    averageWaitTime: 31,
    totalRevenue: 32150,
    prescriptionCount: 135,
    laboratoryCount: 95
  }
])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 30
})

// 返回
const handleBack = () => {
  router.push('/statistics')
}

// 筛选变化
const handleFilterChange = () => {
  fetchData()
}

// 维度变化
const handleDimensionChange = () => {
  updateCharts()
}

// 改变图表周期
const changeChartPeriod = (period: string) => {
  chartPeriod.value = period
  updateVisitsTrendChart()
}

// 格式化数字
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

// 查看详情
const viewDetail = (row: any) => {
  ElMessage.info(`查看 ${row.date} 的详细数据`)
}

// 导出报表
const handleExport = () => {
  ElMessage.success('报表导出功能开发中...')
}

// 刷新数据
const handleRefresh = () => {
  fetchData()
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchData()
}

// 获取数据
const fetchData = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 1000)
}

// 初始化门诊量趋势图
const initVisitsTrendChart = () => {
  if (!visitsTrendChartRef.value) return

  visitsTrendChart = echarts.init(visitsTrendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['就诊人次', '新患者', '复诊']
    },
    xAxis: {
      type: 'category',
      data: generateDateLabels(30)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '就诊人次',
        type: 'line',
        data: generateRandomData(30, 80, 160),
        smooth: true,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '新患者',
        type: 'line',
        data: generateRandomData(30, 30, 80),
        smooth: true,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '复诊',
        type: 'line',
        data: generateRandomData(30, 40, 90),
        smooth: true,
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }

  visitsTrendChart.setOption(option)
}

// 初始化科室分布图
const initDepartmentChart = () => {
  if (!departmentChartRef.value) return

  departmentChart = echarts.init(departmentChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '就诊人次',
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 435, name: '内科' },
        { value: 310, name: '外科' },
        { value: 234, name: '儿科' },
        { value: 135, name: '妇产科' },
        { value: 148, name: '眼科' },
        { value: 114, name: '耳鼻喉科' },
        { value: 85, name: '口腔科' }
      ]
    }]
  }

  departmentChart.setOption(option)
}

// 初始化时间段分布图
const initTimeDistributionChart = () => {
  if (!timeDistributionChartRef.value) return

  timeDistributionChart = echarts.init(timeDistributionChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['8-10点', '10-12点', '12-14点', '14-16点', '16-18点', '18-20点']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '就诊人次',
      type: 'bar',
      data: [120, 280, 150, 320, 180, 95],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      }
    }]
  }

  timeDistributionChart.setOption(option)
}

// 初始化疾病类型统计图
const initDiseaseChart = () => {
  if (!diseaseChartRef.value) return

  diseaseChart = echarts.init(diseaseChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['感冒', '高血压', '糖尿病', '胃炎', '支气管炎', '皮肤病']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '病例数',
      type: 'bar',
      data: [85, 62, 48, 35, 28, 22],
      itemStyle: {
        color: '#f56c6c'
      }
    }]
  }

  diseaseChart.setOption(option)
}

// 更新门诊量趋势图
const updateVisitsTrendChart = () => {
  if (!visitsTrendChart) return

  const days = parseInt(chartPeriod.value)
  const option = {
    xAxis: {
      data: generateDateLabels(days)
    },
    series: [
      {
        data: generateRandomData(days, 80, 160)
      },
      {
        data: generateRandomData(days, 30, 80)
      },
      {
        data: generateRandomData(days, 40, 90)
      }
    ]
  }

  visitsTrendChart.setOption(option)
}

// 更新所有图表
const updateCharts = () => {
  updateVisitsTrendChart()
}

// 生成日期标签
const generateDateLabels = (days: number) => {
  const labels = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    labels.push(`${date.getMonth() + 1}/${date.getDate()}`)
  }

  return labels
}

// 生成随机数据
const generateRandomData = (count: number, min: number, max: number) => {
  const data = []
  for (let i = 0; i < count; i++) {
    data.push(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return data
}

// 响应式调整图表大小
const handleResize = () => {
  visitsTrendChart?.resize()
  departmentChart?.resize()
  timeDistributionChart?.resize()
  diseaseChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initVisitsTrendChart()
    initDepartmentChart()
    initTimeDistributionChart()
    initDiseaseChart()
  })

  // 设置默认日期范围
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  filterForm.dateRange = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]

  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)

    // 销毁图表实例
    visitsTrendChart?.dispose()
    departmentChart?.dispose()
    timeDistributionChart?.dispose()
    diseaseChart?.dispose()
  })
})
</script>

<style scoped>
.outpatient-statistics-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  position: relative;
  z-index: 1;
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40px;
  opacity: 0.1;
  color: #409eff;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-card__header) {
  font-weight: bold;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>