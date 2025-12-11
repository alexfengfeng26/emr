import { logAudit } from '@/utils/logger'
import { Patient } from '@/services/patient.service'
import { MedicalRecord } from '@/services/medical-record.service'
import { MedicalOrder } from '@/services/medical-order.service'
import { Examination } from '@/services/examination.service'
import { config } from '@/config'

// FHIR资源基础接口
interface FhirResource {
  resourceType: string
  id?: string
  meta?: {
    versionId?: string
    lastUpdated?: string
    profile?: string[]
  }
  language?: string
  text?: {
    status: 'generated' | 'extensions' | 'additional' | 'empty'
    div: string
  }
  contained?: any[]
  extension?: any[]
  modifierExtension?: any[]
}

// FHIR患者资源
interface FhirPatient extends FhirResource {
  resourceType: 'Patient'
  identifier: Array<{
    use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old'
    type?: {
      coding?: Array<{
        system: string
        code: string
        display: string
      }>
      text: string
    }
    system: string
    value: string
    period?: {
      start?: string
      end?: string
    }
    assigner?: {
      display?: string
    }
  }>
  active?: boolean
  name: Array<{
    use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden'
    family: string
    given?: string[]
    period?: {
      start?: string
      end?: string
    }
  }>
  telecom?: Array<{
    system: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other'
    value: string
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile'
    rank?: number
    period?: {
      start?: string
      end?: string
    }
  }>
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  deceasedBoolean?: boolean
  deceasedDateTime?: string
  address?: Array<{
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing'
    type?: 'postal' | 'physical' | 'both'
    text?: string
    line?: string[]
    city?: string
    district?: string
    state?: string
    postalCode?: string
    country?: string
    period?: {
      start?: string
      end?: string
    }
  }>
  maritalStatus?: {
    coding?: Array<{
      system: string
      code: string
      display: string
    }>
    text?: string
  }
  multipleBirthBoolean?: boolean
  multipleBirthInteger?: number
  photo?: Array<{
    contentType?: string
    language?: string
    data?: string
    url?: string
    size?: number
    hash?: string
    title?: string
    creation?: string
  }>
  contact?: Array<{
    relationship?: Array<{
      coding?: Array<{
        system: string
        code: string
        display: string
      }>
      text?: string
    }>
    name?: {
      use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden'
      family: string
      given?: string[]
      period?: {
        start?: string
        end?: string
      }
    }
    telecom?: Array<{
      system: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other'
      value: string
      use?: 'home' | 'work' | 'temp' | 'old' | 'mobile'
      rank?: number
      period?: {
        start?: string
        end?: string
      }
    }>
    address?: {
      use?: 'home' | 'work' | 'temp' | 'old' | 'billing'
      type?: 'postal' | 'physical' | 'both'
      text?: string
      line?: string[]
      city?: string
      district?: string
      state?: string
      postalCode?: string
      country?: string
      period?: {
        start?: string
        end?: string
      }
    }
    gender?: 'male' | 'female' | 'other' | 'unknown'
    organization?: {
      reference: string
      display?: string
    }
    period?: {
      start?: string
      end?: string
    }
  }>
  communication?: Array<{
    language?: {
      coding?: Array<{
        system: string
        code: string
        display: string
      }>
      text?: string
    }
    preferred?: boolean
  }>
  generalPractitioner?: Array<{
    reference: string
    display?: string
  }>
  managingOrganization?: {
    reference: string
    display?: string
  }
  link?: Array<{
    other: {
      reference: string
      display?: string
    }
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso'
  }>
}

// FHIR观察资源（检查检验结果）
interface FhirObservation extends FhirResource {
  resourceType: 'Observation'
  identifier?: Array<{
    use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old'
    type?: {
      coding?: Array<{
        system: string
        code: string
        display: string
      }>
      text: string
    }
    system: string
    value: string
    period?: {
      start?: string
      end?: string
    }
    assigner?: {
      display?: string
    }
  }>
  basedOn?: Array<{
    reference: string
    type?: string
    identifier?: {
      system?: string
      value?: string
    }
    display?: string
  }>
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown'
  category?: Array<{
    coding?: Array<{
      system: string
      code: string
      display: string
    }>
    text?: string
  }>
  code: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
    text?: string
  }
  subject?: {
    reference: string
    display?: string
  }
  focus?: Array<{
    reference: string
    display?: string
  }>
  encounter?: {
    reference: string
    display?: string
  }
  effectiveDateTime?: string
  effectivePeriod?: {
    start?: string
    end?: string
  }
  issued?: string
  performer?: Array<{
    reference: string
    display?: string
  }>
  valueQuantity?: {
    value?: number
    comparator?: '<' | '<=' | '>=' | '>'
    unit?: string
    system?: string
    code?: string
  }
  valueCodeableConcept?: {
    coding?: Array<{
      system: string
      code: string
      display: string
    }>
    text?: string
  }
  valueString?: string
  valueBoolean?: boolean
  valueInteger?: number
  valueRange?: {
    low?: {
      value?: number
      comparator?: '<' | '<=' | '>=' | '>'
      unit?: string
      system?: string
      code?: string
    }
    high?: {
      value?: number
      comparator?: '<' | '<=' | '>=' | '>'
      unit?: string
      system?: string
      code?: string
    }
  }
  valueRatio?: {
    numerator?: {
      value?: number
      comparator?: '<' | '<=' | '>=' | '>'
      unit?: string
      system?: string
      code?: string
    }
    denominator?: {
      value?: number
      comparator?: '<' | '<=' | '>=' | '>'
      unit?: string
      system?: string
      code?: string
    }
  }
  valueSampledData?: {
    origin?: {
      value?: number
      comparator?: '<' | '<=' | '>=' | '>'
      unit?: string
      system?: string
      code?: string
    }
    period?: number
    factor?: number
    lowerLimit?: number
    upperLimit?: number
    dimensions?: number
    data?: string
  }
  valueTime?: string
  valueDateTime?: string
  valuePeriod?: {
    start?: string
    end?: string
  }
  dataAbsentReason?: {
    coding?: Array<{
      system: string
      code: string
      display: string
    }>
    text?: string
  }
  interpretation?: Array<{
    coding?: Array<{
      system: string
      code: string
      display: string
    }>
    text?: string
  }>
  note?: Array<{
    author?: {
      reference: string
      display?: string
    }
    time?: string
    text: string
  }>
  bodySite?: {
    coding?: Array<{
      system: string
      code: string
      display: string
    }>
    text?: string
  }
  method?: {
    coding?: Array<{
      system: string
      code: string
      display: string
    }>
    text?: string
  }
  specimen?: {
    reference: string
    display?: string
  }
  device?: {
    reference: string
    display?: string
  }
  referenceRange?: Array<{
    low?: {
      value?: number
      comparator?: '<' | '<=' | '>=' | '>'
      unit?: string
      system?: string
      code?: string
    }
    high?: {
      value?: number
      comparator?: '<' | '<=' | '>=' | '>'
      unit?: string
      system?: string
      code?: string
    }
    type?: {
      coding?: Array<{
        system: string
        code: string
        display: string
      }>
      text?: string
    }
    appliesTo?: Array<{
      coding?: Array<{
        system: string
        code: string
        display: string
      }>
      text?: string
    }>
    age?: {
      low?: {
        value?: number
        comparator?: '<' | '<=' | '>=' | '>'
        unit?: string
        system?: string
        code?: string
      }
      high?: {
        value?: number
        comparator?: '<' | '<=' | '>=' | '>'
        unit?: string
        system?: string
        code?: string
      }
    }
    text?: string
  }>
  hasMember?: Array<{
    reference: string
    type?: string
    identifier?: {
      system?: string
      value?: string
    }
    display?: string
  }>
  derivedFrom?: Array<{
    reference: string
    type?: string
    identifier?: {
      system?: string
      value?: string
    }
    display?: string
  }>
  component?: Array<{
    code: {
      coding: Array<{
        system: string
        code: string
        display: string
      }>
      text?: string
    }
    valueQuantity?: {
      value?: number
      comparator?: '<' | '<=' | '>=' | '>'
      unit?: string
      system?: string
      code?: string
    }
    valueCodeableConcept?: {
      coding?: Array<{
        system: string
        code: string
        display: string
      }>
      text?: string
    }
    valueString?: string
    valueBoolean?: boolean
    valueInteger?: number
    valueRange?: {
      low?: {
        value?: number
        comparator?: '<' | '<=' | '>=' | '>'
        unit?: string
        system?: string
        code?: string
      }
      high?: {
        value?: number
        comparator?: '<' | '<=' | '>=' | '>'
        unit?: string
        system?: string
        code?: string
      }
    }
    valueRatio?: {
      numerator?: {
        value?: number
        comparator?: '<' | '<=' | '>=' | '>'
        unit?: string
        system?: string
        code?: string
      }
      denominator?: {
        value?: number
        comparator?: '<' | '<=' | '>=' | '>'
        unit?: string
        system?: string
        code?: string
      }
    }
    valueSampledData?: {
      origin?: {
        value?: number
        comparator?: '<' | '<=' | '>=' | '>'
        unit?: string
        system?: string
        code?: string
      }
      period?: number
      factor?: number
      lowerLimit?: number
      upperLimit?: number
      dimensions?: number
      data?: string
    }
    valueTime?: string
    valueDateTime?: string
    valuePeriod?: {
      start?: string
      end?: string
    }
    dataAbsentReason?: {
      coding?: Array<{
        system: string
        code: string
        display: string
      }>
      text?: string
    }
    interpretation?: Array<{
      coding?: Array<{
        system: string
        code: string
        display: string
      }>
      text?: string
    }>
    referenceRange?: Array<{
      low?: {
        value?: number
        comparator?: '<' | '<=' | '>=' | '>'
        unit?: string
        system?: string
        code?: string
      }
      high?: {
        value?: number
        comparator?: '<' | '<=' | '>=' | '>'
        unit?: string
        system?: string
        code?: string
      }
      type?: {
        coding?: Array<{
          system: string
          code: string
          display: string
        }>
        text?: string
      }
      appliesTo?: Array<{
        coding?: Array<{
          system: string
          code: string
          display: string
        }>
        text?: string
      }>
      age?: {
        low?: {
          value?: number
          comparator?: '<' | '<=' | '>=' | '>'
          unit?: string
          system?: string
          code?: string
        }
        high?: {
          value?: number
          comparator?: '<' | '<=' | '>=' | '>'
          unit?: string
          system?: string
          code?: string
        }
      }
      text?: string
    }>
  }>
}

export class FhirService {
  // 转换患者数据为FHIR Patient资源
  static patientToFhir(patient: any): FhirPatient {
    const fhirPatient: FhirPatient = {
      resourceType: 'Patient',
      identifier: [],
      name: [{
        family: patient.name,
        given: []
      }],
      gender: this.convertGender(patient.gender),
      birthDate: patient.birthDate ? patient.birthDate.split('T')[0] : undefined,
      active: patient.status === 'ACTIVE'
    }

    // 添加身份证标识
    if (patient.idCard) {
      fhirPatient.identifier.push({
        system: 'http://hl7.org/fhir/sid/cn-id',
        value: patient.idCard,
        use: 'official',
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'NNC',
            display: 'National Unique Citizen ID Number'
          }],
          text: '身份证号'
        }
      })
    }

    // 添加手机号
    if (patient.phone) {
      fhirPatient.telecom = [{
        system: 'phone',
        value: patient.phone,
        use: 'mobile'
      }]
    }

    // 添加地址
    if (patient.address) {
      fhirPatient.address = [{
        use: 'home',
        text: patient.address,
        line: [patient.address]
      }]
    }

    // 添加紧急联系人
    if (patient.emergencyContact) {
      fhirPatient.contact = [{
        name: {
          family: patient.emergencyContact
        }
      }]

      if (patient.emergencyPhone) {
        fhirPatient.contact[0].telecom = [{
          system: 'phone',
          value: patient.emergencyPhone
        }]
      }
    }

    return fhirPatient
  }

  // 转换FHIR Patient资源为患者数据
  static fhirToPatient(fhirPatient: FhirPatient): any {
    const patient: any = {
      name: fhirPatient.name?.[0]?.family || '',
      gender: this.convertFhirGender(fhirPatient.gender),
      active: fhirPatient.active
    }

    // 解析出生日期
    if (fhirPatient.birthDate) {
      patient.birthDate = fhirPatient.birthDate
    }

    // 解析身份证号
    const idCardIdentifier = fhirPatient.identifier?.find(id =>
      id.system === 'http://hl7.org/fhir/sid/cn-id'
    )
    if (idCardIdentifier) {
      patient.idCard = idCardIdentifier.value
    }

    // 解析手机号
    const mobilePhone = fhirPatient.telecom?.find(tel =>
      tel.system === 'phone' && tel.use === 'mobile'
    )
    if (mobilePhone) {
      patient.phone = mobilePhone.value
    }

    // 解析地址
    if (fhirPatient.address?.[0]) {
      patient.address = fhirPatient.address[0].text || fhirPatient.address[0].line?.[0]
    }

    // 解析紧急联系人
    if (fhirPatient.contact?.[0]) {
      patient.emergencyContact = fhirPatient.contact[0].name?.family
      const emergencyPhone = fhirPatient.contact[0].telecom?.[0]
      if (emergencyPhone) {
        patient.emergencyPhone = emergencyPhone.value
      }
    }

    return patient
  }

  // 转换检查检验结果为FHIR Observation资源
  static examinationToFhirObservation(examination: any): FhirObservation {
    const fhirObservation: FhirObservation = {
      resourceType: 'Observation',
      status: this.convertExaminationStatus(examination.status),
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: this.mapExaminationTypeToObservationCategory(examination.examType),
          display: this.getExaminationTypeDisplay(examination.examType)
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: this.getLoincCode(examination.examType),
          display: examination.examName
        }],
        text: examination.examName
      },
      subject: {
        reference: `Patient/${examination.patientId}`,
        display: examination.patient?.name
      },
      effectiveDateTime: examination.createdAt
    }

    // 添加执行者
    if (examination.reporter) {
      fhirObservation.performer = [{
        reference: `Practitioner/${examination.reporterId}`,
        display: examination.reporter.name
      }]
    }

    // 添加结果
    if (examination.result) {
      fhirObservation.valueString = examination.result
    }

    // 添加报告时间
    if (examination.reportedAt) {
      fhirObservation.issued = examination.reportedAt
    }

    // 添加备注
    if (examination.notes) {
      fhirObservation.note = [{
        text: examination.notes
      }]
    }

    return fhirObservation
  }

  // 创建FHIR资源包
  static createBundle(resources: FhirResource[], type: 'collection' | 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'vread' = 'collection'): any {
    return {
      resourceType: 'Bundle',
      id: this.generateUUID(),
      type,
      timestamp: new Date().toISOString(),
      entry: resources.map(resource => ({
        fullUrl: `${config.fhirServerUrl}/${resource.resourceType}/${resource.id}`,
        resource,
        search: {
          mode: 'match'
        }
      }))
    }
  }

  // 生成唯一ID
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // 转换性别
  private static convertGender(gender: string): 'male' | 'female' | 'other' | 'unknown' {
    switch (gender) {
      case 'MALE': return 'male'
      case 'FEMALE': return 'female'
      default: return 'unknown'
    }
  }

  // 转换FHIR性别
  private static convertFhirGender(gender?: 'male' | 'female' | 'other' | 'unknown'): string {
    switch (gender) {
      case 'male': return 'MALE'
      case 'female': return 'FEMALE'
      default: return 'OTHER'
    }
  }

  // 转换检查检验状态
  private static convertExaminationStatus(status: string): 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown' {
    switch (status) {
      case 'PENDING': return 'registered'
      case 'IN_PROGRESS': return 'preliminary'
      case 'COMPLETED': return 'final'
      case 'CANCELLED': return 'cancelled'
      default: return 'unknown'
    }
  }

  // 映射检查类型到观察分类
  private static mapExaminationTypeToObservationCategory(examType: string): string {
    switch (examType) {
      case 'LABORATORY': return 'laboratory'
      case 'RADIOLOGY': return 'imaging'
      case 'PATHOLOGY': return 'laboratory'
      case 'FUNCTION': return 'vital-signs'
      case 'ENDOSCOPY': return 'imaging'
      case 'ULTRASOUND': return 'imaging'
      case 'ECG': return 'vital-signs'
      case 'EEG': return 'vital-signs'
      default: return 'laboratory'
    }
  }

  // 获取检查类型显示名称
  private static getExaminationTypeDisplay(examType: string): string {
    switch (examType) {
      case 'LABORATORY': return '实验室检查'
      case 'RADIOLOGY': return '影像检查'
      case 'PATHOLOGY': return '病理检查'
      case 'FUNCTION': return '功能检查'
      case 'ENDOSCOPY': return '内镜检查'
      case 'ULTRASOUND': return '超声检查'
      case 'ECG': return '心电图'
      case 'EEG': return '脑电图'
      default: return '检查检验'
    }
  }

  // 获取LOINC代码
  private static getLoincCode(examType: string): string {
    const loincCodes: Record<string, string> = {
      'LABORATORY': '26436-6',
      'RADIOLOGY': '39110-0',
      'PATHOLOGY': '11502-2',
      'FUNCTION': '85354-9',
      'ENDOSCOPY': '24159-1',
      'ULTRASOUND': '43324-1',
      'ECG': '69430-6',
      'EEG': '42410-2'
    }
    return loincCodes[examType] || 'LP208915-4'
  }

  // 验证FHIR资源
  static validateFhirResource(resource: FhirResource): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 基础验证
    if (!resource.resourceType) {
      errors.push('resourceType is required')
    }

    if (!resource.id && resource.resourceType !== 'Bundle') {
      errors.push('id is required')
    }

    // 资源类型特定验证
    switch (resource.resourceType) {
      case 'Patient':
        const patient = resource as FhirPatient
        if (!patient.name || patient.name.length === 0) {
          errors.push('Patient must have at least one name')
        }
        break

      case 'Observation':
        const observation = resource as FhirObservation
        if (!observation.code) {
          errors.push('Observation must have a code')
        }
        if (!observation.status) {
          errors.push('Observation must have a status')
        }
        break
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 生成FHIR CapabilityStatement
  static generateCapabilityStatement(): any {
    return {
      resourceType: 'CapabilityStatement',
      status: 'active',
      date: new Date().toISOString(),
      kind: 'instance',
      implementation: {
        description: '电子病历系统 FHIR 服务器',
        url: config.fhirServerUrl
      },
      fhirVersion: '4.0.1',
      format: ['application/fhir+json', 'application/fhir+xml'],
      rest: [{
        mode: 'server',
        security: {
          cors: true,
          service: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/restful-security-service',
              code: 'OAuth',
              display: 'OAuth'
            }],
            text: 'OAuth2 令牌认证'
          }]
        },
        resource: [
          {
            type: 'Patient',
            interaction: ['read', 'search-type', 'create', 'update'],
            searchParam: [
              { name: 'identifier', type: 'token' },
              { name: 'name', type: 'string' },
              { name: 'gender', type: 'token' },
              { name: 'birthdate', type: 'date' }
            ]
          },
          {
            type: 'Observation',
            interaction: ['read', 'search-type', 'create'],
            searchParam: [
              { name: 'patient', type: 'reference' },
              { name: 'code', type: 'token' },
              { name: 'category', type: 'token' },
              { name: 'date', type: 'date' }
            ]
          },
          {
            type: 'Practitioner',
            interaction: ['read', 'search-type'],
            searchParam: [
              { name: 'name', type: 'string' },
              { name: 'identifier', type: 'token' }
            ]
          }
        ]
      }]
    }
  }

  // 同步数据到FHIR服务器
  static async syncToFhirServer(resource: FhirResource): Promise<{ success: boolean; error?: string }> {
    if (!config.fhirServerUrl) {
      return { success: false, error: 'FHIR服务器URL未配置' }
    }

    try {
      const url = `${config.fhirServerUrl}/${resource.resourceType}${resource.id ? `/${resource.id}` : ''}`
      const method = resource.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/fhir+json',
          'Authorization': `Bearer ${process.env.FHIR_AUTH_TOKEN}`
        },
        body: JSON.stringify(resource)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`FHIR服务器响应错误: ${response.status} ${errorText}`)
      }

      const result = await response.json()

      // 记录审计日志
      logAudit('FHIR_SYNC', 0, {
        resourceType: resource.resourceType,
        resourceId: result.id || resource.id,
        operation: method
      })

      return { success: true }
    } catch (error) {
      console.error('FHIR同步失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  }

  // 从FHIR服务器获取数据
  static async getFromFhirServer(resourceType: string, id?: string, searchParams?: Record<string, string>): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!config.fhirServerUrl) {
      return { success: false, error: 'FHIR服务器URL未配置' }
    }

    try {
      let url = `${config.fhirServerUrl}/${resourceType}`
      if (id) {
        url += `/${id}`
      } else if (searchParams) {
        const params = new URLSearchParams(searchParams).toString()
        url += `?${params}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.FHIR_AUTH_TOKEN}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`FHIR服务器响应错误: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('从FHIR服务器获取数据失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  }
}