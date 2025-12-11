<template>
  <div class="medicine-form-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>{{ isEdit ? '编辑药品' : '新增药品' }}</h2>
          <el-button @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        :disabled="loading"
      >
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="药品编号" prop="medicineId">
              <el-input
                v-model="form.medicineId"
                placeholder="请输入药品编号，如：MD20250111001"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通用名" prop="genericName">
              <el-input v-model="form.genericName" placeholder="请输入通用名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名" prop="tradeName">
              <el-input v-model="form.tradeName" placeholder="请输入商品名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌名" prop="brandName">
              <el-input v-model="form.brandName" placeholder="请输入品牌名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="药品分类" prop="category">
              <el-select
                v-model="form.category"
                placeholder="请选择分类"
                filterable
                allow-create
                @change="handleCategoryChange"
              >
                <el-option
                  v-for="category in COMMON_MEDICINE_CATEGORIES"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="子分类" prop="subcategory">
              <el-input v-model="form.subcategory" placeholder="请输入子分类" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="药品类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型">
                <el-option
                  v-for="(label, value) in MEDICINE_TYPE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="剂型" prop="dosageForm">
              <el-select
                v-model="form.dosageForm"
                placeholder="请选择剂型"
                filterable
                allow-create
              >
                <el-option
                  v-for="form in COMMON_DOSAGE_FORMS"
                  :key="form"
                  :label="form"
                  :value="form"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格" prop="specification">
              <el-input v-model="form.specification" placeholder="如：10mg*24片" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="含量规格" prop="strength">
              <el-input v-model="form.strength" placeholder="如：10mg" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 生产信息 -->
        <el-divider content-position="left">生产信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产厂家" prop="manufacturer">
              <el-input v-model="form.manufacturer" placeholder="请输入生产厂家" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产国家" prop="country">
              <el-input v-model="form.country" placeholder="请输入生产国家" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="批准文号" prop="approvalNumber">
              <el-input v-model="form.approvalNumber" placeholder="请输入批准文号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="许可证号" prop="licenseNumber">
              <el-input v-model="form.licenseNumber" placeholder="请输入许可证号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="条形码" prop="barcode">
              <el-input v-model="form.barcode" placeholder="请输入条形码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保质期" prop="shelfLife">
              <el-input-number
                v-model="form.shelfLife"
                :min="1"
                :max="360"
                placeholder="保质期（月）"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 价格信息 -->
        <el-divider content-position="left">价格信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="单价" prop="price">
              <el-input-number
                v-model="form.price"
                :min="0"
                :precision="2"
                placeholder="单价"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="零售价" prop="retailPrice">
              <el-input-number
                v-model="form.retailPrice"
                :min="0"
                :precision="2"
                placeholder="零售价"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="进货价" prop="purchasePrice">
              <el-input-number
                v-model="form.purchasePrice"
                :min="0"
                :precision="2"
                placeholder="进货价"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 特殊属性 -->
        <el-divider content-position="left">特殊属性</el-divider>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="医保覆盖">
              <el-switch v-model="form.insuranceCoverage" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="需要处方">
              <el-switch v-model="form.prescriptionRequired" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="管制药品">
              <el-switch v-model="form.controlledSubstance" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="高危药品">
              <el-switch v-model="form.highRiskMedicine" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="特殊储存">
              <el-switch v-model="form.specialStorage" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 供应商 -->
        <el-divider content-position="left">供应商信息</el-divider>
        <el-form-item label="供应商" prop="supplierId">
          <el-select
            v-model="form.supplierId"
            placeholder="请选择供应商"
            filterable
            style="width: 300px"
          >
            <el-option
              v-for="supplier in suppliers"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            />
          </el-select>
          <el-button type="primary" link @click="handleAddSupplier">
            <el-icon><Plus /></el-icon>
            添加供应商
          </el-button>
        </el-form-item>

        <!-- 医学信息 -->
        <el-divider content-position="left">医学信息</el-divider>
        <el-form-item label="药品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入药品描述"
          />
        </el-form-item>

        <el-form-item label="适应症">
          <el-tag
            v-for="(indication, index) in form.indications"
            :key="index"
            closable
            @close="removeIndication(index)"
            style="margin-right: 10px; margin-bottom: 10px"
          >
            {{ indication }}
          </el-tag>
          <el-input
            v-if="indicationInputVisible"
            ref="indicationInputRef"
            v-model="indicationInputValue"
            size="small"
            style="width: 120px"
            @keyup.enter="addIndication"
            @blur="addIndication"
          />
          <el-button v-else size="small" @click="showIndicationInput">
            <el-icon><Plus /></el-icon>
            添加适应症
          </el-button>
        </el-form-item>

        <el-form-item label="禁忌症">
          <el-tag
            v-for="(contraindication, index) in form.contraindications"
            :key="index"
            closable
            @close="removeContraindication(index)"
            style="margin-right: 10px; margin-bottom: 10px"
          >
            {{ contraindication }}
          </el-tag>
          <el-input
            v-if="contraindicationInputVisible"
            ref="contraindicationInputRef"
            v-model="contraindicationInputValue"
            size="small"
            style="width: 120px"
            @keyup.enter="addContraindication"
            @blur="addContraindication"
          />
          <el-button v-else size="small" @click="showContraindicationInput">
            <el-icon><Plus /></el-icon>
            添加禁忌症
          </el-button>
        </el-form-item>

        <el-form-item label="副作用">
          <el-tag
            v-for="(sideEffect, index) in form.sideEffects"
            :key="index"
            closable
            @close="removeSideEffect(index)"
            style="margin-right: 10px; margin-bottom: 10px"
          >
            {{ sideEffect }}
          </el-tag>
          <el-input
            v-if="sideEffectInputVisible"
            ref="sideEffectInputRef"
            v-model="sideEffectInputValue"
            size="small"
            style="width: 120px"
            @keyup.enter="addSideEffect"
            @blur="addSideEffect"
          />
          <el-button v-else size="small" @click="showSideEffectInput">
            <el-icon><Plus /></el-icon>
            添加副作用
          </el-button>
        </el-form-item>

        <el-form-item label="用法用量">
          <el-tag
            v-for="(dosage, index) in form.dosageAdministration"
            :key="index"
            closable
            @close="removeDosageAdministration(index)"
            style="margin-right: 10px; margin-bottom: 10px"
          >
            {{ dosage }}
          </el-tag>
          <el-input
            v-if="dosageInputVisible"
            ref="dosageInputRef"
            v-model="dosageInputValue"
            size="small"
            style="width: 150px"
            @keyup.enter="addDosageAdministration"
            @blur="addDosageAdministration"
          />
          <el-button v-else size="small" @click="showDosageInput">
            <el-icon><Plus /></el-icon>
            添加用法用量
          </el-button>
        </el-form-item>

        <el-form-item label="注意事项">
          <el-tag
            v-for="(precaution, index) in form.precautions"
            :key="index"
            closable
            @close="removePrecaution(index)"
            style="margin-right: 10px; margin-bottom: 10px"
          >
            {{ precaution }}
          </el-tag>
          <el-input
            v-if="precautionInputVisible"
            ref="precautionInputRef"
            v-model="precautionInputValue"
            size="small"
            style="width: 120px"
            @keyup.enter="addPrecaution"
            @blur="addPrecaution"
          />
          <el-button v-else size="small" @click="showPrecautionInput">
            <el-icon><Plus /></el-icon>
            添加注意事项
          </el-button>
        </el-form-item>

        <el-form-item label="储存条件" prop="storageConditions">
          <el-input
            v-model="form.storageConditions"
            placeholder="请输入储存条件"
          />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            {{ isEdit ? '更新' : '保存' }}
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  ArrowLeft,
  Plus
} from '@element-plus/icons-vue'
import type {
  Medicine,
  MedicineCreateForm,
  MedicineUpdateForm
} from '@/types/medicine'
import {
  getMedicine,
  createMedicine,
  updateMedicine,
  checkMedicineId,
  checkBarcode,
  getSuppliers
} from '@/api/medicines'
import {
  MEDICINE_TYPE_LABELS,
  COMMON_MEDICINE_CATEGORIES,
  COMMON_DOSAGE_FORMS
} from '@/types/medicine'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const suppliers = ref<any[]>([])

// 表单数据
const form = reactive<MedicineCreateForm>({
  genericName: '',
  tradeName: '',
  brandName: '',
  category: '',
  subcategory: '',
  type: 'PRESCRIPTION',
  dosageForm: '',
  specification: '',
  strength: '',
  manufacturer: '',
  country: '',
  approvalNumber: '',
  licenseNumber: '',
  barcode: '',
  description: '',
  indications: [],
  contraindications: [],
  sideEffects: [],
  dosageAdministration: [],
  precautions: [],
  storageConditions: '',
  shelfLife: 24,
  price: 0,
  retailPrice: 0,
  purchasePrice: 0,
  insuranceCoverage: false,
  prescriptionRequired: true,
  controlledSubstance: false,
  highRiskMedicine: false,
  specialStorage: false,
  supplierId: 0
})

// 标签输入相关
const indicationInputVisible = ref(false)
const indicationInputValue = ref('')
const indicationInputRef = ref()

const contraindicationInputVisible = ref(false)
const contraindicationInputValue = ref('')
const contraindicationInputRef = ref()

const sideEffectInputVisible = ref(false)
const sideEffectInputValue = ref('')
const sideEffectInputRef = ref()

const dosageInputVisible = ref(false)
const dosageInputValue = ref('')
const dosageInputRef = ref()

const precautionInputVisible = ref(false)
const precautionInputValue = ref('')
const precautionInputRef = ref()

// 表单验证规则
const rules: FormRules = {
  medicineId: [
    { required: true, message: '请输入药品编号', trigger: 'blur' },
    { validator: validateMedicineId, trigger: 'blur' }
  ],
  genericName: [
    { required: true, message: '请输入通用名', trigger: 'blur' }
  ],
  tradeName: [
    { required: true, message: '请输入商品名', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择药品分类', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择药品类型', trigger: 'change' }
  ],
  dosageForm: [
    { required: true, message: '请选择剂型', trigger: 'change' }
  ],
  specification: [
    { required: true, message: '请输入规格', trigger: 'blur' }
  ],
  manufacturer: [
    { required: true, message: '请输入生产厂家', trigger: 'blur' }
  ],
  approvalNumber: [
    { required: true, message: '请输入批准文号', trigger: 'blur' }
  ],
  licenseNumber: [
    { required: true, message: '请输入许可证号', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入单价', trigger: 'blur' }
  ],
  retailPrice: [
    { required: true, message: '请输入零售价', trigger: 'blur' }
  ],
  purchasePrice: [
    { required: true, message: '请输入进货价', trigger: 'blur' }
  ],
  supplierId: [
    { required: true, message: '请选择供应商', trigger: 'change' }
  ]
}

// 验证药品编号
async function validateMedicineId(rule: any, value: string, callback: any) {
  if (!value) {
    callback()
    return
  }

  try {
    const valid = await checkMedicineId(value, isEdit.value ? Number(route.params.id) : undefined)
    if (valid.data) {
      callback()
    } else {
      callback(new Error('药品编号已存在'))
    }
  } catch (error) {
    callback(new Error('验证药品编号失败'))
  }
}

// 获取供应商列表
const fetchSuppliers = async () => {
  try {
    const response = await getSuppliers()
    suppliers.value = response.data.list
  } catch (error) {
    console.error('获取供应商列表失败:', error)
  }
}

// 获取药品详情
const fetchMedicine = async (id: number) => {
  loading.value = true
  try {
    const response = await getMedicine(id)
    Object.assign(form, response.data)
  } catch (error) {
    ElMessage.error('获取药品详情失败')
    router.push('/medicines')
  } finally {
    loading.value = false
  }
}

// 处理分类变化
const handleCategoryChange = (value: string) => {
  // 可以根据分类自动填充一些子分类选项
}

// 标签管理方法
const showIndicationInput = () => {
  indicationInputVisible.value = true
  nextTick(() => {
    indicationInputRef.value?.focus()
  })
}

const addIndication = () => {
  const value = indicationInputValue.value.trim()
  if (value && !form.indications.includes(value)) {
    form.indications.push(value)
  }
  indicationInputVisible.value = false
  indicationInputValue.value = ''
}

const removeIndication = (index: number) => {
  form.indications.splice(index, 1)
}

const showContraindicationInput = () => {
  contraindicationInputVisible.value = true
  nextTick(() => {
    contraindicationInputRef.value?.focus()
  })
}

const addContraindication = () => {
  const value = contraindicationInputValue.value.trim()
  if (value && !form.contraindications.includes(value)) {
    form.contraindications.push(value)
  }
  contraindicationInputVisible.value = false
  contraindicationInputValue.value = ''
}

const removeContraindication = (index: number) => {
  form.contraindications.splice(index, 1)
}

const showSideEffectInput = () => {
  sideEffectInputVisible.value = true
  nextTick(() => {
    sideEffectInputRef.value?.focus()
  })
}

const addSideEffect = () => {
  const value = sideEffectInputValue.value.trim()
  if (value && !form.sideEffects.includes(value)) {
    form.sideEffects.push(value)
  }
  sideEffectInputVisible.value = false
  sideEffectInputValue.value = ''
}

const removeSideEffect = (index: number) => {
  form.sideEffects.splice(index, 1)
}

const showDosageInput = () => {
  dosageInputVisible.value = true
  nextTick(() => {
    dosageInputRef.value?.focus()
  })
}

const addDosageAdministration = () => {
  const value = dosageInputValue.value.trim()
  if (value && !form.dosageAdministration.includes(value)) {
    form.dosageAdministration.push(value)
  }
  dosageInputVisible.value = false
  dosageInputValue.value = ''
}

const removeDosageAdministration = (index: number) => {
  form.dosageAdministration.splice(index, 1)
}

const showPrecautionInput = () => {
  precautionInputVisible.value = true
  nextTick(() => {
    precautionInputRef.value?.focus()
  })
}

const addPrecaution = () => {
  const value = precautionInputValue.value.trim()
  if (value && !form.precautions.includes(value)) {
    form.precautions.push(value)
  }
  precautionInputVisible.value = false
  precautionInputValue.value = ''
}

const removePrecaution = (index: number) => {
  form.precautions.splice(index, 1)
}

// 添加供应商
const handleAddSupplier = () => {
  ElMessage.info('添加供应商功能开发中...')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    loading.value = true

    if (isEdit.value) {
      const updateData: MedicineUpdateForm = { ...form }
      await updateMedicine(Number(route.params.id), updateData)
      ElMessage.success('药品更新成功')
    } else {
      await createMedicine(form)
      ElMessage.success('药品创建成功')
    }

    router.push('/medicines')
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error(isEdit.value ? '药品更新失败' : '药品创建失败')
    }
  } finally {
    loading.value = false
  }
}

// 重置表单
const handleReset = () => {
  formRef.value?.resetFields()
}

// 返回
const handleBack = () => {
  router.push('/medicines')
}

// 初始化
onMounted(() => {
  fetchSuppliers()

  const id = route.params.id
  const duplicate = route.query.duplicate

  if (id && !duplicate) {
    isEdit.value = true
    fetchMedicine(Number(id))
  } else if (duplicate) {
    // 复制模式
    fetchMedicine(Number(duplicate))
  }
})
</script>

<style scoped>
.medicine-form-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-divider__text) {
  font-weight: bold;
  color: #409eff;
}
</style>