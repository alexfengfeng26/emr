<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑角色' : '新增角色'"
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
      class="role-form"
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="角色名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入角色名称"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="角色代码" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入角色代码"
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="角色描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入角色描述"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="(label, value) in ROLE_STATUS_LABELS"
            :key="value"
            :label="value"
          >
            {{ label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="权限分配" prop="permissionIds">
        <div class="permission-selector">
          <div class="selector-header">
            <el-checkbox
              v-model="checkAll"
              :indeterminate="isIndeterminate"
              @change="handleCheckAllChange"
            >
              全选
            </el-checkbox>
            <span class="selected-count">
              已选择 {{ selectedPermissions.length }} 个权限
            </span>
          </div>

          <div class="permission-tree">
            <el-tree
              ref="permissionTreeRef"
              :data="permissionTree"
              :props="{ label: 'name', children: 'children' }"
              show-checkbox
              node-key="id"
              :default-checked-keys="formData.permissionIds"
              :check-strictly="false"
              @check="handlePermissionCheck"
            >
              <template #default="{ node, data }">
                <div class="permission-node">
                  <el-icon v-if="data.icon" class="node-icon">
                    <component :is="data.icon" />
                  </el-icon>
                  <div class="node-content">
                    <span class="node-name">{{ data.name }}</span>
                    <span class="node-code">{{ data.code }}</span>
                  </div>
                  <div class="node-info">
                    <el-tag size="small" :type="getPermissionTypeColor(data.type)">
                      {{ PERMISSION_TYPE_LABELS[data.type] }}
                    </el-tag>
                    <span class="node-module">{{ data.module }}</span>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
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
import type { Role, RoleCreateForm, RoleUpdateForm, Permission } from '@/types/system'
import { systemApi } from '@/api/system'
import {
  ROLE_STATUS_LABELS,
  PERMISSION_TYPE_LABELS,
  getPermissionTypeColor
} from '@/types/system'

interface Props {
  visible: boolean
  role?: Role | null
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const formRef = ref()
const permissionTreeRef = ref()
const submitting = ref(false)
const permissionTree = ref<Permission[]>([])

// 是否为编辑模式
const isEdit = computed(() => !!props.role)

// 弹窗显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (visible) => emit('update:visible', visible)
})

// 表单数据
const formData = reactive<RoleCreateForm & { id?: number }>({
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE',
  permissionIds: []
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { min: 2, max: 50, message: '角色代码长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '角色代码必须以大写字母开头，只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  permissionIds: [
    {
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少选择一个权限'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 全选状态
const checkAll = ref(false)
const isIndeterminate = ref(false)

// 选中的权限
const selectedPermissions = computed(() => {
  return formData.permissionIds || []
})

// 获取权限树
const fetchPermissionTree = async () => {
  try {
    const response = await systemApi.getPermissionTree()
    permissionTree.value = response.data
  } catch (error) {
    console.error('获取权限树失败:', error)
    ElMessage.error('获取权限树失败')
  }
}

// 获取所有权限ID
const getAllPermissionIds = (permissions: Permission[]): number[] => {
  let ids: number[] = []
  permissions.forEach(permission => {
    ids.push(permission.id)
    if (permission.children && permission.children.length > 0) {
      ids = ids.concat(getAllPermissionIds(permission.children))
    }
  })
  return ids
}

// 全选处理
const handleCheckAllChange = (checked: boolean) => {
  const allIds = getAllPermissionIds(permissionTree.value)
  formData.permissionIds = checked ? allIds : []
  checkAll.value = checked
  isIndeterminate.value = false

  // 更新树的选中状态
  if (permissionTreeRef.value) {
    if (checked) {
      permissionTreeRef.value.setCheckedKeys(allIds)
    } else {
      permissionTreeRef.value.setCheckedKeys([])
    }
  }
}

// 权限选择处理
const handlePermissionCheck = (data: any, checked: any) => {
  formData.permissionIds = checked.checkedKeys

  // 更新全选状态
  const allIds = getAllPermissionIds(permissionTree.value)
  const checkedCount = formData.permissionIds.length
  checkAll.value = checkedCount === allIds.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < allIds.length
}

// 填充表单数据
const fillFormData = () => {
  if (props.role) {
    Object.assign(formData, {
      id: props.role.id,
      name: props.role.name,
      code: props.role.code,
      description: props.role.description || '',
      status: props.role.status,
      permissionIds: props.role.permissions.map(p => p.id)
    })
  } else {
    Object.assign(formData, {
      name: '',
      code: '',
      description: '',
      status: 'ACTIVE',
      permissionIds: []
    })
  }

  // 重置全选状态
  checkAll.value = false
  isIndeterminate.value = false
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
    status: 'ACTIVE',
    permissionIds: []
  })
  checkAll.value = false
  isIndeterminate.value = false
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
      await systemApi.updateRole(props.role!.id, submitData)
      ElMessage.success('角色更新成功')
    } else {
      await systemApi.createRole(submitData)
      ElMessage.success('角色创建成功')
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

// 监听角色变化
watch(() => props.role, () => {
  if (props.visible) {
    fillFormData()
    // 等待DOM更新后设置树的选中状态
    setTimeout(() => {
      if (permissionTreeRef.value && formData.permissionIds.length > 0) {
        permissionTreeRef.value.setCheckedKeys(formData.permissionIds)
      }
    }, 100)
  }
}, { immediate: true })

// 监听弹窗显示状态
watch(() => props.visible, (visible) => {
  if (visible) {
    fetchPermissionTree()
    fillFormData()
  }
})

// 初始化
onMounted(() => {
  if (props.visible) {
    fetchPermissionTree()
    fillFormData()
  }
})
</script>

<style scoped>
.role-form {
  max-width: 100%;
}

.permission-selector {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.selected-count {
  font-size: 14px;
  color: #909399;
}

.permission-tree {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.permission-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  flex: 1;
}

.node-icon {
  color: #409eff;
  font-size: 16px;
  flex-shrink: 0;
}

.node-content {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-weight: 500;
  color: #303133;
  display: block;
}

.node-code {
  font-size: 12px;
  color: #909399;
  display: block;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.node-module {
  font-size: 12px;
  color: #909399;
  background-color: #f0f2f5;
  padding: 2px 6px;
  border-radius: 2px;
}

:deep(.el-form-item__content) {
  flex-wrap: wrap;
}

:deep(.el-tree) {
  background: transparent;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

:deep(.el-checkbox__label) {
  width: 100%;
}

:deep(.el-tree-node__expand-icon) {
  padding: 4px;
}

:deep(.el-tree-node__label) {
  flex: 1;
}

:deep(.el-dialog__body) {
  padding: 20px 24px;
}

:deep(.el-card__body) {
  padding: 16px;
}

/* 自定义滚动条 */
.permission-tree::-webkit-scrollbar {
  width: 6px;
}

.permission-tree::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.permission-tree::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.permission-tree::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>