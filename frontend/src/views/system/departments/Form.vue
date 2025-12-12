<template>
  <el-dialog
    v-model="dialogVisible"
    :title="getDialogTitle"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="department-form"
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="科室名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入科室名称"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="科室代码" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入科室代码"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="科室类型" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="请选择科室类型"
          style="width: 100%"
        >
          <el-option
            v-for="(label, value) in DEPARTMENT_TYPE_LABELS"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="上级科室" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="departmentTree"
          :props="{ label: 'name', value: 'id', children: 'children' }"
          placeholder="请选择上级科室（可选）"
          clearable
          check-strictly
          :render-after-expand="false"
          :disabled="!!parentDepartment"
          style="width: 100%"
        />
      </el-form-item>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="负责人" prop="leaderId">
            <el-select
              v-model="formData.leaderId"
              placeholder="请选择负责人"
              clearable
              filterable
              remote
              :remote-method="searchUsers"
              :loading="userSearchLoading"
              style="width: 100%"
            >
              <el-option
                v-for="user in userOptions"
                :key="user.id"
                :label="`${user.realName} (${user.username})`"
                :value="user.id"
              >
                <div class="user-option">
                  <div class="user-name">{{ user.realName }}</div>
                  <div class="user-info">
                    <span class="user-username">{{ user.username }}</span>
                    <span class="user-position">{{ user.position }}</span>
                  </div>
                </div>
              </el-option>
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

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="联系电话" prop="phone">
            <el-input
              v-model="formData.phone"
              placeholder="请输入联系电话"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="床位数量" prop="bedCount">
            <el-input-number
              v-model="formData.bedCount"
              :min="0"
              :max="9999"
              controls-position="right"
              placeholder="请输入床位数量"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="科室位置" prop="location">
        <el-input
          v-model="formData.location"
          placeholder="请输入科室位置"
        />
      </el-form-item>

      <el-form-item label="科室描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入科室描述"
        />
      </el-form-item>

      <el-form-item label="状态" prop="isActive">
        <el-radio-group v-model="formData.isActive">
          <el-radio :label="true">启用</el-radio>
          <el-radio :label="false">禁用</el-radio>
        </el-radio-group>
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
import type { Department, DepartmentCreateForm, DepartmentUpdateForm } from '@/types/system'
import { systemApi } from '@/api/system'
import { DEPARTMENT_TYPE_LABELS } from '@/types/system'

interface Props {
  visible: boolean
  department?: Department | null
  parentDepartment?: Department | null
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
const departmentTree = ref<Department[]>([])
const userOptions = ref<any[]>([])
const userSearchLoading = ref(false)

// 是否为编辑模式
const isEdit = computed(() => !!props.department)

// 是否为添加子科室
const isAddChild = computed(() => !!props.parentDepartment)

// 弹窗标题
const getDialogTitle = computed(() => {
  if (isAddChild.value) {
    return `为 "${props.parentDepartment?.name}" 添加子科室`
  }
  return isEdit.value ? '编辑科室' : '新增科室'
})

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (visible) => emit('update:visible', visible)
})

// 表单数据
const formData = reactive<DepartmentCreateForm & { id?: number }>({
  name: '',
  code: '',
  description: '',
  type: 'CLINICAL',
  parentId: undefined,
  sort: 0,
  leaderId: undefined,
  phone: '',
  location: '',
  bedCount: undefined,
  isActive: true
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入科室名称', trigger: 'blur' },
    { min: 2, max: 50, message: '科室名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入科室代码', trigger: 'blur' },
    { min: 2, max: 20, message: '科室代码长度在 2 到 20 个字符', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '科室代码只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择科室类型', trigger: 'change' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' },
    { type: 'number', min: 0, max: 9999, message: '排序值范围 0-9999', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^(\d{3,4}-?)?\d{7,8}$/, message: '请输入正确的电话号码格式', trigger: 'blur' }
  ]
}

// 获取科室树
const fetchDepartmentTree = async () => {
  try {
    const response = await systemApi.getDepartmentTree()
    departmentTree.value = response.data
  } catch (error) {
    console.error('获取科室树失败:', error)
    ElMessage.error('获取科室树失败')
  }
}

// 搜索用户
const searchUsers = async (query: string) => {
  if (!query) {
    userOptions.value = []
    return
  }

  userSearchLoading.value = true
  try {
    const response = await systemApi.searchUsers(query, 20)
    userOptions.value = response.data
  } catch (error) {
    console.error('搜索用户失败:', error)
  } finally {
    userSearchLoading.value = false
  }
}

// 填充表单数据
const fillFormData = () => {
  if (props.department) {
    Object.assign(formData, {
      id: props.department.id,
      name: props.department.name,
      code: props.department.code,
      description: props.department.description || '',
      type: props.department.type,
      parentId: props.department.parentId,
      sort: props.department.sort,
      leaderId: props.department.leaderId,
      phone: props.department.phone || '',
      location: props.department.location || '',
      bedCount: props.department.bedCount,
      isActive: props.department.isActive
    })
  } else {
    Object.assign(formData, {
      name: '',
      code: '',
      description: '',
      type: 'CLINICAL',
      parentId: undefined,
      sort: 0,
      leaderId: undefined,
      phone: '',
      location: '',
      bedCount: undefined,
      isActive: true
    })
  }

  // 设置父科室
  if (props.parentDepartment) {
    formData.parentId = props.parentDepartment.id
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    name: '',
    code: '',
    description: '',
    type: 'CLINICAL',
    parentId: undefined,
    sort: 0,
    leaderId: undefined,
    phone: '',
    location: '',
    bedCount: undefined,
    isActive: true
  })
  userOptions.value = []
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const submitData = { ...formData }
    delete submitData.id

    if (isEdit.value) {
      await systemApi.updateDepartment(props.department!.id, submitData)
      ElMessage.success('科室更新成功')
    } else {
      await systemApi.createDepartment(submitData)
      ElMessage.success('科室创建成功')
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

// 监听科室变化
watch(() => props.department, () => {
  if (props.visible) {
    fillFormData()
  }
}, { immediate: true })

// 监听父科室变化
watch(() => props.parentDepartment, () => {
  if (props.visible) {
    fillFormData()
  }
}, { immediate: true })

// 监听弹窗显示状态
watch(() => props.visible, (visible) => {
  if (visible) {
    fetchDepartmentTree()
    fillFormData()
  }
})

// 初始化
onMounted(() => {
  if (props.visible) {
    fetchDepartmentTree()
    fillFormData()
  }
})
</script>

<style scoped>
.department-form {
  max-width: 100%;
}

.user-option {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.user-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.user-username {
  color: #409eff;
}

.user-position {
  color: #67c23a;
}

:deep(.el-form-item__content) {
  flex-wrap: wrap;
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
  line-height: 1.4;
}

:deep(.el-tree-select) {
  width: 100%;
}

:deep(.el-dialog__body) {
  padding: 20px 24px;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>