<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <!-- 统计卡片 -->
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="24" color="white">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stat.value }}</h3>
              <p>{{ stat.title }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 待办事项 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>待办事项</h3>
              <el-button type="text" @click="refreshTodos">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </template>

          <el-table :data="todos" stripe>
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="patient" label="患者" width="120" />
            <el-table-column prop="time" label="时间" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getTodoStatusType(row.status)">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 最近患者 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>最近患者</h3>
              <el-button type="text" @click="$router.push('/patients')">
                查看全部
              </el-button>
            </div>
          </template>

          <el-table :data="recentPatients" stripe>
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="gender" label="性别" width="80" />
            <el-table-column prop="age" label="年龄" width="80" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  type="text"
                  size="small"
                  @click="viewPatient(row.id)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { User, Document, FirstAidKit, Monitor } from '@element-plus/icons-vue'

const router = useRouter()

// 统计数据
const stats = ref([
  {
    title: '今日患者',
    value: 42,
    icon: User,
    color: '#409eff'
  },
  {
    title: '待处理病历',
    value: 18,
    icon: Document,
    color: '#67c23a'
  },
  {
    title: '待执行医嘱',
    value: 23,
    icon: FirstAidKit,
    color: '#e6a23c'
  },
  {
    title: '检查报告',
    value: 8,
    icon: Monitor,
    color: '#f56c6c'
  }
])

// 待办事项
const todos = ref([
  {
    id: 1,
    title: '完成张三的病历记录',
    patient: '张三',
    time: '2024-01-10 14:30',
    status: '待处理'
  },
  {
    id: 2,
    title: '审核李四的检查报告',
    patient: '李四',
    time: '2024-01-10 15:00',
    status: '处理中'
  },
  {
    id: 3,
    title: '王五复查提醒',
    patient: '王五',
    time: '2024-01-10 16:00',
    status: '待处理'
  }
])

// 最近患者
const recentPatients = ref([
  {
    id: 1,
    name: '张三',
    gender: '男',
    age: 45,
    phone: '13800138000'
  },
  {
    id: 2,
    name: '李四',
    gender: '女',
    age: 32,
    phone: '13900139000'
  },
  {
    id: 3,
    name: '王五',
    gender: '男',
    age: 28,
    phone: '13700137000'
  }
])

// 获取待办事项状态类型
const getTodoStatusType = (status: string) => {
  switch (status) {
    case '待处理':
      return 'warning'
    case '处理中':
      return 'primary'
    case '已完成':
      return 'success'
    default:
      return 'info'
  }
}

// 刷新待办事项
const refreshTodos = () => {
  // TODO: 调用API获取最新待办事项
  console.log('刷新待办事项')
}

// 查看患者详情
const viewPatient = (patientId: number) => {
  router.push(`/patients/${patientId}`)
}

onMounted(() => {
  // TODO: 获取统计数据
  console.log('Dashboard mounted')
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-info p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #fafafa;
}
</style>