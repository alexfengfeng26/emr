<template>
  <div class="settings-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>系统设置</h1>
        <p class="description">管理系统配置和运行参数</p>
      </div>
      <div class="header-right">
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入设置
        </el-button>
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出设置
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增设置
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon primary">
            <el-icon><Setting /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.total }}</div>
            <div class="stat-label">总设置数</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon success">
            <el-icon><Unlock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.editable }}</div>
            <div class="stat-label">可编辑设置</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon warning">
            <el-icon><View /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.public }}</div>
            <div class="stat-label">公开设置</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon info">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.categories }}</div>
            <div class="stat-label">设置分类</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索和筛选 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索设置键名或描述"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="queryParams.category"
            placeholder="全部分类"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="category in categories"
              :key="category.key"
              :label="category.name"
              :value="category.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="(label, value) in SETTING_TYPE_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-checkbox v-model="queryParams.isPublic">公开</el-checkbox>
          <el-checkbox v-model="queryParams.isEditable">可编辑</el-checkbox>
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

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <div class="table-header">
        <div class="header-left">
          <span class="title">设置列表</span>
          <span class="count">共 {{ pagination.total }} 条记录</span>
        </div>
        <div class="header-right" v-if="selectedSettings.length > 0">
          <el-button type="danger" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon>
            批量删除 ({{ selectedSettings.length }})
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="settings"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="key" label="设置键" width="200" fixed="left">
          <template #default="{ row }">
            <div class="setting-key">
              <el-link type="primary" @click="handleCopyKey(row.key)">
                {{ row.key }}
              </el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="value" label="当前值" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="setting-value">
              <span v-if="row.type === 'BOOLEAN'">
                <el-tag :type="row.value === 'true' ? 'success' : 'danger'" size="small">
                  {{ row.value === 'true' ? '是' : '否' }}
                </el-tag>
              </span>
              <span v-else-if="row.type === 'JSON'" class="json-value">
                {{ formatJsonValue(row.value) }}
              </span>
              <span v-else>{{ row.value }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="值类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">
              {{ SETTING_TYPE_LABELS[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isPublic" label="公开" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.isPublic" color="#67c23a"><View /></el-icon>
            <el-icon v-else color="#c0c4cc"><Hide /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="isEditable" label="可编辑" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.isEditable" color="#67c23a"><Edit /></el-icon>
            <el-icon v-else color="#c0c4cc"><Lock /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleEdit(row)"
              :disabled="!row.isEditable"
            >
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button type="primary" link>
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy">
                    <el-icon><CopyDocument /></el-icon>
                    复制键名
                  </el-dropdown-item>
                  <el-dropdown-item command="history">
                    <el-icon><Clock /></el-icon>
                    修改历史
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    :disabled="!row.isEditable"
                    divided
                  >
                    <el-icon><Delete /></el-icon>
                    删除设置
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 设置表单弹窗 -->
    <SettingForm
      v-model:visible="formDialogVisible"
      :setting="currentSetting"
      @success="handleFormSuccess"
    />

    <!-- 导入设置弹窗 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入设置"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="import-content">
        <el-alert
          title="导入说明"
          type="info"
          description="请选择JSON格式的设置文件进行导入。导入的设置将覆盖同名的现有设置。"
          show-icon
          :closable="false"
        />
        <el-upload
          ref="uploadRef"
          class="upload-setting"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :accept="'.json'"
          :limit="1"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          :before-upload="beforeImportUpload"
          :auto-upload="false"
          drag
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 JSON 格式文件，且不超过 10MB
            </div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :loading="importing">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  Delete,
  Download,
  Upload,
  Edit,
  Lock,
  View,
  Hide,
  CopyDocument,
  ArrowDown,
  Clock,
  Setting,
  Unlock,
  Folder,
  UploadFilled
} from '@element-plus/icons-vue'
import { systemApi } from '@/api/system'
import type { SystemSetting, SettingQuery, SettingCategory } from '@/types/system'
import {
  SETTING_TYPE_LABELS
} from '@/types/system'
import SettingForm from './Form.vue'

// 响应式数据
const loading = ref(false)
const settings = ref<SystemSetting[]>([])
const selectedSettings = ref<SystemSetting[]>([])
const categories = ref<SettingCategory[]>([])
const statistics = reactive({
  total: 0,
  editable: 0,
  public: 0,
  categories: 0
})

// 查询参数
const queryParams = reactive<SettingQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  category: '',
  type: '',
  isPublic: undefined,
  isEditable: undefined,
  sortBy: 'sort',
  sortOrder: 'asc'
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 弹窗状态
const formDialogVisible = ref(false)
const importDialogVisible = ref(false)
const currentSetting = ref<SystemSetting | null>(null)

// 导入相关
const uploadRef = ref()
const importing = ref(false)
const uploadUrl = `${import.meta.env.VITE_API_URL || '/api'}/system/settings/import`
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 计算属性
const editableCount = computed(() =>
  settings.value.filter(setting => setting.isEditable).length
)

const publicCount = computed(() =>
  settings.value.filter(setting => setting.isPublic).length
)

// 获取设置列表
const fetchSettings = async () => {
  loading.value = true
  try {
    const response = await systemApi.getSettings(queryParams)
    settings.value = response.items
    pagination.total = response.total
    pagination.page = response.page
    pagination.pageSize = response.pageSize

    // 更新统计数据
    statistics.total = response.total
    statistics.editable = editableCount.value
    statistics.public = publicCount.value
    statistics.categories = categories.value.length
  } catch (error) {
    console.error('获取设置列表失败:', error)
    ElMessage.error('获取设置列表失败')
  } finally {
    loading.value = false
  }
}

// 获取设置分类
const fetchCategories = async () => {
  try {
    const response = await systemApi.getSettingCategories()
    categories.value = response.data
  } catch (error) {
    console.error('获取设置分类失败:', error)
  }
}

// 格式化JSON值
const formatJsonValue = (value: string) => {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  pagination.page = 1
  fetchSettings()
}

// 重置搜索
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.category = ''
  queryParams.type = ''
  queryParams.isPublic = undefined
  queryParams.isEditable = undefined
  handleSearch()
}

// 分页处理
const handlePageChange = (page: number) => {
  queryParams.page = page
  pagination.page = page
  fetchSettings()
}

const handlePageSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  pagination.pageSize = pageSize
  queryParams.page = 1
  pagination.page = 1
  fetchSettings()
}

// 选择处理
const handleSelectionChange = (selection: SystemSetting[]) => {
  selectedSettings.value = selection
}

// 新增设置
const handleAdd = () => {
  currentSetting.value = null
  formDialogVisible.value = true
}

// 编辑设置
const handleEdit = (setting: SystemSetting) => {
  currentSetting.value = setting
  formDialogVisible.value = true
}

// 复制键名
const handleCopyKey = async (key: string) => {
  try {
    await navigator.clipboard.writeText(key)
    ElMessage.success('键名已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 导出设置
const handleExport = async () => {
  try {
    const response = await systemApi.exportSettings(queryParams.category)

    // 创建下载链接
    const blob = new Blob([response], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `system-settings-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('设置导出成功')
  } catch (error) {
    console.error('导出设置失败:', error)
    ElMessage.error('导出设置失败')
  }
}

// 导入设置
const handleImport = () => {
  importDialogVisible.value = true
}

// 导入前验证
const beforeImportUpload = (file: File) => {
  const isJSON = file.type === 'application/json' || file.name.endsWith('.json')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isJSON) {
    ElMessage.error('只能上传 JSON 格式文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  return true
}

// 提交导入
const handleImportSubmit = () => {
  if (!uploadRef.value) return

  uploadRef.value.submit()
}

// 导入成功
const handleImportSuccess = (response: any) => {
  ElMessage.success('设置导入成功')
  importDialogVisible.value = false
  fetchSettings()
}

// 导入失败
const handleImportError = () => {
  ElMessage.error('设置导入失败')
}

// 删除设置
const handleDelete = async (setting: SystemSetting) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除设置 "${setting.key}" 吗？此操作不可恢复。`,
      '删除设置',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await systemApi.deleteSetting(setting.key)
    ElMessage.success('设置删除成功')
    fetchSettings()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除设置失败:', error)
      ElMessage.error('删除设置失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedSettings.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedSettings.value.length} 个设置吗？此操作不可恢复。`,
      '批量删除设置',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        confirmButtonClass: 'el-button--danger'
      }
    )

    const deletePromises = selectedSettings.value
      .filter(setting => setting.isEditable)
      .map(setting => systemApi.deleteSetting(setting.key))

    await Promise.all(deletePromises)
    ElMessage.success(`成功删除 ${deletePromises.length} 个设置`)
    fetchSettings()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除设置失败:', error)
      ElMessage.error('批量删除设置失败')
    }
  }
}

// 命令处理
const handleCommand = (command: string, setting: SystemSetting) => {
  switch (command) {
    case 'copy':
      handleCopyKey(setting.key)
      break
    case 'history':
      ElMessage.info('修改历史功能开发中')
      break
    case 'delete':
      handleDelete(setting)
      break
  }
}

// 表单成功处理
const handleFormSuccess = () => {
  fetchSettings()
}

// 初始化
onMounted(() => {
  fetchCategories()
  fetchSettings()
})
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
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

.stat-icon.primary {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stat-icon.info {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.search-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.search-form {
  margin: 0;
}

.table-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left .title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-left .count {
  color: #909399;
  font-size: 14px;
  margin-left: 8px;
}

.setting-key {
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.setting-value {
  word-break: break-all;
}

.json-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.import-content {
  text-align: center;
}

.upload-setting {
  margin-top: 20px;
}

:deep(.el-table .el-table__row:hover > td) {
  background-color: #f5f7fa !important;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

:deep(.el-upload-dragger .el-icon--upload) {
  font-size: 48px;
  color: #c0c4cc;
  margin: 40px 0 16px;
}

:deep(.el-upload__tip) {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

:deep(.el-alert) {
  margin-bottom: 16px;
}
</style>