<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑设置' : '新增设置'"
    width="700px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="setting-form"
    >
      <el-form-item label="设置键" prop="key">
        <el-input
          v-model="formData.key"
          placeholder="请输入设置键，如：system.name"
          :disabled="isEdit"
        >
          <template #append>
            <el-button @click="handleGenerateKey">生成</el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="值类型" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="请选择值类型"
          :disabled="isEdit"
          style="width: 100%"
          @change="handleTypeChange"
        >
          <el-option
            v-for="(label, value) in SETTING_TYPE_LABELS"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="设置值" prop="value">
        <!-- 字符串类型 -->
        <el-input
          v-if="formData.type === 'STRING'"
          v-model="formData.value"
          placeholder="请输入字符串值"
        />
        <!-- 数字类型 -->
        <el-input-number
          v-else-if="formData.type === 'NUMBER'"
          v-model="numericValue"
          :precision="2"
          :step="1"
          style="width: 100%"
        />
        <!-- 布尔类型 -->
        <el-radio-group v-else-if="formData.type === 'BOOLEAN'" v-model="formData.value">
          <el-radio label="true">是</el-radio>
          <el-radio label="false">否</el-radio>
        </el-radio-group>
        <!-- JSON类型 -->
        <el-input
          v-else-if="formData.type === 'JSON'"
          v-model="formData.value"
          type="textarea"
          :rows="6"
          placeholder='请输入JSON格式值，如：{"key": "value"}'
        />
        <!-- 文本类型 -->
        <el-input
          v-else-if="formData.type === 'TEXT'"
          v-model="formData.value"
          type="textarea"
          :rows="4"
          placeholder="请输入文本值"
        />
      </el-form-item>

      <el-form-item label="设置描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="2"
          placeholder="请输入设置描述"
        />
      </el-form-item>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="设置分类" prop="category">
            <el-select
              v-model="formData.category"
              placeholder="请选择设置分类"
              style="width: 100%"
              allow-create
              filterable
            >
              <el-option
                v-for="category in categories"
                :key="category.key"
                :label="category.name"
                :value="category.key"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number
              v-model="formData.sort"
              :min="0"
              :max="9999"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="验证规则" prop="validation">
        <el-input
          v-model="formData.validation"
          placeholder="请输入验证规则，如：required,email,url"
        />
      </el-form-item>

      <el-form-item label="访问控制">
        <el-checkbox v-model="formData.isPublic">
          公开设置（前端可访问）
        </el-checkbox>
        <el-checkbox v-model="formData.isEditable">
          可编辑设置
        </el-checkbox>
      </el-form-item>

      <!-- JSON值预览 -->
      <el-form-item v-if="formData.type === 'JSON' && formData.value" label="JSON预览">
        <div class="json-preview">
          <pre>{{ formatJsonPreview(formData.value) }}</pre>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        {{ isEdit ? '更新' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { SystemSetting, SettingCreateForm, SettingUpdateForm, SettingCategory } from '@/types/system'
import { systemApi } from '@/api/system'
import { SETTING_TYPE_LABELS } from '@/types/system'

interface Props {
  visible: boolean
  setting?: SystemSetting | null
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const formRef = ref()
const submitting = ref(false)
const categories = ref<SettingCategory[]>([])

// 是否为编辑模式
const isEdit = computed(() => !!props.setting)

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (visible) => emit('update:visible', visible)
})

// 表单数据
const formData = reactive<SettingCreateForm & { key?: string }>({
  key: '',
  value: '',
  description: '',
  type: 'STRING',
  category: '',
  isPublic: false,
  isEditable: true,
  validation: '',
  sort: 0
})

// 数值类型的值（用于双向绑定）
const numericValue = computed({
  get: () => formData.type === 'NUMBER' ? Number(formData.value) || 0 : 0,
  set: (value: number) => {
    if (formData.type === 'NUMBER') {
      formData.value = value.toString()
    }
  }
})

// 表单验证规则
const formRules = {
  key: [
    { required: true, message: '请输入设置键', trigger: 'blur' },
    { min: 2, max: 100, message: '设置键长度在 2 到 100 个字符', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/, message: '设置键格式：模块名.键名，如：system.name', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择值类型', trigger: 'change' }
  ],
  value: [
    { required: true, message: '请输入设置值', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (formData.type === 'JSON' && value) {
          try {
            JSON.parse(value)
            callback()
          } catch (error) {
            callback(new Error('JSON格式不正确'))
          }
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  category: [
    { required: true, message: '请选择设置分类', trigger: 'change' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' },
    { type: 'number', min: 0, max: 9999, message: '排序值范围 0-9999', trigger: 'blur' }
  ]
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

// 生成设置键
const handleGenerateKey = () => {
  const module = formData.category || 'custom'
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  formData.key = `${module}.${timestamp}${random}`
}

// 类型变化处理
const handleTypeChange = (type: string) => {
  // 重置值为默认值
  switch (type) {
    case 'STRING':
      formData.value = ''
      break
    case 'NUMBER':
      formData.value = '0'
      break
    case 'BOOLEAN':
      formData.value = 'false'
      break
    case 'JSON':
      formData.value = '{}'
      break
    case 'TEXT':
      formData.value = ''
      break
  }
}

// 格式化JSON预览
const formatJsonPreview = (value: string) => {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value
  }
}

// 填充表单数据
const fillFormData = () => {
  if (props.setting) {
    Object.assign(formData, {
      key: props.setting.key,
      value: props.setting.value,
      description: props.setting.description || '',
      type: props.setting.type,
      category: props.setting.category,
      isPublic: props.setting.isPublic,
      isEditable: props.setting.isEditable,
      validation: props.setting.validation || '',
      sort: props.setting.sort
    })
  } else {
    Object.assign(formData, {
      key: '',
      value: '',
      description: '',
      type: 'STRING',
      category: '',
      isPublic: false,
      isEditable: true,
      validation: '',
      sort: 0
    })
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    key: '',
    value: '',
    description: '',
    type: 'STRING',
    category: '',
    isPublic: false,
    isEditable: true,
    validation: '',
    sort: 0
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const submitData = { ...formData }
    delete submitData.key // 编辑时不包含key

    if (isEdit.value) {
      await systemApi.updateSetting(props.setting!.key, submitData)
      ElMessage.success('设置更新成功')
    } else {
      await systemApi.createSetting(formData as SettingCreateForm)
      ElMessage.success('设置创建成功')
    }

    emit('success')
    dialogVisible.value = false
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = () => {
  dialogVisible.value = false
}

// 弹窗关闭处理
const handleClosed = () => {
  resetForm()
}

// 监听设置变化
watch(() => props.setting, () => {
  if (props.visible) {
    fillFormData()
  }
}, { immediate: true })

// 监听弹窗显示状态
watch(() => props.visible, (visible) => {
  if (visible) {
    fetchCategories()
    fillFormData()
  }
})

// 初始化
onMounted(() => {
  if (props.visible) {
    fetchCategories()
    fillFormData()
  }
})
</script>

<style scoped>
.setting-form {
  max-width: 100%;
}

.json-preview {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #f8f9fa;
}

.json-preview pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
}

:deep(.el-form-item__content) {
  flex-wrap: wrap;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-input-group__append .el-button) {
  border: none;
  background-color: #f5f7fa;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-dialog__body) {
  padding: 20px 24px;
}

:deep(.el-card__body) {
  padding: 16px;
}

/* 自定义滚动条 */
.json-preview::-webkit-scrollbar {
  width: 6px;
}

.json-preview::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.json-preview::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.json-preview::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>