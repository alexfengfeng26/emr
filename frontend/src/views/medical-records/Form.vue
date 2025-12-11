<template>
  <div class="medical-record-form-container">
    <!-- 页面头部 -->
    <el-card class="form-header">
      <template #header>
        <div class="header-content">
          <span class="title">{{ isEdit ? '编辑病历' : '新建病历' }}</span>
          <div class="header-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button
              type="primary"
              :loading="saving"
              @click="handleSaveDraft"
            >
              保存草稿
            </el-button>
            <el-button
              type="success"
              :loading="submitting"
              @click="handleSubmit"
            >
              提交审核
            </el-button>
          </div>
        </div>
      </template>
      <el-steps :active="currentStep" align-center>
        <el-step title="基本信息" description="患者和基础信息" />
        <el-step title="病历内容" description="病情描述和诊断" />
        <el-step title="检查和处方" description="检查项目和医嘱" />
        <el-step title="确认提交" description="审核和提交" />
      </el-steps>
    </el-card>

    <div class="form-content">
      <!-- 步骤1：基本信息 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-card>
          <template #header>基本信息</template>
          <el-form
            ref="basicFormRef"
            :model="formData"
            :rules="basicRules"
            label-width="120px"
            class="medical-record-form"
          >
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="患者" prop="patientId">
                  <el-select
                    v-model="formData.patientId"
                    placeholder="请选择患者"
                    filterable
                    remote
                    :remote-method="searchPatients"
                    :loading="patientSearchLoading"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="patient in patientOptions"
                      :key="patient.id"
                      :label="`${patient.name} (${patient.age}岁)`"
                      :value="patient.id"
                    >
                      <span>{{ patient.name }}</span>
                      <span style="float: right; color: #8492a6; font-size: 13px">
                        {{ patient.gender }} | {{ patient.phone }}
                      </span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="病历类型" prop="recordType">
                  <el-select v-model="formData.recordType" placeholder="请选择病历类型">
                    <el-option
                      v-for="(label, value) in RECORD_TYPE_LABELS"
                      :key="value"
                      :label="label"
                      :value="value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="就诊日期" prop="visitDate">
                  <el-date-picker
                    v-model="formData.visitDate"
                    type="datetime"
                    placeholder="选择就诊日期时间"
                    format="YYYY-MM-DD HH:mm"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="就诊科室" prop="department">
                  <el-select v-model="formData.department" placeholder="请选择科室">
                    <el-option label="内科" value="内科" />
                    <el-option label="外科" value="外科" />
                    <el-option label="妇产科" value="妇产科" />
                    <el-option label="儿科" value="儿科" />
                    <el-option label="眼科" value="眼科" />
                    <el-option label="耳鼻喉科" value="耳鼻喉科" />
                    <el-option label="皮肤科" value="皮肤科" />
                    <el-option label="中医科" value="中医科" />
                    <el-option label="急诊科" value="急诊科" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="主治医生" prop="doctorName">
                  <el-input v-model="formData.doctorName" placeholder="请输入主治医生姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="就诊方式" prop="visitType">
                  <el-radio-group v-model="formData.visitType">
                    <el-radio value="初诊">初诊</el-radio>
                    <el-radio value="复诊">复诊</el-radio>
                    <el-radio value="急诊">急诊</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="主诉">
              <el-input
                v-model="formData.chiefComplaint"
                type="textarea"
                :rows="3"
                placeholder="请输入主要症状和持续时间"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 步骤2：病历内容 -->
      <div v-show="currentStep === 1" class="step-content">
        <el-card>
          <template #header>病历内容</template>
          <el-form
            ref="contentFormRef"
            :model="formData"
            :rules="contentRules"
            label-width="120px"
            class="medical-record-form"
          >
            <el-form-item label="现病史">
              <el-input
                v-model="formData.presentIllnessHistory"
                type="textarea"
                :rows="4"
                placeholder="请输入现病史"
              />
            </el-form-item>

            <el-form-item label="既往史">
              <el-input
                v-model="formData.pastHistory"
                type="textarea"
                :rows="3"
                placeholder="请输入既往病史、手术史、过敏史等"
              />
            </el-form-item>

            <el-form-item label="体格检查" prop="physicalExamination">
              <div class="physical-exam-editor">
                <el-tabs v-model="physicalExamTab" type="card">
                  <el-tab-pane label="一般情况" name="general">
                    <el-form :model="formData.physicalExamination.general" label-width="100px">
                      <el-row :gutter="16">
                        <el-col :span="8">
                          <el-form-item label="体温">
                            <el-input
                              v-model="formData.physicalExamination.general.temperature"
                              placeholder="℃"
                              style="width: 100%"
                            >
                              <template #append>℃</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                        <el-col :span="8">
                          <el-form-item label="脉搏">
                            <el-input
                              v-model="formData.physicalExamination.general.pulse"
                              placeholder="次/分"
                              style="width: 100%"
                            >
                              <template #append>次/分</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                        <el-col :span="8">
                          <el-form-item label="血压">
                            <el-input
                              v-model="formData.physicalExamination.general.bloodPressure"
                              placeholder="mmHg"
                              style="width: 100%"
                            >
                              <template #append>mmHg</template>
                            </el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                    </el-form>
                  </el-tab-pane>

                  <el-tab-pane label="专科检查" name="specialist">
                    <div class="rich-editor-container">
                      <div ref="specialistEditorRef" class="rich-editor"></div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </el-form-item>

            <el-form-item label="初步诊断" prop="preliminaryDiagnosis">
              <div class="diagnosis-container">
                <el-tag
                  v-for="(diagnosis, index) in formData.preliminaryDiagnosis"
                  :key="index"
                  closable
                  @close="removeDiagnosis(index)"
                  style="margin-right: 8px; margin-bottom: 8px"
                >
                  {{ diagnosis }}
                </el-tag>
                <el-select
                  v-if="diagnosisInputVisible"
                  ref="diagnosisInputRef"
                  v-model="diagnosisInputValue"
                  filterable
                  allow-create
                  default-first-option
                  :remote-method="searchDiagnoses"
                  @keyup.enter="handleDiagnosisInputConfirm"
                  @blur="handleDiagnosisInputConfirm"
                  style="width: 200px"
                >
                  <el-option
                    v-for="item in diagnosisOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
                <el-button v-else @click="showDiagnosisInput">
                  <el-icon><Plus /></el-icon>
                  添加诊断
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 步骤3：检查和处方 -->
      <div v-show="currentStep === 2" class="step-content">
        <el-card>
          <template #header>检查和医嘱</template>
          <el-form
            ref="medicalFormRef"
            :model="formData"
            label-width="120px"
            class="medical-record-form"
          >
            <el-form-item label="辅助检查">
              <div class="rich-editor-container">
                <div ref="examinationEditorRef" class="rich-editor"></div>
              </div>
            </el-form-item>

            <el-form-item label="治疗方案">
              <div class="rich-editor-container">
                <div ref="treatmentEditorRef" class="rich-editor"></div>
              </div>
            </el-form-item>

            <el-form-item label="处方信息">
              <div class="prescription-container">
                <div
                  v-for="(prescription, index) in formData.prescriptions"
                  :key="index"
                  class="prescription-item"
                >
                  <el-row :gutter="16">
                    <el-col :span="8">
                      <el-input
                        v-model="prescription.medicineName"
                        placeholder="药品名称"
                      />
                    </el-col>
                    <el-col :span="6">
                      <el-input
                        v-model="prescription.specification"
                        placeholder="规格"
                      />
                    </el-col>
                    <el-col :span="4">
                      <el-input
                        v-model="prescription.dosage"
                        placeholder="用量"
                      />
                    </el-col>
                    <el-col :span="4">
                      <el-input
                        v-model="prescription.frequency"
                        placeholder="频次"
                      />
                    </el-col>
                    <el-col :span="2">
                      <el-button
                        type="danger"
                        icon="Delete"
                        @click="removePrescription(index)"
                      />
                    </el-col>
                  </el-row>
                </div>
                <el-button
                  type="primary"
                  icon="Plus"
                  @click="addPrescription"
                  style="margin-top: 16px"
                >
                  添加药品
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="医嘱">
              <div class="rich-editor-container">
                <div ref="adviceEditorRef" class="rich-editor"></div>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 步骤4：确认提交 -->
      <div v-show="currentStep === 3" class="step-content">
        <el-card>
          <template #header>确认信息</template>
          <div class="summary-content">
            <h3>病历信息概览</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="患者">{{ patientInfo?.name }}</el-descriptions-item>
              <el-descriptions-item label="病历类型">{{ RECORD_TYPE_LABELS[formData.recordType] }}</el-descriptions-item>
              <el-descriptions-item label="就诊日期">{{ formData.visitDate }}</el-descriptions-item>
              <el-descriptions-item label="就诊科室">{{ formData.department }}</el-descriptions-item>
              <el-descriptions-item label="主治医生">{{ formData.doctorName }}</el-descriptions-item>
              <el-descriptions-item label="就诊方式">{{ formData.visitType }}</el-descriptions-item>
              <el-descriptions-item label="主诉" :span="2">{{ formData.chiefComplaint }}</el-descriptions-item>
              <el-descriptions-item label="初步诊断" :span="2">
                <el-tag
                  v-for="diagnosis in formData.preliminaryDiagnosis"
                  :key="diagnosis"
                  style="margin-right: 8px"
                >
                  {{ diagnosis }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div style="margin-top: 24px;">
              <h4>注意事项</h4>
              <ul class="notice-list">
                <li>请仔细核对病历信息，确保信息准确无误</li>
                <li>提交后将进入审核流程，审核期间不可修改</li>
                <li>如有错误，请及时联系审核人员</li>
              </ul>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 步骤导航 -->
    <div class="step-navigation">
      <el-button
        v-if="currentStep > 0"
        @click="prevStep"
      >
        上一步
      </el-button>
      <el-button
        v-if="currentStep < 3"
        type="primary"
        @click="nextStep"
      >
        下一步
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import {
  medicalRecordApi,
  type MedicalRecord,
  type MedicalRecordCreateForm,
  type MedicalRecordUpdateForm,
  RECORD_TYPE_LABELS
} from '@/api/medical-records'
import { patientApi, type Patient } from '@/api/patients'

const router = useRouter()
const route = useRoute()

// 响应式数据
const currentStep = ref(0)
const isEdit = ref(false)
const saving = ref(false)
const submitting = ref(false)
const patientSearchLoading = ref(false)
const patientOptions = ref<Patient[]>([])

// 表单引用
const basicFormRef = ref<FormInstance>()
const contentFormRef = ref<FormInstance>()
const medicalFormRef = ref<FormInstance>()

// 编辑器引用
const specialistEditorRef = ref<HTMLDivElement>()
const examinationEditorRef = ref<HTMLDivElement>()
const treatmentEditorRef = ref<HTMLDivElement>()
const adviceEditorRef = ref<HTMLDivElement>()

// 编辑器实例
let specialistEditor: Quill | null = null
let examinationEditor: Quill | null = null
let treatmentEditor: Quill | null = null
let adviceEditor: Quill | null = null

// 诊断相关
const diagnosisInputVisible = ref(false)
const diagnosisInputValue = ref('')
const diagnosisOptions = ref<string[]>([])
const diagnosisInputRef = ref()

// 表单数据
const formData = reactive<MedicalRecordCreateForm>({
  patientId: 0,
  recordType: 'OUTPATIENT',
  visitDate: '',
  department: '',
  doctorName: '',
  chiefComplaint: '',
  presentIllnessHistory: '',
  pastHistory: '',
  physicalExamination: {
    general: {
      temperature: '',
      pulse: '',
      bloodPressure: ''
    },
    specialist: ''
  },
  preliminaryDiagnosis: [],
  auxiliaryExamination: '',
  treatmentPlan: '',
  prescriptions: [],
  medicalAdvice: '',
  visitType: '初诊'
})

// 表单验证规则
const basicRules = reactive<FormRules>({
  patientId: [
    { required: true, message: '请选择患者', trigger: 'change' }
  ],
  recordType: [
    { required: true, message: '请选择病历类型', trigger: 'change' }
  ],
  visitDate: [
    { required: true, message: '请选择就诊日期', trigger: 'change' }
  ],
  department: [
    { required: true, message: '请选择就诊科室', trigger: 'change' }
  ],
  doctorName: [
    { required: true, message: '请输入主治医生姓名', trigger: 'blur' }
  ]
})

const contentRules = reactive<FormRules>({
  physicalExamination: [
    { required: true, message: '请填写体格检查', trigger: 'blur' }
  ],
  preliminaryDiagnosis: [
    { required: true, message: '请添加初步诊断', trigger: 'change' }
  ]
})

// 当前选中的患者信息
const patientInfo = computed(() => {
  return patientOptions.value.find(p => p.id === formData.patientId)
})

// 体检检查标签页
const physicalExamTab = ref('general')

// 初始化富文本编辑器
const initRichEditors = () => {
  nextTick(() => {
    // 专科检查编辑器
    if (specialistEditorRef.value && !specialistEditor) {
      specialistEditor = new Quill(specialistEditorRef.value, {
        theme: 'snow',
        placeholder: '请输入专科检查内容',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }
      })
    }

    // 辅助检查编辑器
    if (examinationEditorRef.value && !examinationEditor) {
      examinationEditor = new Quill(examinationEditorRef.value, {
        theme: 'snow',
        placeholder: '请输入辅助检查结果',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }
      })
    }

    // 治疗方案编辑器
    if (treatmentEditorRef.value && !treatmentEditor) {
      treatmentEditor = new Quill(treatmentEditorRef.value, {
        theme: 'snow',
        placeholder: '请输入治疗方案',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }
      })
    }

    // 医嘱编辑器
    if (adviceEditorRef.value && !adviceEditor) {
      adviceEditor = new Quill(adviceEditorRef.value, {
        theme: 'snow',
        placeholder: '请输入医嘱',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }
      })
    }
  })
}

// 搜索患者
const searchPatients = async (query: string) => {
  if (!query) return

  try {
    patientSearchLoading.value = true
    const response = await patientApi.searchPatients(query)
    patientOptions.value = response.data.slice(0, 10) // 限制显示10个结果
  } catch (error) {
    console.error('搜索患者失败:', error)
    ElMessage.error('搜索患者失败')
  } finally {
    patientSearchLoading.value = false
  }
}

// 搜索诊断
const searchDiagnoses = async (query: string) => {
  if (!query) return

  try {
    const response = await medicalRecordApi.getCommonDiagnoses(query)
    diagnosisOptions.value = response.data
  } catch (error) {
    console.error('搜索诊断失败:', error)
  }
}

// 添加诊断
const showDiagnosisInput = () => {
  diagnosisInputVisible.value = true
  nextTick(() => {
    diagnosisInputRef.value?.focus()
  })
}

// 确认诊断输入
const handleDiagnosisInputConfirm = () => {
  if (diagnosisInputValue.value && !formData.preliminaryDiagnosis.includes(diagnosisInputValue.value)) {
    formData.preliminaryDiagnosis.push(diagnosisInputValue.value)
  }
  diagnosisInputVisible.value = false
  diagnosisInputValue.value = ''
}

// 移除诊断
const removeDiagnosis = (index: number) => {
  formData.preliminaryDiagnosis.splice(index, 1)
}

// 添加处方
const addPrescription = () => {
  formData.prescriptions.push({
    medicineName: '',
    specification: '',
    dosage: '',
    frequency: '',
    duration: '',
    usage: ''
  })
}

// 移除处方
const removePrescription = (index: number) => {
  formData.prescriptions.splice(index, 1)
}

// 步骤导航
const nextStep = async () => {
  let formRef: FormInstance | null = null

  switch (currentStep.value) {
    case 0:
      formRef = basicFormRef.value
      break
    case 1:
      formRef = contentFormRef.value
      break
    case 2:
      formRef = medicalFormRef.value
      break
  }

  if (formRef) {
    try {
      await formRef.validate()
      currentStep.value++

      // 在步骤2时初始化富文本编辑器
      if (currentStep.value === 2) {
        initRichEditors()
      }
    } catch (error) {
      ElMessage.error('请完善当前步骤的必填信息')
    }
  } else {
    currentStep.value++
  }
}

const prevStep = () => {
  currentStep.value--
}

// 收集表单数据
const collectFormData = (): MedicalRecordCreateForm => {
  // 收集富文本编辑器内容
  if (specialistEditor) {
    formData.physicalExamination.specialist = specialistEditor.root.innerHTML
  }
  if (examinationEditor) {
    formData.auxiliaryExamination = examinationEditor.root.innerHTML
  }
  if (treatmentEditor) {
    formData.treatmentPlan = treatmentEditor.root.innerHTML
  }
  if (adviceEditor) {
    formData.medicalAdvice = adviceEditor.root.innerHTML
  }

  return { ...formData }
}

// 保存草稿
const handleSaveDraft = async () => {
  try {
    saving.value = true
    const data = collectFormData()

    if (isEdit.value && route.params.id) {
      await medicalRecordApi.updateMedicalRecord(Number(route.params.id), data)
      ElMessage.success('病历草稿保存成功')
    } else {
      await medicalRecordApi.createMedicalRecord(data)
      ElMessage.success('病历草稿创建成功')
    }

    router.push('/medical-records')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 提交审核
const handleSubmit = async () => {
  try {
    await ElMessageBox.confirm(
      '提交后将进入审核流程，确定要提交吗？',
      '确认提交',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    submitting.value = true
    const data = collectFormData()

    if (isEdit.value && route.params.id) {
      const recordId = Number(route.params.id)
      await medicalRecordApi.updateMedicalRecord(recordId, data)
      await medicalRecordApi.submitMedicalRecord(recordId)
    } else {
      const response = await medicalRecordApi.createMedicalRecord(data)
      await medicalRecordApi.submitMedicalRecord(response.data.id)
    }

    ElMessage.success('病历提交成功')
    router.push('/medical-records')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
      ElMessage.error('提交失败')
    }
  } finally {
    submitting.value = false
  }
}

// 取消操作
const handleCancel = () => {
  ElMessageBox.confirm(
    '确定要取消吗？未保存的内容将会丢失。',
    '确认取消',
    {
      confirmButtonText: '确定',
      cancelButtonText: '继续编辑',
      type: 'warning'
    }
  ).then(() => {
    router.push('/medical-records')
  }).catch(() => {
    // 用户选择继续编辑，不做任何操作
  })
}

// 加载编辑数据
const loadEditData = async (id: number) => {
  try {
    const response = await medicalRecordApi.getMedicalRecordById(id)
    const record = response.data

    // 填充表单数据
    Object.assign(formData, record)

    // 如果有富文本内容，设置到编辑器
    nextTick(() => {
      initRichEditors()
      if (specialistEditor && formData.physicalExamination.specialist) {
        specialistEditor.root.innerHTML = formData.physicalExamination.specialist
      }
      if (examinationEditor && formData.auxiliaryExamination) {
        examinationEditor.root.innerHTML = formData.auxiliaryExamination
      }
      if (treatmentEditor && formData.treatmentPlan) {
        treatmentEditor.root.innerHTML = formData.treatmentPlan
      }
      if (adviceEditor && formData.medicalAdvice) {
        adviceEditor.root.innerHTML = formData.medicalAdvice
      }
    })
  } catch (error) {
    console.error('加载病历数据失败:', error)
    ElMessage.error('加载病历数据失败')
    router.push('/medical-records')
  }
}

// 组件挂载
onMounted(() => {
  // 检查是否为编辑模式
  if (route.params.id) {
    isEdit.value = true
    loadEditData(Number(route.params.id))
  }
})

// 组件卸载
onUnmounted(() => {
  // 清理富文本编辑器
  if (specialistEditor) {
    specialistEditor = null
  }
  if (examinationEditor) {
    examinationEditor = null
  }
  if (treatmentEditor) {
    treatmentEditor = null
  }
  if (adviceEditor) {
    adviceEditor = null
  }
})
</script>

<style scoped>
.medical-record-form-container {
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.form-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.form-content {
  margin-bottom: 24px;
}

.step-content {
  margin-bottom: 24px;
}

.medical-record-form {
  max-width: 100%;
}

.physical-exam-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.rich-editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.rich-editor {
  min-height: 200px;
}

.diagnosis-container {
  min-height: 40px;
}

.prescription-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  background-color: #fafafa;
}

.prescription-item {
  margin-bottom: 16px;
  padding: 16px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.prescription-item:last-child {
  margin-bottom: 0;
}

.summary-content {
  padding: 20px;
}

.summary-content h3 {
  margin-bottom: 20px;
  color: #303133;
}

.summary-content h4 {
  margin-bottom: 12px;
  color: #606266;
}

.notice-list {
  list-style-type: none;
  padding: 0;
}

.notice-list li {
  padding: 8px 0;
  color: #f56c6c;
  position: relative;
  padding-left: 20px;
}

.notice-list li:before {
  content: '•';
  position: absolute;
  left: 0;
  color: #f56c6c;
}

.step-navigation {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}

:deep(.ql-toolbar) {
  border-top: none;
  border-left: none;
  border-right: none;
}

:deep(.ql-container) {
  border-bottom: none;
  border-left: none;
  border-right: none;
  font-size: 14px;
}

:deep(.el-descriptions__body) {
  background-color: #fafafa;
}
</style>