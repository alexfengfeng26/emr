<template>
  <div class="revenue-report-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>收入报表</h2>
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
          <el-form-item label="报表类型">
            <el-select
              v-model="filterForm.reportType"
              placeholder="请选择报表类型"
              @change="handleReportTypeChange"
            >
              <el-option label="日报" value="daily" />
              <el-option label="周报" value="weekly" />
              <el-option label="月报" value="monthly" />
              <el-option label="季报" value="quarterly" />
              <el-option label="年报" value="yearly" />
            </el-select>
          </el-form-item>
          <el-form-item label="收入类型">
            <el-select
              v-model="filterForm.revenueType"
              placeholder="请选择收入类型"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="门诊收入" value="outpatient" />
              <el-option label="住院收入" value="inpatient" />
              <el-option label="药品收入" value="medicine" />
              <el-option label="检查收入" value="examination" />
              <el-option label="手术收入" value="surgery" />
            </el-select>
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
        </el-form>
      </div>

      <!-- 收入概览卡片 -->
      <div class="revenue-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="revenue-card total">
              <div class="revenue-content">
                <div class="revenue-icon">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="revenue-info">
                  <div class="revenue-title">总收入</div>
                  <div class="revenue-value">¥{{ formatNumber(statistics.totalRevenue) }}</div>
                  <div class="revenue-trend">
                    <el-icon v-if="statistics.revenueTrend > 0" class="trend-up"><CaretTop /></el-icon>
                    <el-icon v-else class="trend-down"><CaretBottom /></el-icon>
                    {{ Math.abs(statistics.revenueTrend) }}% 较上期
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="revenue-card outpatient">
              <div class="revenue-content">
                <div class="revenue-icon">
                  <el-icon><Stethoscope /></el-icon>
                </div>
                <div class="revenue-info">
                  <div class="revenue-title">门诊收入</div>
                  <div class="revenue-value">¥{{ formatNumber(statistics.outpatientRevenue) }}</div>
                  <div class="revenue-percent">{{ getPercent(statistics.outpatientRevenue, statistics.totalRevenue) }}%</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="revenue-card inpatient">
              <div class="revenue-content">
                <div class="revenue-icon">
                  <el-icon><Hospital /></el-icon>
                </div>
                <div class="revenue-info">
                  <div class="revenue-title">住院收入</div>
                  <div class="revenue-value">¥{{ formatNumber(statistics.inpatientRevenue) }}</div>
                  <div class="revenue-percent">{{ getPercent(statistics.inpatientRevenue, statistics.totalRevenue) }}%</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="revenue-card medicine">
              <div class="revenue-content">
                <div class="revenue-icon">
                  <el-icon><Box /></el-icon>
                </div>
                <div class="revenue-info">
                  <div class="revenue-title">药品收入</div>
                  <div class="revenue-value">¥{{ formatNumber(statistics.medicineRevenue) }}</div>
                  <div class="revenue-percent">{{ getPercent(statistics.medicineRevenue, statistics.totalRevenue) }}%</div>
                </div>
              </div>
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
                  <span>收入趋势分析</span>
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
                    <el-button
                      :type="chartPeriod === '365' ? 'primary' : ''"
                      @click="changeChartPeriod('365')"
                    >
                      近一年
                    </el-button>
                  </el-button-group>
                </div>
              </template>
              <div ref="revenueTrendChartRef" class="chart-container-large"></div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>收入构成分析</span>
              </template>
              <div ref="revenueCompositionChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>科室收入排名</span>
                  <el-button size="small" @click="refreshDepartmentRanking">
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </div>
              </template>
              <div ref="departmentRankingChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>收费项目分析</span>
              </template>
              <div ref="chargeItemChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 收入明细表格 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>收入明细</span>
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
          show-summary
          :summary-method="getSummaries"
        >
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="outpatientRevenue" label="门诊收入" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.outpatientRevenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="inpatientRevenue" label="住院收入" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.inpatientRevenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="medicineRevenue" label="药品收入" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.medicineRevenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="examinationRevenue" label="检查收入" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.examinationRevenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="surgeryRevenue" label="手术收入" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.surgeryRevenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="otherRevenue" label="其他收入" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.otherRevenue) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalRevenue" label="总收入" width="140" align="right">
            <template #default="{ row }">
              <span class="total-revenue">¥{{ formatNumber(row.totalRevenue) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="patientCount" label="就诊人次" width="100" align="center" />
          <el-table-column prop="averageRevenue" label="人均费用" width="120" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.averageRevenue) }}
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

      <!-- 收入对比分析 -->
      <el-card style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>收入对比分析</span>
            <el-button-group size="small">
              <el-button
                :type="comparePeriod === 'month' ? 'primary' : ''"
                @click="changeComparePeriod('month')"
              >
                月同比
              </el-button>
              <el-button
                :type="comparePeriod === 'quarter' ? 'primary' : ''"
                @click="changeComparePeriod('quarter')"
              >
                季同比
              </el-button>
              <el-button
                :type="comparePeriod === 'year' ? 'primary' : ''"
                @click="changeComparePeriod('year')"
              >
                年同比
              </el-button>
            </el-button-group>
          </div>
        </template>

        <el-table :data="compareData" border>
          <el-table-column prop="item" label="项目" width="150" />
          <el-table-column prop="currentPeriod" label="本期" width="140" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.currentPeriod) }}
            </template>
          </el-table-column>
          <el-table-column prop="lastPeriod" label="上期" width="140" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.lastPeriod) }}
            </template>
          </el-table-column>
          <el-table-column label="增长额" width="140" align="right">
            <template #default="{ row }">
              <span :class="getGrowthClass(row.growthAmount)">
                ¥{{ formatNumber(Math.abs(row.growthAmount)) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="增长率" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getGrowthType(row.growthRate)">
                {{ row.growthRate > 0 ? '+' : '' }}{{ row.growthRate.toFixed(2) }}%
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
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
  Money,
  Stethoscope,
  Hospital,
  Box,
  CaretTop,
  CaretBottom,
  Download,
  Refresh
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()

// 图表引用
const revenueTrendChartRef = ref<HTMLElement>()
const revenueCompositionChartRef = ref<HTMLElement>()
const departmentRankingChartRef = ref<HTMLElement>()
const chargeItemChartRef = ref<HTMLElement>()

// 图表实例
let revenueTrendChart: echarts.ECharts | null = null
let revenueCompositionChart: echarts.ECharts | null = null
let departmentRankingChart: echarts.ECharts | null = null
let chargeItemChart: echarts.ECharts | null = null

// 响应式数据
const loading = ref(false)
const chartPeriod = ref('30')
const comparePeriod = ref('month')

// 筛选表单
const filterForm = reactive({
  dateRange: [],
  reportType: 'daily',
  revenueType: '',
  departmentId: ''
})

// 科室列表
const departments = ref([
  { id: 1, name: '内科' },
  { id: 2, name: '外科' },
  { id: 3, name: '儿科' },
  { id: 4, name: '妇产科' },
  { id: 5, name: '骨科' },
  { id: 6, name: '眼科' },
  { id: 7, name: '耳鼻喉科' }
])

// 统计数据
const statistics = reactive({
  totalRevenue: 5846720,
  outpatientRevenue: 2845680,
  inpatientRevenue: 2456780,
  medicineRevenue: 1289450,
  revenueTrend: 12.5
})

// 表格数据
const tableData = ref([
  {
    date: '2024-12-11',
    outpatientRevenue: 285640,
    inpatientRevenue: 256780,
    medicineRevenue: 128450,
    examinationRevenue: 85620,
    surgeryRevenue: 125680,
    otherRevenue: 28550,
    totalRevenue: 910720,
    patientCount: 356,
    averageRevenue: 2557
  },
  {
    date: '2024-12-10',
    outpatientRevenue: 272890,
    inpatientRevenue: 248920,
    medicineRevenue: 132100,
    examinationRevenue: 78450,
    surgeryRevenue: 118760,
    otherRevenue: 26890,
    totalRevenue: 877010,
    patientCount: 342,
    averageRevenue: 2564
  },
  {
    date: '2024-12-09',
    outpatientRevenue: 298450,
    inpatientRevenue: 265340,
    medicineRevenue: 142680,
    examinationRevenue: 92150,
    surgeryRevenue: 135420,
    otherRevenue: 31280,
    totalRevenue: 965320,
    patientCount: 378,
    averageRevenue: 2553
  }
])

// 对比数据
const compareData = ref([
  {
    item: '总收入',
    currentPeriod: 5846720,
    lastPeriod: 5198450,
    growthAmount: 648270,
    growthRate: 12.48
  },
  {
    item: '门诊收入',
    currentPeriod: 2845680,
    lastPeriod: 2562340,
    growthAmount: 283340,
    growthRate: 11.06
  },
  {
    item: '住院收入',
    currentPeriod: 2456780,
    lastPeriod: 2189450,
    growthAmount: 267330,
    growthRate: 12.21
  },
  {
    item: '药品收入',
    currentPeriod: 1289450,
    lastPeriod: 1145670,
    growthAmount: 143780,
    growthRate: 12.55
  },
  {
    item: '检查收入',
    currentPeriod: 656780,
    lastPeriod: 523450,
    growthAmount: 133330,
    growthRate: 25.48
  },
  {
    item: '手术收入',
    currentPeriod: 894560,
    lastPeriod: 782340,
    growthAmount: 112220,
    growthRate: 14.34
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

// 报表类型变化
const handleReportTypeChange = () => {
  updateCharts()
}

// 改变图表周期
const changeChartPeriod = (period: string) => {
  chartPeriod.value = period
  updateRevenueTrendChart()
}

// 改变对比周期
const changeComparePeriod = (period: string) => {
  comparePeriod.value = period
  updateCompareData()
}

// 刷新科室排名
const refreshDepartmentRanking = () => {
  initDepartmentRankingChart()
  ElMessage.success('科室排名已刷新')
}

// 格式化数字
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

// 计算百分比
const getPercent = (value: number, total: number) => {
  return ((value / total) * 100).toFixed(1)
}

// 获取增长额样式
const getGrowthClass = (value: number) => {
  return value >= 0 ? 'growth-positive' : 'growth-negative'
}

// 获取增长率类型
const getGrowthType = (value: number) => {
  if (value > 0) return 'success'
  if (value < 0) return 'danger'
  return 'info'
}

// 查看详情
const viewDetail = (row: any) => {
  ElMessage.info(`查看 ${row.date} 的详细收入数据`)
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

// 更新对比数据
const updateCompareData = () => {
  // 模拟数据更新
  ElMessage.success('对比数据已更新')
}

// 表格汇总
const getSummaries = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []

  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }

    if (index >= 1 && index <= 8) {
      const values = data.map((item: any) => Number(item[column.property]))
      if (!values.every((value: any) => isNaN(value))) {
        sums[index] = `¥${formatNumber(values.reduce((prev: number, curr: number) => prev + curr, 0))}`
      } else {
        sums[index] = '-'
      }
    } else if (index === 9) {
      const values = data.map((item: any) => Number(item[column.property]))
      if (!values.every((value: any) => isNaN(value))) {
        sums[index] = `${values.reduce((prev: number, curr: number) => prev + curr, 0)}`
      } else {
        sums[index] = '-'
      }
    } else {
      sums[index] = '-'
    }
  })

  return sums
}

// 初始化收入趋势图
const initRevenueTrendChart = () => {
  if (!revenueTrendChartRef.value) return

  revenueTrendChart = echarts.init(revenueTrendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params: any) {
        let result = params[0].axisValue + '<br/>'
        params.forEach((param: any) => {
          result += `${param.seriesName}: ¥${param.value.toLocaleString()}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['总收入', '门诊收入', '住院收入', '药品收入']
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
    series: [
      {
        name: '总收入',
        type: 'line',
        data: generateRandomData(30, 800000, 1200000),
        smooth: true,
        itemStyle: { color: '#409eff' },
        lineStyle: { width: 3 }
      },
      {
        name: '门诊收入',
        type: 'line',
        data: generateRandomData(30, 250000, 400000),
        smooth: true,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '住院收入',
        type: 'line',
        data: generateRandomData(30, 200000, 350000),
        smooth: true,
        itemStyle: { color: '#e6a23c' }
      },
      {
        name: '药品收入',
        type: 'line',
        data: generateRandomData(30, 100000, 200000),
        smooth: true,
        itemStyle: { color: '#f56c6c' }
      }
    ]
  }

  revenueTrendChart.setOption(option)
}

// 初始化收入构成图
const initRevenueCompositionChart = () => {
  if (!revenueCompositionChartRef.value) return

  revenueCompositionChart = echarts.init(revenueCompositionChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '收入构成',
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 2845680, name: '门诊收入' },
        { value: 2456780, name: '住院收入' },
        { value: 1289450, name: '药品收入' },
        { value: 656780, name: '检查收入' },
        { value: 894560, name: '手术收入' }
      ]
    }]
  }

  revenueCompositionChart.setOption(option)
}

// 初始化科室排名图
const initDepartmentRankingChart = () => {
  if (!departmentRankingChartRef.value) return

  departmentRankingChart = echarts.init(departmentRankingChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}<br/>收入: ¥{c}'
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    yAxis: {
      type: 'category',
      data: ['心内科', '外科', '内科', '骨科', '妇产科', '儿科', '神经科'].reverse()
    },
    series: [{
      name: '收入',
      type: 'bar',
      data: generateRandomData(7, 500000, 1500000).reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      }
    }]
  }

  departmentRankingChart.setOption(option)
}

// 初始化收费项目图
const initChargeItemChart = () => {
  if (!chargeItemChartRef.value) return

  chargeItemChart = echarts.init(chargeItemChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: ¥{c} ({d}%)'
    },
    series: [{
      name: '收费项目',
      type: 'pie',
      radius: '70%',
      data: [
        { value: 1845680, name: '药品费' },
        { value: 1256780, name: '检查费' },
        { value: 984560, name: '治疗费' },
        { value: 856780, name: '手术费' },
        { value: 654320, name: '材料费' },
        { value: 248600, name: '其他费用' }
      ]
    }]
  }

  chargeItemChart.setOption(option)
}

// 更新收入趋势图
const updateRevenueTrendChart = () => {
  if (!revenueTrendChart) return

  const days = parseInt(chartPeriod.value)
  const option = {
    xAxis: {
      data: generateDateLabels(days)
    },
    series: [
      {
        data: generateRandomData(days, 800000, 1200000)
      },
      {
        data: generateRandomData(days, 250000, 400000)
      },
      {
        data: generateRandomData(days, 200000, 350000)
      },
      {
        data: generateRandomData(days, 100000, 200000)
      }
    ]
  }

  revenueTrendChart.setOption(option)
}

// 更新所有图表
const updateCharts = () => {
  updateRevenueTrendChart()
  initRevenueCompositionChart()
  initDepartmentRankingChart()
  initChargeItemChart()
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
  revenueTrendChart?.resize()
  revenueCompositionChart?.resize()
  departmentRankingChart?.resize()
  chargeItemChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initRevenueTrendChart()
    initRevenueCompositionChart()
    initDepartmentRankingChart()
    initChargeItemChart()
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
    revenueTrendChart?.dispose()
    revenueCompositionChart?.dispose()
    departmentRankingChart?.dispose()
    chargeItemChart?.dispose()
  })
})
</script>

<style scoped>
.revenue-report-container {
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

.revenue-overview {
  margin-bottom: 20px;
}

.revenue-card {
  position: relative;
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.revenue-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.revenue-card.outpatient {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.revenue-card.inpatient {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.revenue-card.medicine {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.revenue-content {
  display: flex;
  align-items: center;
  padding: 20px;
  color: white;
}

.revenue-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 28px;
}

.revenue-info {
  flex: 1;
}

.revenue-title {
  font-size: 16px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.revenue-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
}

.revenue-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.9;
}

.revenue-percent {
  font-size: 14px;
  opacity: 0.9;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-container-large {
  height: 350px;
  width: 100%;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.total-revenue {
  font-weight: bold;
  color: #409eff;
}

.growth-positive {
  color: #67c23a;
}

.growth-negative {
  color: #f56c6c;
}

:deep(.el-card__header) {
  font-weight: bold;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-table__footer-wrapper td) {
  font-weight: bold;
  background-color: #f5f7fa;
}
</style>