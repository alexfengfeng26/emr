<template>
  <div class="inpatient-statistics-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>住院统计</h2>
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
          <el-form-item label="病区">
            <el-select
              v-model="filterForm.wardId"
              placeholder="请选择病区"
              clearable
              @change="handleFilterChange"
            >
              <el-option
                v-for="ward in wards"
                :key="ward.id"
                :label="ward.name"
                :value="ward.id"
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
                <div class="stat-value">{{ statistics.currentInpatients }}</div>
                <div class="stat-label">当前住院人数</div>
                <div class="stat-trend">
                  <el-icon v-if="statistics.inpatientsTrend > 0" class="trend-up"><CaretTop /></el-icon>
                  <el-icon v-else class="trend-down"><CaretBottom /></el-icon>
                  {{ Math.abs(statistics.inpatientsTrend) }}%
                </div>
              </div>
              <el-icon class="stat-icon"><HospitalBed /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.occupancyRate }}%</div>
                <div class="stat-label">床位使用率</div>
                <div class="stat-trend">
                  <el-icon v-if="statistics.occupancyTrend > 0" class="trend-up"><CaretTop /></el-icon>
                  <el-icon v-else class="trend-down"><CaretBottom /></el-icon>
                  {{ Math.abs(statistics.occupancyTrend) }}%
                </div>
              </div>
              <el-icon class="stat-icon"><DataBoard /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.averageStayDays }}</div>
                <div class="stat-label">平均住院天数</div>
                <div class="stat-trend">天</div>
              </div>
              <el-icon class="stat-icon"><Calendar /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">¥{{ formatNumber(statistics.totalRevenue) }}</div>
                <div class="stat-label">住院总收入</div>
                <div class="stat-trend">
                  <el-icon v-if="statistics.revenueTrend > 0" class="trend-up"><CaretTop /></el-icon>
                  <el-icon v-else class="trend-down"><CaretBottom /></el-icon>
                  {{ Math.abs(statistics.revenueTrend) }}%
                </div>
              </div>
              <el-icon class="stat-icon"><Money /></el-icon>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>住院人数趋势</span>
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
              <div ref="inpatientTrendChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>床位使用率趋势</span>
              </template>
              <div ref="occupancyChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>科室住院分布</span>
              </template>
              <div ref="departmentChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>病区床位状态</span>
              </template>
              <div ref="wardStatusChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 床位状态监控 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>床位状态监控</span>
            <el-button type="primary" @click="refreshBedStatus">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <el-table :data="bedStatusData" border>
          <el-table-column prop="wardName" label="病区" width="120" />
          <el-table-column prop="totalBeds" label="总床位数" width="100" align="center" />
          <el-table-column prop="occupiedBeds" label="已占用" width="100" align="center" />
          <el-table-column prop="availableBeds" label="空闲" width="100" align="center" />
          <el-table-column prop="reservedBeds" label="预留" width="100" align="center" />
          <el-table-column prop="maintenanceBeds" label="维修" width="100" align="center" />
          <el-table-column label="使用率" width="150" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="row.occupancyRate"
                :color="getOccupancyColor(row.occupancyRate)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getWardStatusType(row.occupancyRate)">
                {{ getWardStatus(row.occupancyRate) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 详细数据表格 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>住院详细数据</span>
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
          <el-table-column prop="admissions" label="入院人数" width="100" align="center" />
          <el-table-column prop="discharges" label="出院人数" width="100" align="center" />
          <el-table-column prop="transfers" label="转科人数" width="100" align="center" />
          <el-table-column prop="currentInpatients" label="当前在院" width="100" align="center" />
          <el-table-column prop="averageStayDays" label="平均住院天数" width="120" align="center">
            <template #default="{ row }">
              {{ row.averageStayDays }} 天
            </template>
          </el-table-column>
          <el-table-column prop="totalRevenue" label="总收入" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.totalRevenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="surgeryCount" label="手术数" width="100" align="center" />
          <el-table-column prop="emergencyCount" label="急诊入院" width="100" align="center" />
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
  HospitalBed,
  DataBoard,
  Calendar,
  Money,
  CaretTop,
  CaretBottom,
  Download,
  Refresh
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()

// 图表引用
const inpatientTrendChartRef = ref<HTMLElement>()
const occupancyChartRef = ref<HTMLElement>()
const departmentChartRef = ref<HTMLElement>()
const wardStatusChartRef = ref<HTMLElement>()

// 图表实例
let inpatientTrendChart: echarts.ECharts | null = null
let occupancyChart: echarts.ECharts | null = null
let departmentChart: echarts.ECharts | null = null
let wardStatusChart: echarts.ECharts | null = null

// 响应式数据
const loading = ref(false)
const chartPeriod = ref('30')

// 筛选表单
const filterForm = reactive({
  dateRange: [],
  departmentId: '',
  wardId: '',
  dimension: 'day'
})

// 科室列表
const departments = ref([
  { id: 1, name: '内科' },
  { id: 2, name: '外科' },
  { id: 3, name: '儿科' },
  { id: 4, name: '妇产科' },
  { id: 5, name: '骨科' },
  { id: 6, name: '神经科' },
  { id: 7, name: '心内科' }
])

// 病区列表
const wards = ref([
  { id: 1, name: '内科一区' },
  { id: 2, name: '内科二区' },
  { id: 3, name: '外科一区' },
  { id: 4, name: '外科二区' },
  { id: 5, name: '妇产科区' },
  { id: 6, name: '儿科病区' },
  { id: 7, name: 'ICU' }
])

// 统计数据
const statistics = reactive({
  currentInpatients: 456,
  occupancyRate: 85,
  inpatientsTrend: 3.2,
  averageStayDays: 8.5,
  totalRevenue: 2456780,
  revenueTrend: 5.8,
  occupancyTrend: 2.1
})

// 床位状态数据
const bedStatusData = ref([
  {
    wardName: '内科一区',
    totalBeds: 50,
    occupiedBeds: 42,
    availableBeds: 6,
    reservedBeds: 1,
    maintenanceBeds: 1,
    occupancyRate: 84
  },
  {
    wardName: '内科二区',
    totalBeds: 45,
    occupiedBeds: 38,
    availableBeds: 5,
    reservedBeds: 2,
    maintenanceBeds: 0,
    occupancyRate: 84.4
  },
  {
    wardName: '外科一区',
    totalBeds: 55,
    occupiedBeds: 48,
    availableBeds: 4,
    reservedBeds: 2,
    maintenanceBeds: 1,
    occupancyRate: 87.3
  },
  {
    wardName: '外科二区',
    totalBeds: 48,
    occupiedBeds: 35,
    availableBeds: 11,
    reservedBeds: 2,
    maintenanceBeds: 0,
    occupancyRate: 72.9
  },
  {
    wardName: '妇产科区',
    totalBeds: 40,
    occupiedBeds: 36,
    availableBeds: 3,
    reservedBeds: 1,
    maintenanceBeds: 0,
    occupancyRate: 90
  },
  {
    wardName: '儿科病区',
    totalBeds: 35,
    occupiedBeds: 28,
    availableBeds: 6,
    reservedBeds: 1,
    maintenanceBeds: 0,
    occupancyRate: 80
  },
  {
    wardName: 'ICU',
    totalBeds: 20,
    occupiedBeds: 18,
    availableBeds: 1,
    reservedBeds: 1,
    maintenanceBeds: 0,
    occupancyRate: 90
  }
])

// 表格数据
const tableData = ref([
  {
    date: '2024-12-11',
    admissions: 28,
    discharges: 25,
    transfers: 5,
    currentInpatients: 456,
    averageStayDays: 8.2,
    totalRevenue: 85420,
    surgeryCount: 12,
    emergencyCount: 8
  },
  {
    date: '2024-12-10',
    admissions: 32,
    discharges: 28,
    transfers: 3,
    currentInpatients: 453,
    averageStayDays: 8.5,
    totalRevenue: 92680,
    surgeryCount: 15,
    emergencyCount: 6
  },
  {
    date: '2024-12-09',
    admissions: 25,
    discharges: 30,
    transfers: 4,
    currentInpatients: 449,
    averageStayDays: 8.8,
    totalRevenue: 78950,
    surgeryCount: 10,
    emergencyCount: 9
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
  updateInpatientTrendChart()
}

// 刷新床位状态
const refreshBedStatus = () => {
  ElMessage.success('床位状态已刷新')
}

// 格式化数字
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

// 获取使用率颜色
const getOccupancyColor = (rate: number) => {
  if (rate < 70) return '#67c23a'
  if (rate < 85) return '#e6a23c'
  return '#f56c6c'
}

// 获取病区状态
const getWardStatus = (rate: number) => {
  if (rate < 70) return '充足'
  if (rate < 85) return '紧张'
  return '饱和'
}

// 获取病区状态类型
const getWardStatusType = (rate: number) => {
  if (rate < 70) return 'success'
  if (rate < 85) return 'warning'
  return 'danger'
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

// 初始化住院人数趋势图
const initInpatientTrendChart = () => {
  if (!inpatientTrendChartRef.value) return

  inpatientTrendChart = echarts.init(inpatientTrendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['入院人数', '出院人数', '当前在院']
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
        name: '入院人数',
        type: 'bar',
        data: generateRandomData(30, 20, 40),
        itemStyle: { color: '#409eff' }
      },
      {
        name: '出院人数',
        type: 'bar',
        data: generateRandomData(30, 15, 35),
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '当前在院',
        type: 'line',
        data: generateRandomData(30, 400, 500),
        smooth: true,
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }

  inpatientTrendChart.setOption(option)
}

// 初始化床位使用率趋势图
const initOccupancyChart = () => {
  if (!occupancyChartRef.value) return

  occupancyChart = echarts.init(occupancyChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: {c}%'
    },
    xAxis: {
      type: 'category',
      data: generateDateLabels(30)
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: '床位使用率',
      type: 'line',
      data: generateRandomData(30, 70, 95),
      smooth: true,
      itemStyle: { color: '#f56c6c' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
          { offset: 1, color: 'rgba(245, 108, 108, 0.1)' }
        ])
      },
      markLine: {
        data: [
          { yAxis: 85, name: '警戒线' },
          { yAxis: 95, name: '饱和线' }
        ]
      }
    }]
  }

  occupancyChart.setOption(option)
}

// 初始化科室分布图
const initDepartmentChart = () => {
  if (!departmentChartRef.value) return

  departmentChart = echarts.init(departmentChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c}人 ({d}%)'
    },
    series: [{
      name: '住院人数',
      type: 'pie',
      radius: '70%',
      data: [
        { value: 120, name: '内科' },
        { value: 95, name: '外科' },
        { value: 68, name: '妇产科' },
        { value: 52, name: '儿科' },
        { value: 45, name: '骨科' },
        { value: 38, name: '神经科' },
        { value: 38, name: '心内科' }
      ]
    }]
  }

  departmentChart.setOption(option)
}

// 初始化病区状态图
const initWardStatusChart = () => {
  if (!wardStatusChartRef.value) return

  wardStatusChart = echarts.init(wardStatusChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['已占用', '空闲', '预留', '维修']
    },
    xAxis: {
      type: 'category',
      data: bedStatusData.value.map(item => item.wardName)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '已占用',
        type: 'bar',
        stack: 'total',
        data: bedStatusData.value.map(item => item.occupiedBeds),
        itemStyle: { color: '#f56c6c' }
      },
      {
        name: '空闲',
        type: 'bar',
        stack: 'total',
        data: bedStatusData.value.map(item => item.availableBeds),
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '预留',
        type: 'bar',
        stack: 'total',
        data: bedStatusData.value.map(item => item.reservedBeds),
        itemStyle: { color: '#e6a23c' }
      },
      {
        name: '维修',
        type: 'bar',
        stack: 'total',
        data: bedStatusData.value.map(item => item.maintenanceBeds),
        itemStyle: { color: '#909399' }
      }
    ]
  }

  wardStatusChart.setOption(option)
}

// 更新住院人数趋势图
const updateInpatientTrendChart = () => {
  if (!inpatientTrendChart) return

  const days = parseInt(chartPeriod.value)
  const option = {
    xAxis: {
      data: generateDateLabels(days)
    },
    series: [
      {
        data: generateRandomData(days, 20, 40)
      },
      {
        data: generateRandomData(days, 15, 35)
      },
      {
        data: generateRandomData(days, 400, 500)
      }
    ]
  }

  inpatientTrendChart.setOption(option)
}

// 更新所有图表
const updateCharts = () => {
  updateInpatientTrendChart()
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
  inpatientTrendChart?.resize()
  occupancyChart?.resize()
  departmentChart?.resize()
  wardStatusChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initInpatientTrendChart()
    initOccupancyChart()
    initDepartmentChart()
    initWardStatusChart()
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
    inpatientTrendChart?.dispose()
    occupancyChart?.dispose()
    departmentChart?.dispose()
    wardStatusChart?.dispose()
  })
})
</script>

<style scoped>
.inpatient-statistics-container {
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

:deep(.el-progress-bar__outer) {
  background-color: #f0f0f0;
}

:deep(.el-progress-bar__inner) {
  transition: all 0.3s ease;
}
</style>