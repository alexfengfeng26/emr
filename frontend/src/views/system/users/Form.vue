<template>
  <div class="user-form-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>{{ isEdit ? '编辑用户' : '新增用户' }}</h2>
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="user-form"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="formData.username"
                placeholder="请输入用户名"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input
                v-model="formData.realName"
                placeholder="请输入真实姓名"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="!isEdit" :gutter="24">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="formData.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="formData.email"
                placeholder="请输入邮箱"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="formData.phone"
                placeholder="请输入手机号"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="所属科室" prop="departmentId">
              <el-select
                v-model="formData.departmentId"
                placeholder="请选择科室"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="position">
              <el-input
                v-model="formData.position"
                placeholder="请输入职位"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="职称" prop="title">
              <el-input
                v-model="formData.title"
                placeholder="请输入职称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select
                v-model="formData.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, value) in USER_STATUS_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="头像" prop="avatar">
          <el-upload
            class="avatar-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :on-success="handleAvatarSuccess"
            :on-error="handleAvatarError"
          >
            <img v-if="formData.avatar" :src="formData.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="avatar-tip">
            <p>支持 jpg、png 格式，文件大小不超过 2MB</p>
          </div>
        </el-form-item>

        <el-form-item label="角色分配" prop="roleIds">
          <el-checkbox-group v-model="formData.roleIds">
            <el-checkbox
              v-for="role in roles"
              :key="role.id"
              :label="role.id"
              :disabled="role.isSystem"
            >
              <div class="role-item">
                <div class="role-name">{{ role.name }}</div>
                <div class="role-desc">{{ role.description || role.code }}</div>
                <div v-if="role.isSystem" class="role-system">系统角色</div>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import type {
  UserCreateForm,
  UserUpdateForm,
  Role,
  Department
} from '@/types/system'
import { systemApi } from '@/api/system'
import {
  USER_STATUS_LABELS
} from '@/types/system'

const router = useRouter()
const route = useRoute()

// 是否为编辑模式
const isEdit = computed(() => !!route.params.id)

// 响应式数据
const submitting = ref(false)
const formData = reactive<UserCreateForm & { confirmPassword?: string }>({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  email: '',
  phone: '',
  avatar: '',
  departmentId: undefined,
  position: '',
  title: '',
  status: 'ACTIVE',
  roleIds: []
})

// 表单引用
const formRef = ref()

// 数据列表
const departments = ref<Department[]>([])
const roles = ref<Role[]>([])

// 上传配置
const uploadUrl = `${import.meta.env.VITE_API_URL || '/api'}/system/upload/avatar`
const uploadHeaders = computed(() => {
  // 这里应该从store获取token
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '真实姓名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    {
      required: !isEdit.value,
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请输入密码'))
        } else if (value && value.length < 6) {
          callback(new Error('密码长度不能少于6位'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    {
      required: !isEdit.value,
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请再次输入密码'))
        } else if (value && value !== formData.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  position: [
    { required: true, message: '请输入职位', trigger: 'blur' }
  ],
  title: [
    { required: true, message: '请输入职称', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  roleIds: [
    {
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少选择一个角色'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 获取科室列表
const fetchDepartments = async () => {
  try {
    const response = await systemApi.getDepartments()
    departments.value = response.items
  } catch (error) {
    console.error('获取科室列表失败:', error)
    ElMessage.error('获取科室列表失败')
  }
}

// 获取角色列表
const fetchRoles = async () => {
  try {
    const response = await systemApi.getRoles()
    roles.value = response.items
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.value = '获取角色列表失败'
  }
}

// 获取用户详情（编辑时使用）
const fetchUserDetail = async (id: number) => {
  try {
    const user = await systemApi.getUserById(id)

    // 填充表单数据
    Object.assign(formData, {
      username: user.data.username,
      realName: user.data.realName,
      email: user.data.email,
      phone: user.data.phone,
      avatar: user.data.avatar,
      departmentId: user.data.departmentId,
      position: user.data.position,
      title: user.data.title,
      status: user.data.status,
      roleIds: user.data.roles.map(role => role.id)
    })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    ElMessage.error('获取用户详情失败')
  }
}

// 头像上传前验证
const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 头像上传成功
const handleAvatarSuccess = (response: any) => {
  formData.avatar = response.data.url
  ElMessage.success('头像上传成功')
}

// 头像上传失败
const handleAvatarError = () => {
  ElMessage.error('头像上传失败')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const submitData = { ...formData }
    delete submitData.confirmPassword

    if (isEdit.value) {
      await systemApi.updateUser(Number(route.params.id), submitData)
      ElMessage.success('用户更新成功')
    } else {
      await systemApi.createUser(submitData)
      ElMessage.success('用户创建成功')
    }

    // 返回列表页
    handleBack()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 返回列表页
const handleBack = () => {
  router.push('/system/users')
}

// 初始化
onMounted(() => {
  fetchDepartments()
  fetchRoles()

  if (isEdit.value) {
    fetchUserDetail(Number(route.params.id))
  }
})
</script>

<style scoped>
.user-form-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-form {
  max-width: 800px;
  margin: 0 auto;
}

.avatar-uploader {
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}

.avatar-tip {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.avatar-tip p {
  margin: 4px 0;
}

.role-item {
  line-height: 1.2;
}

.role-name {
  font-weight: 500;
}

.role-desc {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.role-system {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background-color: #f0f9ff;
  color: #409eff;
  font-size: 12px;
  border-radius: 2px;
}

:deep(.el-form-item__content) {
  flex-wrap: wrap;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

:deep(.el-checkbox) {
  width: 200px;
  margin-right: 0;
  margin-bottom: 8px;
}
</style>