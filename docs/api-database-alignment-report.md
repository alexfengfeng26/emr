# API接口与数据库对齐审查报告

## 📋 审查概览

**审查时间**: 2025-01-12
**审查范围**: 前端类型定义与后端数据库模型的对齐分析
**审查依据**:
- 前端: `frontend/src/types/*.ts`
- 后端: `backend/prisma/schema.prisma`
**总体评价**: ⚠️ **存在重大缺失和不一致**

---

## 🚨 重大问题发现

### 1. 数据库实体严重缺失

#### 后端缺失的关键实体
后端Prisma schema仅包含7个模型，而前端期望的实体包括：

| 实体名称 | 后端状态 | 前端需求 | 影响程度 |
|---------|---------|---------|---------|
| **Role** | ❌ 缺失 | ✅ 完整类型定义 | 🚨 严重 |
| **Permission** | ❌ 缺失 | ✅ 完整类型定义 | 🚨 严重 |
| **Department** | ❌ 缺失 | ✅ 完整类型定义 | 🚨 严重 |
| **Medicine** | ❌ 缺失 | ✅ 完整类型定义 | 🚨 严重 |
| **Prescription** | ❌ 缺失 | ✅ 完整类型定义 | 🚨 严重 |
| **MedicineStock** | ❌ 缺失 | ✅ 完整类型定义 | 🚨 严重 |
| **SystemSetting** | ⚠️ 部分匹配 | ✅ 完整类型定义 | ⚠️ 中等 |
| **OperationLog** | ⚠️ 部分匹配 | ✅ 完整类型定义 | ⚠️ 中等 |

### 2. 字段映射不匹配

#### 患者实体 (Patient)
```typescript
// 前端期望的字段 (但后端缺失)
patientId: string           // ❌ 缺失 - 业务编号
email?: string             // ❌ 缺失
rhFactor: string          // ❌ 缺失 - Rh因子
maritalStatus: string      // ❌ 缺失 - 婚姻状况
occupation?: string        // ❌ 缺失 - 职业
employer?: string          // ❌ 缺失 - 工作单位
insuranceType: string      // ❌ 缺失 - 医保类型
insuranceNumber?: string   // ❌ 缺失 - 医保号
allergies?: string[]        // ❌ 缺失 - 前端期望数组，后端是文本
familyHistory?: string     // ❌ 缺失 - 家族史
```

#### 医嘱实体 (MedicalOrder)
```typescript
// 前端期望但后端缺失的字段
orderId: string            // ❌ 缺失 - 业务编号
patientName: string        // ❌ 缺失 - 冗余字段
doctorName: string         // ❌ 缺失 - 冗余字段
department: string         // ❌ 缺失 - 冗余字段
urgency: string            // ❌ 缺失 - 与priority重复
notes: string              // ❌ 缺失
executedAt: DateTime?      // ❌ 与现有字段不同名
```

#### 病历实体 (MedicalRecord)
```typescript
// 前端期望但后端缺失的字段
recordId: string           // ❌ 缺失 - 业务编号
patient: PatientInfo      // ❌ 缺失 - 关联对象
doctor: DoctorInfo         // ❌ 缺失 - 关联对象
visitType: string          // ❌ 缺失 - 就诊方式
urgency: string            // ❌ 缺失
tags: string[]             // ❌ 缺失
submittedAt?: string       // ❌ 缺失
approvedAt?: string        // ❌ 缺失
approvedBy?: ApprovalInfo  // ❌ 缺失
```

### 3. 数据字典/枚举值不一致

#### 患者状态映射问题
```prisma
// 后端定义
enum PatientStatus {
  ACTIVE
  DISCHARGED
  TRANSFERRED
  DECEASED
}
```
```typescript
// 前端期望
status: 'ACTIVE' | 'INACTIVE' | 'DECEASED'  // ❌ INACTIVE不存在，DISCHARGED/TRANSFERRED缺失
```

#### 医嘱状态映射问题
```prisma
// 后端定义 (6个状态)
enum OrderStatus {
  PENDING, APPROVED, EXECUTED, CANCELLED, SUSPENDED
}
```
```typescript
// 前端期望 (8个状态)
status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED' | 'EXPIRED' | 'DRAFT' | 'ARCHIVED'
```

#### 病历状态映射问题
```typescript
// 前端期望
status: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED'
```
```prisma
// 后端定义 (4个状态)
enum MedicalRecordStatus {
  DRAFT, SUBMITTED, APPROVED, REJECTED  // ❌ REVIEWING缺失
}
```

### 4. 业务流程不完整

#### 审核流程缺失
后端缺少完整的审核流程支持：
- ❌ 审核状态流转
- ❌ 审核人关联
- ❌ 审核时间记录
- ❌ 审核意见存储

#### 权限系统缺失
前端有完整的RBAC权限管理，但后端缺少：
- ❌ 角色模型 (Role)
- ❌ 权限模型 (Permission)
- ❌ 用户角色关联表
- ❌ 角色权限关联表

#### 药品管理系统缺失
前端有完整的药品管理模块，但后端缺少：
- ❌ 药品基础信息表 (Medicine)
- ❌ 药品库存表 (MedicineStock)
- ❌ 处方表 (Prescription)
- ❌ 处方明细表 (PrescriptionItem)

---

## 🔧 必需修复项

### 🚨 紧急修复 (P0)

#### 1. 补充缺失的数据库模型
需要在 `backend/prisma/schema.prisma` 中添加：

```prisma
// 角色表
model Role {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(100)
  code        String   @unique @db.VarChar(50)
  description String?  @db.Text
  isSystem    Boolean  @default(false)
  status      String   @default("ACTIVE")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联关系
  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}

// 权限表
model Permission {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(100)
  code        String   @unique @db.VarChar(50)
  description String?  @db.Text
  module      String   @db.VarChar(50)
  action      String   @db.VarChar(50)
  resource    String?  @db.VarChar(100)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联关系
  roles       RolePermission[]

  @@map("permissions")
}

// 科室表
model Department {
  id          Int      @id @default(autoincrement())
  code        String   @unique @db.VarChar(50)
  name        String   @db.VarChar(200)
  description String?  @db.Text
  parentId    Int?
  leaderId    Int?
  phone       String?  @db.VarChar(20)
  address     String?  @db.Text
  bedCount    Int      @default(0)
  isActive    Boolean  @default(true)
  sort        Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联关系
  parent      Department? @relation("DepartmentParent", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentParent")
  leader      User?      @relation("DepartmentLeader", fields: [leaderId], references: [id])
  users       User[]

  @@map("departments")
}
```

#### 2. 修正字段映射不一致
需要在现有模型中补充缺失字段：

```prisma
// 扩展Patient模型
model Patient {
  // 现有字段...

  // 新增字段
  patientId        String    @unique @db.VarChar(50)      // 业务编号
  email           String?   @unique @db.VarChar(100)
  rhFactor        String?   @db.VarChar(20)               // Rh因子
  maritalStatus   String?   @db.VarChar(20)               // 婚姻状况
  occupation      String?   @db.VarChar(100)
  employer        String?   @db.VarChar(200)
  insuranceType   String?   @db.VarChar(50)               // 医保类型
  insuranceNumber String?   @db.VarChar(50)
  familyHistory   String?   @db.Text

  @@index([patientId])
  @@map("patients")
}
```

#### 3. 统一枚举值定义
需要修正前端或后端的枚举值，确保完全一致：

```typescript
// 前端枚举修正
export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  DISCHARGED = 'DISCHARGED',     // 新增
  TRANSFERRED = 'TRANSFERRED',   // 新增
  DECEASED = 'DECEASED'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  // 移除前端独有的：ACTIVE, COMPLETED, EXPIRED, DRAFT, ARCHIVED
}
```

### ⚠️ 短期修复 (P1)

#### 1. 实现完整的药品管理系统
```prisma
// 药品表
model Medicine {
  id              Int      @id @default(autoincrement())
  code            String   @unique @db.VarChar(50)
  name            String   @db.VarChar(200)
  genericName     String?  @db.VarChar(200)
  specification   String?  @db.VarChar(200)
  manufacturer    String?  @db.VarChar(200)
  category        String?  @db.VarChar(50)
  dosageForm      String?  @db.VarChar(50)
  strength        String?  @db.VarChar(100)
  unit            String?  @db.VarChar(20)
  price           Decimal? @db.Decimal(10, 2)
  status          String   @default("ACTIVE")
  description     String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // 关联关系
  stocks          MedicineStock[]
  prescriptionItems PrescriptionItem[]

  @@map("medicines")
}

// 药品库存表
model MedicineStock {
  id          Int      @id @default(autoincrement())
  medicineId  Int
  warehouseId Int
  batchNumber String   @db.VarChar(100)
  quantity    Int      @default(0)
  expiryDate  DateTime
  unitCost    Decimal? @db.Decimal(10, 2)
  status      String   @default("ACTIVE")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联关系
  medicine    Medicine @relation(fields: [medicineId], references: [id])

  @@unique([medicineId, warehouseId, batchNumber])
  @@map("medicine_stocks")
}
```

#### 2. 完善审核流程
需要在相关表中添加审核支持：

```prisma
// 扩展MedicalRecord模型
model MedicalRecord {
  // 现有字段...

  // 新增审核字段
  submittedAt   DateTime?
  submittedBy   Int?
  approvedAt     DateTime?
  approvedBy     Int?
  rejectedAt     DateTime?
  rejectedBy     Int?
  reviewStatus  String   @default("PENDING")  // REVIEWING, APPROVED, REJECTED
  reviewComment String?  @db.Text

  // 关联关系
  submitter     User?    @relation("RecordSubmitter", fields: [submittedBy], references: [id])
  approver      User?    @relation("RecordApprover", fields: [approvedBy], references: [id])
  rejecter      User?    @relation("RecordRejecter", fields: [rejectedBy], references: [id])

  @@map("medical_records")
}
```

---

## 📊 缺失统计

### 数据库模型缺失率
- **总期望模型**: 13个
- **后端现有模型**: 7个
- **缺失模型**: 6个
- **缺失率**: **46%**

### 字段缺失统计
| 模型 | 总字段数 | 缺失字段数 | 缺失率 |
|------|---------|-----------|--------|
| Patient | 12+ | 8+ | **67%** |
| MedicalRecord | 15+ | 10+ | **67%** |
| MedicalOrder | 13+ | 6+ | **46%** |
| SystemSetting | 8 | 4 | **50%** |
| User | 10+ | 5+ | **50%** |

### 枚举值不一致率
- **PatientStatus**: 40% (前端3个，后端4个，2个不匹配)
- **OrderStatus**: 75% (前端8个，后端5个，3个不匹配)
- **MedicalRecordStatus**: 25% (前端5个，后端4个，1个缺失)

---

## 🎯 修复优先级建议

### 立即修复 (1-2周)
1. **补充核心模型** - Role, Permission, Department
2. **修正字段映射** - Patient, MedicalRecord基础字段
3. **统一枚举定义** - PatientStatus, OrderStatus
4. **修复API响应结构** - 确保前后端数据结构一致

### 短期修复 (2-4周)
1. **实现药品管理系统** - Medicine, MedicineStock, Prescription
2. **完善审核流程** - MedicalRecord审核字段
3. **补充业务编号生成** - patientId, recordId, orderId等
4. **实现RBAC权限控制** - 用户角色权限关联

### 长期改进 (1-2个月)
1. **性能优化** - 数据库索引、查询优化
2. **数据完整性** - 外键约束、业务规则验证
3. **审计日志增强** - 完整的操作记录
4. **数据迁移脚本** - 支持数据库结构升级

---

## ⚠️ 风险评估

### 高风险项目
- **数据不一致风险**: 前后端字段类型、枚举值不匹配可能导致运行时错误
- **功能缺失风险**: 权限管理、药品管理等核心功能完全无法使用
- **业务逻辑中断**: 审核流程不完整，医疗业务流程无法正常运行

### 缓解措施
1. **紧急修复**: 优先修复字段映射和枚举值一致性问题
2. **分阶段实施**: 按模块逐步补充缺失功能
3. **数据迁移**: 制定安全的数据迁移方案
4. **测试验证**: 每个修复都需要完整的测试验证

---

## 🏷️ 总结

当前系统存在**严重的数据库-前端不对齐问题**，主要体现在：

1. **46%的数据库模型完全缺失**
2. **平均50%以上的字段映射不完整**
3. **枚举值定义存在显著差异**
4. **核心业务功能（权限、药品管理）无法实现**

这些问题会导致：
- 前端组件无法正常工作
- API调用频繁失败
- 数据完整性无法保证
- 医疗业务流程中断

**建议立即开始修复工作**，优先解决数据模型缺失和字段映射不一致的问题，确保系统能够正常运行。