<template>
  <div class="patient-analysis-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>患者分析</h2>
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
          <el-form-item label="分析维度">
            <el-select
              v-model="filterForm.dimension"
              placeholder="请选择分析维度"
              @change="handleDimensionChange"
            >
              <el-option label="年龄段分析" value="age" />
              <el-option label="性别分析" value="gender" />
              <el-option label="地域分析" value="region" />
              <el-option label="疾病分析" value="disease" />
              <el-option label="就诊频次" value="frequency" />
            </el-select>
          </el-form-item>
          <el-form-item label="患者类型">
            <el-select
              v-model="filterForm.patientType"
              placeholder="请选择患者类型"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="初诊患者" value="new" />
              <el-option label="复诊患者" value="return" />
              <el-option label="急诊患者" value="emergency" />
              <el-option label="住院患者" value="inpatient" />
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
                <div class="stat-value">{{ statistics.totalPatients }}</div>
                <div class="stat-label">总患者数</div>
                <div class="stat-trend">
                  <el-icon v-if="statistics.patientsTrend > 0" class="trend-up"><CaretTop /></el-icon>
                  <el-icon v-else class="trend-down"><CaretBottom /></el-icon>
                  {{ Math.abs(statistics.patientsTrend) }}%
                </div>
              </div>
              <el-icon class="stat-icon"><User /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.newPatients }}</div>
                <div class="stat-label">新增患者</div>
                <div class="stat-trend">本月</div>
              </div>
              <el-icon class="stat-icon"><UserFilled /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.averageAge }}</div>
                <div class="stat-label">平均年龄</div>
                <div class="stat-trend">岁</div>
              </div>
              <el-icon class="stat-icon"><Calendar /></el-icon>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-value">{{ statistics.retentionRate }}%</div>
                <div class="stat-label">患者留存率</div>
                <div class="stat-trend">年度</div>
              </div>
              <el-icon class="stat-icon"><TrendCharts /></el-icon>
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
                  <span>患者趋势分析</span>
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
              <div ref="patientTrendChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>年龄分布</span>
                  <el-select v-model="ageAnalysisType" size="small" @change="updateAgeChart">
                    <el-option label="年龄段" value="range" />
                    <el-option label="详细年龄" value="detail" />
                  </el-select>
                </div>
              </template>
              <div ref="ageDistributionChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>性别分布</span>
              </template>
              <div ref="genderChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>地域分布</span>
              </template>
              <div ref="regionChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>就诊频次分布</span>
              </template>
              <div ref="frequencyChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>疾病类型分布</span>
              </template>
              <div ref="diseaseChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>患者满意度</span>
              </template>
              <div ref="satisfactionChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 患者画像分析 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>患者画像分析</span>
            <el-button type="primary" @click="refreshPatientProfile">
              <el-icon><Refresh /></el-icon>
              刷新画像
            </el-button>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="profile-card">
              <h4>典型患者画像 1</h4>
              <div class="profile-content">
                <div class="profile-item">
                  <span class="label">年龄范围：</span>
                  <span class="value">25-35岁</span>
                </div>
                <div class="profile-item">
                  <span class="label">主要疾病：</span>
                  <span class="value">呼吸道疾病</span>
                </div>
                <div class="profile-item">
                  <span class="label">就诊频次：</span>
                  <span class="value">2-3次/年</span>
                </div>
                <div class="profile-item">
                  <span class="label">消费水平：</span>
                  <span class="value">中等</span>
                </div>
                <div class="profile-item">
                  <span class="label">满意度：</span>
                  <el-rate v-model="profileData.satisfaction1" disabled show-score />
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="profile-card">
              <h4>典型患者画像 2</h4>
              <div class="profile-content">
                <div class="profile-item">
                  <span class="label">年龄范围：</span>
                  <span class="value">45-60岁</span>
                </div>
                <div class="profile-item">
                  <span class="label">主要疾病：</span>
                  <span class="value">慢性疾病</span>
                </div>
                <div class="profile-item">
                  <span class="label">就诊频次：</span>
                  <span class="value">6-8次/年</span>
                </div>
                <div class="profile-item">
                  <span class="label">消费水平：</span>
                  <span class="value">较高</span>
                </div>
                <div class="profile-item">
                  <span class="label">满意度：</span>
                  <el-rate v-model="profileData.satisfaction2" disabled show-score />
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="profile-card">
              <h4>典型患者画像 3</h4>
              <div class="profile-content">
                <div class="profile-item">
                  <span class="label">年龄范围：</span>
                  <span class="value">0-15岁</span>
                </div>
                <div class="profile-item">
                  <span class="label">主要疾病：</span>
                  <span class="value">儿童常见病</span>
                </div>
                <div class="profile-item">
                  <span class="label">就诊频次：</span>
                  <span class="value">3-5次/年</span>
                </div>
                <div class="profile-item">
                  <span class="label">消费水平：</span>
                  <span class="value">中等</span>
                </div>
                <div class="profile-item">
                  <span class="label">满意度：</span>
                  <el-rate v-model="profileData.satisfaction3" disabled show-score />
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 详细数据表格 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>患者分析详情</span>
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
          <el-table-column prop="newPatients" label="新增患者" width="100" align="center" />
          <el-table-column prop="returnPatients" label="复诊患者" width="100" align="center" />
          <el-table-column prop="emergencyPatients" label="急诊患者" width="100" align="center" />
          <el-table-column prop="averageAge" label="平均年龄" width="100" align="center">
            <template #default="{ row }">
              {{ row.averageAge }} 岁
            </template>
          </el-table-column>
          <el-table-column prop="maleRatio" label="男性比例" width="100" align="center">
            <template #default="{ row }">
              {{ row.maleRatio }}%
            </template>
          </el-table-column>
          <el-table-column prop="localPatients" label="本地患者" width="100" align="center" />
          <el-table-column prop="outPatients" label="外地患者" width="100" align="center" />
          <el-table-column prop="averageCost" label="人均费用" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.averageCost) }}
            </template>
          </el-table-column>
          <el-table-column prop="satisfaction" label="满意度" width="150" align="center">
            <template #default="{ row }">
              <el-rate v-model="row.satisfaction" disabled show-score />
            </template>
          </el-table-column>
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
  User,
  UserFilled,
  Calendar,
  TrendCharts,
  CaretTop,
  CaretBottom,
  Download,
  Refresh
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()

// 图表引用
const patientTrendChartRef = ref<HTMLElement>()
const ageDistributionChartRef = ref<HTMLElement>()
const genderChartRef = ref<HTMLElement>()
const regionChartRef = ref<HTMLElement>()
const frequencyChartRef = ref<HTMLElement>()
const diseaseChartRef = ref<HTMLElement>()
const satisfactionChartRef = ref<HTMLElement>()

// 图表实例
let patientTrendChart: echarts.ECharts | null = null
let ageDistributionChart: echarts.ECharts | null = null
let genderChart: echarts.ECharts | null = null
let regionChart: echarts.ECharts | null = null
let frequencyChart: echarts.ECharts | null = null
let diseaseChart: echarts.ECharts | null = null
let satisfactionChart: echarts.ECharts | null = null

// 响应式数据
const loading = ref(false)
const chartPeriod = ref('30')
const ageAnalysisType = ref('range')

// 筛选表单
const filterForm = reactive({
  dateRange: [],
  dimension: 'age',
  patientType: ''
})

// 统计数据
const statistics = reactive({
  totalPatients: 15678,
  newPatients: 456,
  averageAge: 38.5,
  retentionRate: 85.2,
  patientsTrend: 8.3
})

// 患者画像数据
const profileData = reactive({
  satisfaction1: 4.2,
  satisfaction2: 4.5,
  satisfaction3: 4.3
})

// 表格数据
const tableData = ref([
  {
    date: '2024-12-11',
    newPatients: 45,
    returnPatients: 128,
    emergencyPatients: 23,
    averageAge: 37.2,
    maleRatio: 52,
    localPatients: 156,
    outPatients: 40,
    averageCost: 2850,
    satisfaction: 4.3
  },
  {
    date: '2024-12-10',
    newPatients: 38,
    returnPatients: 142,
    emergencyPatients: 18,
    averageAge: 39.1,
    maleRatio: 48,
    localPatients: 168,
    outPatients: 30,
    averageCost: 3120,
    satisfaction: 4.4
  },
  {
    date: '2024-12-09',
    newPatients: 52,
    returnPatients: 135,
    emergencyPatients: 25,
    averageAge: 36.8,
    maleRatio: 55,
    localPatients: 172,
    outPatients: 40,
    averageCost: 2680,
    satisfaction: 4.2
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
  updatePatientTrendChart()
}

// 更新年龄图表
const updateAgeChart = () => {
  initAgeDistributionChart()
}

// 刷新患者画像
const refreshPatientProfile = () => {
  ElMessage.success('患者画像已刷新')
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

// 初始化患者趋势图
const initPatientTrendChart = () => {
  if (!patientTrendChartRef.value) return

  patientTrendChart = echarts.init(patientTrendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['新增患者', '复诊患者', '急诊患者']
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
        name: '新增患者',
        type: 'line',
        data: generateRandomData(30, 30, 60),
        smooth: true,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '复诊患者',
        type: 'line',
        data: generateRandomData(30, 100, 180),
        smooth: true,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '急诊患者',
        type: 'line',
        data: generateRandomData(30, 10, 35),
        smooth: true,
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }

  patientTrendChart.setOption(option)
}

// 初始化年龄分布图
const initAgeDistributionChart = () => {
  if (!ageDistributionChartRef.value) return

  ageDistributionChart = echarts.init(ageDistributionChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ageAnalysisType.value === 'range'
        ? ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '70+']
        : Array.from({length: 80}, (_, i) => i + 1).slice(0, 20)
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '患者数量',
      type: 'bar',
      data: ageAnalysisType.value === 'range'
        ? generateRandomData(8, 50, 200)
        : generateRandomData(20, 10, 50),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      }
    }]
  }

  ageDistributionChart.setOption(option)
}

// 初始化性别分布图
const initGenderChart = () => {
  if (!genderChartRef.value) return

  genderChart = echarts.init(genderChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '性别分布',
      type: 'pie',
      radius: '70%',
      data: [
        { value: 7856, name: '男性' },
        { value: 7822, name: '女性' }
      ]
    }]
  }

  genderChart.setOption(option)
}

// 初始化地域分布图
const initRegionChart = () => {
  if (!regionChartRef.value) return

  regionChart = echarts.init(regionChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '地域分布',
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 8456, name: '本地' },
        { value: 3867, name: '周边城市' },
        { value: 2156, name: '外省' },
        { value: 1199, name: '其他' }
      ]
    }]
  }

  regionChart.setOption(option)
}

// 初始化就诊频次图
const initFrequencyChart = () => {
  if (!frequencyChartRef.value) return

  frequencyChart = echarts.init(frequencyChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1次', '2-3次', '4-6次', '7-10次', '10+次']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '患者数量',
      type: 'bar',
      data: [2856, 4567, 3214, 1890, 1151],
      itemStyle: { color: '#f56c6c' }
    }]
  }

  frequencyChart.setOption(option)
}

// 初始化疾病类型图
const initDiseaseChart = () => {
  if (!diseaseChartRef.value) return

  diseaseChart = echarts.init(diseaseChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '疾病类型',
      type: 'pie',
      radius: '70%',
      data: [
        { value: 3256, name: '呼吸道疾病' },
        { value: 2845, name: '消化系统疾病' },
        { value: 2156, name: '心血管疾病' },
        { value: 1834, name: '神经系统疾病' },
        { value: 1567, name: '骨科疾病' },
        { value: 1345, name: '皮肤科疾病' },
        { value: 2675, name: '其他' }
      ]
    }]
  }

  diseaseChart.setOption(option)
}

// 初始化满意度图
const initSatisfactionChart = () => {
  if (!satisfactionChartRef.value) return

  satisfactionChart = echarts.init(satisfactionChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['非常满意', '满意', '一般', '不满意', '非常不满意']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '患者数量',
      type: 'bar',
      data: [6543, 5234, 2145, 456, 123],
      itemStyle: {
        color: function(params) {
          const colors = ['#67c23a', '#409eff', '#e6a23c', '#f56c6c', '#909399']
          return colors[params.dataIndex]
        }
      }
    }]
  }

  satisfactionChart.setOption(option)
}

// 更新患者趋势图
const updatePatientTrendChart = () => {
  if (!patientTrendChart) return

  const days = parseInt(chartPeriod.value)
  const option = {
    xAxis: {
      data: generateDateLabels(days)
    },
    series: [
      {
        data: generateRandomData(days, 30, 60)
      },
      {
        data: generateRandomData(days, 100, 180)
      },
      {
        data: generateRandomData(days, 10, 35)
      }
    ]
  }

  patientTrendChart.setOption(option)
}

// 更新所有图表
const updateCharts = () => {
  updatePatientTrendChart()
  initAgeDistributionChart()
  initGenderChart()
  initRegionChart()
  initFrequencyChart()
  initDiseaseChart()
  initSatisfactionChart()
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
  patientTrendChart?.resize()
  ageDistributionChart?.resize()
  genderChart?.resize()
  regionChart?.resize()
  frequencyChart?.resize()
  diseaseChart?.resize()
  satisfactionChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initPatientTrendChart()
    initAgeDistributionChart()
    initGenderChart()
    initRegionChart()
    initFrequencyChart()
    initDiseaseChart()
    initSatisfactionChart()
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
    patientTrendChart?.dispose()
    ageDistributionChart?.dispose()
    genderChart?.dispose()
    regionChart?.dispose()
    frequencyChart?.dispose()
    diseaseChart?.dispose()
    satisfactionChart?.dispose()
  })
})
</script>

<style scoped>
.patient-analysis-container {
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

.profile-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  height: 100%;
}

.profile-card h4 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-item .label {
  color: #666;
  font-size: 14px;
}

.profile-item .value {
  color: #303133;
  font-weight: 500;
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

:deep(.el-rate) {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>