<template>
  <div class="patient-form-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2>{{ isEdit ? '编辑患者' : '新增患者' }}</h2>
        <p>{{ isEdit ? '修改患者基本信息' : '录入新患者的基本信息' }}</p>
      </div>
      <div class="header-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '创建患者' }}
        </el-button>
      </div>
    </div>

    <!-- 患者表单 -->
    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        size="large"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <h3>基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="formData.name" placeholder="请输入患者姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别" prop="gender">
                <el-select v-model="formData.gender" placeholder="请选择性别">
                  <el-option
                    v-for="(label, value) in GENDER_MAP"
                    :key="value"
                    :label="label"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="出生日期" prop="birthDate">
                <el-date-picker
                  v-model="formData.birthDate"
                  type="date"
                  placeholder="请选择出生日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" prop="idCard">
                <el-input v-model="formData.idCard" placeholder="请输入18位身份证号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="formData.phone" placeholder="请输入11位手机号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱地址（可选）" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="地址" prop="address">
            <el-input v-model="formData.address" placeholder="请输入详细地址" />
          </el-form-item>
        </div>

        <!-- 联系信息 -->
        <div class="form-section">
          <h3>联系信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="紧急联系人" prop="emergencyContact">
                <el-input v-model="formData.emergencyContact" placeholder="请输入紧急联系人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="紧急联系电话" prop="emergencyPhone">
                <el-input v-model="formData.emergencyPhone" placeholder="请输入紧急联系人电话" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 医疗信息 -->
        <div class="form-section">
          <h3>医疗信息</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="血型" prop="bloodType">
                <el-select v-model="formData.bloodType" placeholder="请选择血型">
                  <el-option
                    v-for="(label, value) in BLOOD_TYPE_MAP"
                    :key="value"
                    :label="label"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Rh因子" prop="rhFactor">
                <el-select v-model="formData.rhFactor" placeholder="请选择Rh因子">
                  <el-option
                    v-for="(label, value) in RH_FACTOR_MAP"
                    :key="value"
                    :label="label"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="婚姻状况" prop="maritalStatus">
                <el-select v-model="formData.maritalStatus" placeholder="请选择婚姻状况">
                  <el-option
                    v-for="(label, value) in MARITAL_STATUS_MAP"
                    :key="value"
                    :label="label"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="医保类型" prop="insuranceType">
                <el-select v-model="formData.insuranceType" placeholder="请选择医保类型">
                  <el-option
                    v-for="(label, value) in INSURANCE_TYPE_MAP"
                    :key="value"
                    :label="label"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="医保号" prop="insuranceNumber">
                <el-input v-model="formData.insuranceNumber" placeholder="请输入医保号（可选）" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="职业" prop="occupation">
                <el-input v-model="formData.occupation" placeholder="请输入职业（可选）" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="工作单位" prop="employer">
                <el-input v-model="formData.employer" placeholder="请输入工作单位（可选）" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="过敏史" prop="allergies">
            <el-input
              v-model="allergiesText"
              type="textarea"
              :rows="3"
              placeholder="请输入过敏史，多个过敏原用逗号分隔（可选）"
            />
          </el-form-item>

          <el-form-item label="病史" prop="medicalHistory">
            <el-input
              v-model="formData.medicalHistory"
              type="textarea"
              :rows="4"
              placeholder="请输入既往病史（可选）"
            />
          </el-form-item>

          <el-form-item label="家族史" prop="familyHistory">
            <el-input
              v-model="formData.familyHistory"
              type="textarea"
              :rows="3"
              placeholder="请输入家族病史（可选）"
            />
          </el-form-item>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { patientApi } from '@/api/patients'
import type {
  PatientCreateForm,
  PatientUpdateForm,
  Patient
} from '@/types/patient'
import {
  GENDER_MAP,
  BLOOD_TYPE_MAP,
  RH_FACTOR_MAP,
  MARITAL_STATUS_MAP,
  INSURANCE_TYPE_MAP
} from '@/types/patient'

const router = useRouter()
const route = useRoute()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const saving = ref(false)
const patientId = ref<number>()

// 是否为编辑模式
const isEdit = computed(() => !!patientId.value)

// 表单数据
const formData = reactive<PatientCreateForm>({
  name: '',
  gender: 'MALE',
  birthDate: '',
  phone: '',
  idCard: '',
  email: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  bloodType: 'UNKNOWN',
  rhFactor: 'UNKNOWN',
  maritalStatus: 'SINGLE',
  occupation: '',
  employer: '',
  insuranceType: 'BASIC',
  insuranceNumber: '',
  allergies: [],
  medicalHistory: '',
  familyHistory: ''
})

// 过敏史文本（用于编辑）
const allergiesText = ref('')

// 表单验证规则
const formRules: FormRules<PatientCreateForm> = {
  name: [
    { required: true, message: '请输入患者姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在2到20个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  birthDate: [
    { required: true, message: '请选择出生日期', trigger: 'change' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的18位身份证号', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' }
  ],
  emergencyContact: [
    { required: true, message: '请输入紧急联系人', trigger: 'blur' }
  ],
  emergencyPhone: [
    { required: true, message: '请输入紧急联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  bloodType: [
    { required: true, message: '请选择血型', trigger: 'change' }
  ],
  insuranceType: [
    { required: true, message: '请选择医保类型', trigger: 'change' }
  ]
}

// 加载患者数据（编辑模式）
const loadPatient = async () => {
  if (!patientId.value) return

  try {
    const patient = await patientApi.getPatientById(patientId.value)

    // 填充表单数据
    Object.assign(formData, {
      name: patient.name,
      gender: patient.gender,
      birthDate: patient.birthDate,
      phone: patient.phone,
      idCard: patient.idCard,
      email: patient.email || '',
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      bloodType: patient.bloodType,
      rhFactor: patient.rhFactor,
      maritalStatus: patient.maritalStatus,
      occupation: patient.occupation || '',
      employer: patient.employer || '',
      insuranceType: patient.insuranceType,
      insuranceNumber: patient.insuranceNumber || '',
      medicalHistory: patient.medicalHistory || '',
      familyHistory: patient.familyHistory || ''
    })

    // 处理过敏史
    allergiesText.value = patient.allergies?.join(', ') || ''
    formData.allergies = patient.allergies || []
  } catch (error) {
    ElMessage.error('加载患者数据失败')
    router.push('/patients')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 处理过敏史
    if (allergiesText.value.trim()) {
      formData.allergies = allergiesText.value.split(',').map(item => item.trim()).filter(Boolean)
    } else {
      formData.allergies = []
    }

    saving.value = true

    if (isEdit.value) {
      // 编辑模式
      const updateData: PatientUpdateForm = { ...formData }
      await patientApi.updatePatient(patientId.value!, updateData)
      ElMessage.success('患者信息更新成功')
    } else {
      // 新增模式
      await patientApi.createPatient(formData)
      ElMessage.success('患者创建成功')
    }

    // 返回列表页
    router.push('/patients')
  } catch (error: any) {
    if (error.errors) {
      // 表单验证错误
      return
    }
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    saving.value = false
  }
}

// 取消
const handleCancel = () => {
  router.push('/patients')
}

// 初始化
onMounted(() => {
  const id = route.params.id as string
  if (id) {
    patientId.value = parseInt(id)
    loadPatient()
  }
})
</script>

<style scoped>
.patient-form-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.form-card {
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__wrapper) {
  height: 40px;
}

:deep(.el-select .el-input__wrapper) {
  height: 40px;
}
</style>