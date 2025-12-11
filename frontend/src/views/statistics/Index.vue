<template>
  <div class="statistics-container">
    <el-row :gutter="20">
      <!-- 统计概览卡片 -->
      <el-col :span="6">
        <el-card class="overview-card" @click="navigateTo('/statistics/outpatient')">
          <div class="card-content">
            <div class="card-icon outpatient">
              <el-icon><Stethoscope /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">门诊统计</div>
              <div class="card-value">{{ overviewData.outpatientVisits }}</div>
              <div class="card-desc">今日门诊人次</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card" @click="navigateTo('/statistics/inpatient')">
          <div class="card-content">
            <div class="card-icon inpatient">
              <el-icon><Hospital /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">住院统计</div>
              <div class="card-value">{{ overviewData.inpatientCount }}</div>
              <div class="card-desc">当前住院人数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card" @click="navigateTo('/statistics/patients')">
          <div class="card-content">
            <div class="card-icon patients">
              <el-icon><User /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">患者分析</div>
              <div class="card-value">{{ overviewData.totalPatients }}</div>
              <div class="card-desc">累计患者数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card" @click="navigateTo('/statistics/revenue')">
          <div class="card-content">
            <div class="card-icon revenue">
              <el-icon><Money /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">收入报表</div>
              <div class="card-value">¥{{ formatNumber(overviewData.todayRevenue) }}</div>
              <div class="card-desc">今日收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>门诊趋势图</span>
              <el-button-group size="small">
                <el-button :type="outpatientPeriod === '7' ? 'primary' : ''" @click="changeOutpatientPeriod('7')">7天</el-button>
                <el-button :type="outpatientPeriod === '30' ? 'primary' : ''" @click="changeOutpatientPeriod('30')">30天</el-button>
                <el-button :type="outpatientPeriod === '90' ? 'primary' : ''" @click="changeOutpatientPeriod('90')">90天</el-button>
              </el-button-group>
            </div>
          </template>
          <div ref="outpatientChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>收入趋势图</span>
              <el-button-group size="small">
                <el-button :type="revenuePeriod === '7' ? 'primary' : ''" @click="changeRevenuePeriod('7')">7天</el-button>
                <el-button :type="revenuePeriod === '30' ? 'primary' : ''" @click="changeRevenuePeriod('30')">30天</el-button>
                <el-button :type="revenuePeriod === '90' ? 'primary' : ''" @click="changeRevenuePeriod('90')">90天</el-button>
              </el-button-group>
            </div>
          </template>
          <div ref="revenueChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>科室就诊分布</span>
          </template>
          <div ref="departmentChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>患者年龄分布</span>
          </template>
          <div ref="ageChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时数据监控 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>实时数据监控</span>
          <el-tag type="success">实时更新</el-tag>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-label">当前在线医生</div>
            <div class="monitor-value">{{ realTimeData.onlineDoctors }}</div>
            <div class="monitor-trend up">
              <el-icon><TrendCharts /></el-icon>
              +{{ realTimeData.doctorTrend }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-label">当前排队人数</div>
            <div class="monitor-value">{{ realTimeData.queueCount }}</div>
            <div class="monitor-trend down">
              <el-icon><TrendCharts /></el-icon>
              -{{ realTimeData.queueTrend }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-label">今日处方数</div>
            <div class="monitor-value">{{ realTimeData.todayPrescriptions }}</div>
            <div class="monitor-trend up">
              <el-icon><TrendCharts /></el-icon>
              +{{ realTimeData.prescriptionTrend }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="monitor-item">
            <div class="monitor-label">床位使用率</div>
            <div class="monitor-value">{{ realTimeData.bedOccupancy }}%</div>
            <div class="monitor-trend stable">
              <el-icon><Minus /></el-icon>
              稳定
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Stethoscope, Hospital, User, Money, TrendCharts, Minus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()

// 图表引用
const outpatientChartRef = ref<HTMLElement>()
const revenueChartRef = ref<HTMLElement>()
const departmentChartRef = ref<HTMLElement>()
const ageChartRef = ref<HTMLElement>()

// 图表实例
let outpatientChart: echarts.ECharts | null = null
let revenueChart: echarts.ECharts | null = null
let departmentChart: echarts.ECharts | null = null
let ageChart: echarts.ECharts | null = null

// 时间周期
const outpatientPeriod = ref('30')
const revenuePeriod = ref('30')

// 概览数据
const overviewData = reactive({
  outpatientVisits: 1234,
  inpatientCount: 456,
  totalPatients: 12890,
  todayRevenue: 256780
})

// 实时数据
const realTimeData = reactive({
  onlineDoctors: 45,
  doctorTrend: 3,
  queueCount: 128,
  queueTrend: 15,
  todayPrescriptions: 892,
  prescriptionTrend: 45,
  bedOccupancy: 78
})

// 导航到指定页面
const navigateTo = (path: string) => {
  router.push(path)
}

// 格式化数字
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

// 改变门诊统计周期
const changeOutpatientPeriod = (period: string) => {
  outpatientPeriod.value = period
  updateOutpatientChart()
}

// 改变收入统计周期
const changeRevenuePeriod = (period: string) => {
  revenuePeriod.value = period
  updateRevenueChart()
}

// 初始化门诊趋势图
const initOutpatientChart = () => {
  if (!outpatientChartRef.value) return

  outpatientChart = echarts.init(outpatientChartRef.value)

  const option = {
    title: {
      text: '门诊就诊人次',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#666'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: generateDateLabels(30)
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: generateRandomData(30, 100, 200),
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#409eff'
      },
      areaStyle: {
        opacity: 0.3
      }
    }]
  }

  outpatientChart.setOption(option)
}

// 初始化收入趋势图
const initRevenueChart = () => {
  if (!revenueChartRef.value) return

  revenueChart = echarts.init(revenueChartRef.value)

  const option = {
    title: {
      text: '收入趋势',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#666'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: ¥{c}'
    },
    xAxis: {
      type: 'category',
      data: generateDateLabels(30)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      name: '收入',
      data: generateRandomData(30, 100000, 300000),
      type: 'line',
      smooth: true,
      itemStyle: {
        color: '#67c23a'
      },
      areaStyle: {
        opacity: 0.3
      }
    }]
  }

  revenueChart.setOption(option)
}

// 初始化科室分布图
const initDepartmentChart = () => {
  if (!departmentChartRef.value) return

  departmentChart = echarts.init(departmentChartRef.value)

  const option = {
    title: {
      text: '科室就诊分布',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#666'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '就诊人次',
      type: 'pie',
      radius: '60%',
      data: [
        { value: 335, name: '内科' },
        { value: 310, name: '外科' },
        { value: 234, name: '儿科' },
        { value: 135, name: '妇产科' },
        { value: 148, name: '眼科' },
        { value: 114, name: '耳鼻喉科' },
        { value: 85, name: '口腔科' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  departmentChart.setOption(option)
}

// 初始化年龄分布图
const initAgeChart = () => {
  if (!ageChartRef.value) return

  ageChart = echarts.init(ageChartRef.value)

  const option = {
    title: {
      text: '患者年龄分布',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#666'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '70+']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [120, 200, 350, 400, 320, 280, 180, 150],
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      }
    }]
  }

  ageChart.setOption(option)
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

// 更新门诊图表
const updateOutpatientChart = () => {
  if (!outpatientChart) return

  const days = parseInt(outpatientPeriod.value)
  const option = {
    xAxis: {
      data: generateDateLabels(days)
    },
    series: [{
      data: generateRandomData(days, 100, 200)
    }]
  }

  outpatientChart.setOption(option)
}

// 更新收入图表
const updateRevenueChart = () => {
  if (!revenueChart) return

  const days = parseInt(revenuePeriod.value)
  const option = {
    xAxis: {
      data: generateDateLabels(days)
    },
    series: [{
      data: generateRandomData(days, 100000, 300000)
    }]
  }

  revenueChart.setOption(option)
}

// 更新实时数据
const updateRealTimeData = () => {
  // 模拟实时数据更新
  realTimeData.onlineDoctors = Math.floor(Math.random() * 10) + 40
  realTimeData.queueCount = Math.floor(Math.random() * 50) + 100
  realTimeData.todayPrescriptions += Math.floor(Math.random() * 10)
  realTimeData.bedOccupancy = Math.floor(Math.random() * 20) + 70
}

// 响应式调整图表大小
const handleResize = () => {
  outpatientChart?.resize()
  revenueChart?.resize()
  departmentChart?.resize()
  ageChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initOutpatientChart()
    initRevenueChart()
    initDepartmentChart()
    initAgeChart()
  })

  // 定时更新实时数据
  const timer = setInterval(updateRealTimeData, 30000)

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    clearInterval(timer)
    window.removeEventListener('resize', handleResize)

    // 销毁图表实例
    outpatientChart?.dispose()
    revenueChart?.dispose()
    departmentChart?.dispose()
    ageChart?.dispose()
  })
})
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.overview-card {
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.overview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 10px;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 28px;
  color: white;
}

.card-icon.outpatient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon.inpatient {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon.patients {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon.revenue {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 14px;
  color: #999;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.monitor-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.monitor-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.monitor-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.monitor-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.monitor-trend.up {
  color: #67c23a;
}

.monitor-trend.down {
  color: #f56c6c;
}

.monitor-trend.stable {
  color: #909399;
}
</style>