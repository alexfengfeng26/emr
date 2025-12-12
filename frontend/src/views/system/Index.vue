<template>
  <div class="system-index">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>系统管理</h1>
        <p class="description">管理系统配置、用户权限和运行状态</p>
      </div>
    </div>

    <!-- 系统概览 -->
    <div class="overview-section">
      <h2 class="section-title">系统概览</h2>
      <div class="overview-cards">
        <el-card shadow="hover" class="overview-card">
          <div class="card-content">
            <div class="card-icon users">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ statistics.users }}</div>
              <div class="card-label">系统用户</div>
              <div class="card-trend positive">
                <el-icon><TrendCharts /></el-icon>
                +{{ statistics.userGrowth }}%
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="overview-card">
          <div class="card-content">
            <div class="card-icon roles">
              <el-icon><User /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ statistics.roles }}</div>
              <div class="card-label">角色权限</div>
              <div class="card-trend neutral">
                <el-icon><Minus /></el-icon>
                稳定
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="overview-card">
          <div class="card-content">
            <div class="card-icon departments">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ statistics.departments }}</div>
              <div class="card-label">科室部门</div>
              <div class="card-trend positive">
                <el-icon><TrendCharts /></el-icon>
                +{{ statistics.departmentGrowth }}%
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="overview-card">
          <div class="card-content">
            <div class="card-icon settings">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ statistics.settings }}</div>
              <div class="card-label">系统设置</div>
              <div class="card-trend neutral">
                <el-icon><Minus /></el-icon>
                正常
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="overview-card">
          <div class="card-content">
            <div class="card-icon logs">
              <el-icon><Document /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ statistics.todayLogs }}</div>
              <div class="card-label">今日日志</div>
              <div class="card-trend positive">
                <el-icon><TrendCharts /></el-icon>
                活跃
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="overview-card">
          <div class="card-content">
            <div class="card-icon status">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-value">{{ statistics.systemStatus }}</div>
              <div class="card-label">系统状态</div>
              <div class="card-trend positive">
                <el-icon><CircleCheck /></el-icon>
                正常
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions-section">
      <h2 class="section-title">快捷操作</h2>
      <div class="quick-actions">
        <el-card
          v-for="action in quickActions"
          :key="action.key"
          shadow="hover"
          class="action-card"
          @click="handleQuickAction(action)"
        >
          <div class="action-content">
            <div class="action-icon" :class="action.iconClass">
              <el-icon><component :is="action.icon" /></el-icon>
            </div>
            <div class="action-info">
              <div class="action-title">{{ action.title }}</div>
              <div class="action-desc">{{ action.description }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities-section">
      <h2 class="section-title">最近活动</h2>
      <el-card shadow="never" class="activities-card">
        <div v-if="recentActivities.length === 0" class="empty-state">
          <el-empty description="暂无最近活动" />
        </div>
        <div v-else class="activities-list">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-avatar">
              <el-avatar :size="40" :src="activity.user.avatar">
                {{ activity.user.realName?.charAt(0) }}
              </el-avatar>
            </div>
            <div class="activity-content">
              <div class="activity-header">
                <span class="activity-user">{{ activity.user.realName }}</span>
                <span class="activity-action">{{ activity.action }}</span>
                <el-tag
                  :type="getOperationResultColor(activity.result)"
                  size="small"
                >
                  {{ OPERATION_RESULT_LABELS[activity.result] }}
                </el-tag>
              </div>
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-time">{{ formatRelativeTime(activity.createdAt) }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 系统状态 -->
    <div class="system-status-section">
      <h2 class="section-title">系统状态</h2>
      <div class="status-cards">
        <el-card shadow="never" class="status-card">
          <div class="status-header">
            <div class="status-title">
              <el-icon class="status-icon"><Monitor /></el-icon>
              系统性能
            </div>
          </div>
          <div class="status-content">
            <div class="status-item">
              <span class="status-label">CPU使用率</span>
              <el-progress
                :percentage="systemStatus.cpuUsage"
                :color="getProgressColor(systemStatus.cpuUsage)"
                :stroke-width="8"
              />
            </div>
            <div class="status-item">
              <span class="status-label">内存使用率</span>
              <el-progress
                :percentage="systemStatus.memoryUsage"
                :color="getProgressColor(systemStatus.memoryUsage)"
                :stroke-width="8"
              />
            </div>
            <div class="status-item">
              <span class="status-label">磁盘使用率</span>
              <el-progress
                :percentage="systemStatus.diskUsage"
                :color="getProgressColor(systemStatus.diskUsage)"
                :stroke-width="8"
              />
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="status-card">
          <div class="status-header">
            <div class="status-title">
              <el-icon class="status-icon"><Connection /></el-icon>
              服务状态
            </div>
          </div>
          <div class="status-content">
            <div v-for="service in systemStatus.services" :key="service.name" class="service-item">
              <div class="service-info">
                <span class="service-name">{{ service.name }}</span>
                <el-tag
                  :type="service.status === 'running' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ service.status === 'running' ? '运行中' : '已停止' }}
                </el-tag>
              </div>
              <div class="service-metrics">
                <span class="service-uptime">运行时间: {{ service.uptime }}</span>
                <span class="service-connections">连接数: {{ service.connections }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="status-card">
          <div class="status-header">
            <div class="status-title">
              <el-icon class="status-icon"><DataBoard /></el-icon>
              数据统计
            </div>
          </div>
          <div class="status-content">
            <div class="data-stats">
              <div class="data-item">
                <span class="data-label">今日就诊</span>
                <span class="data-value">{{ dataStats.todayPatients }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">今日医嘱</span>
                <span class="data-value">{{ dataStats.todayOrders }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">今日检查</span>
                <span class="data-value">{{ dataStats.todayExaminations }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">今日处方</span>
                <span class="data-value">{{ dataStats.todayPrescriptions }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  UserFilled,
  User,
  OfficeBuilding,
  Setting,
  Document,
  CircleCheck,
  TrendCharts,
  Minus,
  Plus,
  Monitor,
  Connection,
  DataBoard,
  Key,
  Tools,
  Lock,
  View
} from '@element-plus/icons-vue'
import { systemApi } from '@/api/system'
import {
  OPERATION_RESULT_LABELS,
  getOperationResultColor
} from '@/types/system'
import { formatDate, getRelativeTime } from '@/utils/date'

const router = useRouter()

// 响应式数据
const statistics = reactive({
  users: 0,
  roles: 0,
  departments: 0,
  settings: 0,
  todayLogs: 0,
  userGrowth: 0,
  departmentGrowth: 0,
  systemStatus: '正常'
})

const recentActivities = ref<any[]>([])

const systemStatus = reactive({
  cpuUsage: 45,
  memoryUsage: 68,
  diskUsage: 32,
  services: [
    {
      name: 'Web服务',
      status: 'running',
      uptime: '7天12小时',
      connections: 156
    },
    {
      name: '数据库',
      status: 'running',
      uptime: '15天8小时',
      connections: 89
    },
    {
      name: 'Redis缓存',
      status: 'running',
      uptime: '7天12小时',
      connections: 23
    },
    {
      name: '文件服务',
      status: 'running',
      uptime: '7天12小时',
      connections: 12
    }
  ]
})

const dataStats = reactive({
  todayPatients: 0,
  todayOrders: 0,
  todayExaminations: 0,
  todayPrescriptions: 0
})

// 快捷操作配置
const quickActions = [
  {
    key: 'user',
    title: '新增用户',
    description: '创建新的系统用户',
    icon: 'Plus',
    iconClass: 'icon-primary',
    route: '/system/users/create'
  },
  {
    key: 'role',
    title: '角色管理',
    description: '管理用户角色和权限',
    icon: 'Key',
    iconClass: 'icon-warning',
    route: '/system/roles'
  },
  {
    key: 'department',
    title: '科室管理',
    description: '管理医院科室结构',
    icon: 'OfficeBuilding',
    iconClass: 'icon-info',
    route: '/system/departments'
  },
  {
    key: 'settings',
    title: '系统设置',
    description: '配置系统参数',
    icon: 'Tools',
    iconClass: 'icon-success',
    route: '/system/settings'
  },
  {
    key: 'logs',
    title: '操作日志',
    description: '查看系统操作记录',
    icon: 'View',
    iconClass: 'icon-default',
    route: '/system/logs'
  },
  {
    key: 'permissions',
    title: '权限分配',
    description: '管理用户权限分配',
    icon: 'Lock',
    iconClass: 'icon-danger',
    route: '/system/roles'
  }
]

// 获取统计数据
const fetchStatistics = async () => {
  try {
    // 模拟获取统计数据，实际应该从API获取
    statistics.users = 156
    statistics.roles = 12
    statistics.departments = 28
    statistics.settings = 45
    statistics.todayLogs = 1234
    statistics.userGrowth = 8.5
    statistics.departmentGrowth = 3.2

    dataStats.todayPatients = 89
    dataStats.todayOrders = 234
    dataStats.todayExaminations = 67
    dataStats.todayPrescriptions = 156
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取最近活动
const fetchRecentActivities = async () => {
  try {
    // 模拟获取最近活动数据，实际应该从API获取
    recentActivities.value = [
      {
        id: 1,
        user: { realName: '张医生', avatar: '' },
        action: '创建了新用户',
        description: '创建用户 "李护士"',
        result: 'SUCCESS',
        createdAt: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: 2,
        user: { realName: '王主任', avatar: '' },
        action: '修改了系统设置',
        description: '更新系统配置 "就诊流程"',
        result: 'SUCCESS',
        createdAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        id: 3,
        user: { realName: '刘管理员', avatar: '' },
        action: '删除了角色',
        description: '删除角色 "测试角色"',
        result: 'SUCCESS',
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 4,
        user: { realName: '陈医生', avatar: '' },
        action: '登录系统',
        description: '用户登录',
        result: 'SUCCESS',
        createdAt: new Date(Date.now() - 45 * 60 * 1000)
      }
    ]
  } catch (error) {
    console.error('获取最近活动失败:', error)
  }
}

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 格式化相对时间
const formatRelativeTime = (date: Date) => {
  return getRelativeTime(date)
}

// 处理快捷操作
const handleQuickAction = (action: any) => {
  router.push(action.route)
}

// 初始化
onMounted(() => {
  fetchStatistics()
  fetchRecentActivities()
})
</script>

<style scoped>
.system-index {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.description {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.section-title {
  margin: 30px 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background-color: #409eff;
  border-radius: 2px;
}

.overview-section {
  margin-bottom: 40px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.overview-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 24px;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 28px;
  color: white;
}

.card-icon.users {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.card-icon.roles {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.card-icon.departments {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.card-icon.settings {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.card-icon.logs {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.card-icon.status {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 8px;
}

.card-trend.positive {
  color: #67c23a;
}

.card-trend.negative {
  color: #f56c6c;
}

.card-trend.neutral {
  color: #909399;
}

.quick-actions-section {
  margin-bottom: 40px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.action-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.action-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.action-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.action-icon.icon-primary {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.action-icon.icon-success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.action-icon.icon-warning {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.action-icon.icon-danger {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.action-icon.icon-info {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.action-icon.icon-default {
  background: linear-gradient(135deg, #606266, #79838b);
}

.action-info {
  flex: 1;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 14px;
  color: #909399;
}

.recent-activities-section {
  margin-bottom: 40px;
}

.activities-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.activities-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.activity-user {
  font-weight: 500;
  color: #303133;
}

.activity-action {
  color: #606266;
}

.activity-description {
  color: #606266;
  font-size: 14px;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #c0c4cc;
}

.system-status-section {
  margin-bottom: 40px;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.status-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.status-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.status-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.status-icon {
  color: #409eff;
}

.status-content {
  padding: 20px;
}

.status-item {
  margin-bottom: 16px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.service-item {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.service-item:last-child {
  margin-bottom: 0;
}

.service-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.service-name {
  font-weight: 500;
  color: #303133;
}

.service-metrics {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.data-label {
  color: #606266;
  font-size: 14px;
}

.data-value {
  font-weight: 600;
  color: #409eff;
  font-size: 18px;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

/* 自定义滚动条 */
.activities-list::-webkit-scrollbar {
  width: 6px;
}

.activities-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.activities-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.activities-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

:deep(.el-card__body) {
  padding: 0;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f0f0;
}
</style>