import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库数据...')

  // 1. 创建基础权限
  console.log('创建权限数据...')
  await prisma.permission.createMany({
    data: [
      // 系统管理权限
      { name: '系统设置', code: 'system:settings', module: 'system', action: 'read', type: 'MENU', sort: 1 },
      { name: '用户管理', code: 'system:users', module: 'system', action: 'read', type: 'MENU', sort: 2 },
      { name: '角色管理', code: 'system:roles', module: 'system', action: 'read', type: 'MENU', sort: 3 },
      { name: '科室管理', code: 'system:departments', module: 'system', action: 'read', type: 'MENU', sort: 4 },
      { name: '操作日志', code: 'system:logs', module: 'system', action: 'read', type: 'MENU', sort: 5 },

      // 患者管理权限
      { name: '患者管理', code: 'patients', module: 'patients', action: 'read', type: 'MENU', sort: 10 },
      { name: '新增患者', code: 'patients:create', module: 'patients', action: 'create', type: 'BUTTON', sort: 11 },
      { name: '编辑患者', code: 'patients:update', module: 'patients', action: 'update', type: 'BUTTON', sort: 12 },

      // 病历管理权限
      { name: '病历管理', code: 'medical-records', module: 'medical-records', action: 'read', type: 'MENU', sort: 20 },
      { name: '新增病历', code: 'medical-records:create', module: 'medical-records', action: 'create', type: 'BUTTON', sort: 21 },
      { name: '审核病历', code: 'medical-records:approve', module: 'medical-records', action: 'approve', type: 'BUTTON', sort: 23 },

      // 医嘱管理权限
      { name: '医嘱管理', code: 'medical-orders', module: 'medical-orders', action: 'read', type: 'MENU', sort: 30 },
      { name: '新增医嘱', code: 'medical-orders:create', module: 'medical-orders', action: 'create', type: 'BUTTON', sort: 31 },

      // 药品管理权限
      { name: '药品管理', code: 'medicines', module: 'medicines', action: 'read', type: 'MENU', sort: 40 },
      { name: '处方管理', code: 'prescriptions', module: 'prescriptions', action: 'read', type: 'MENU', sort: 41 },
    ],
    skipDuplicates: true
  })

  // 2. 创建基础角色
  console.log('创建角色数据...')
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      name: '系统管理员',
      code: 'ADMIN',
      description: '拥有所有权限的系统管理员',
      isSystem: true,
      status: 'ACTIVE',
    }
  })

  const doctorRole = await prisma.role.upsert({
    where: { code: 'DOCTOR' },
    update: {},
    create: {
      name: '医生',
      code: 'DOCTOR',
      description: '医生角色，可以处理患者、病历、医嘱等',
      isSystem: true,
      status: 'ACTIVE',
    }
  })

  const nurseRole = await prisma.role.upsert({
    where: { code: 'NURSE' },
    update: {},
    create: {
      name: '护士',
      code: 'NURSE',
      description: '护士角色，可以执行医嘱、查看病历等',
      isSystem: true,
      status: 'ACTIVE',
    }
  })

  // 3. 为角色分配权限
  console.log('分配角色权限...')
  const allPermissions = await prisma.permission.findMany()
  const adminPermissions = allPermissions.map(p => ({
    roleId: adminRole.id,
    permissionId: p.id
  }))

  const doctorPermissions = allPermissions
    .filter(p => p.module !== 'system')
    .map(p => ({
      roleId: doctorRole.id,
      permissionId: p.id
    }))

  const nursePermissions = allPermissions
    .filter(p => !p.code.includes('create') && p.code !== 'system:settings')
    .map(p => ({
      roleId: nurseRole.id,
      permissionId: p.id
    }))

  await prisma.rolePermission.createMany({ data: adminPermissions, skipDuplicates: true })
  await prisma.rolePermission.createMany({ data: doctorPermissions, skipDuplicates: true })
  await prisma.rolePermission.createMany({ data: nursePermissions, skipDuplicates: true })

  // 4. 创建基础科室
  console.log('创建科室数据...')
  const internalDept = await prisma.department.upsert({
    where: { code: 'INTERNAL' },
    update: {},
    create: {
      code: 'INTERNAL',
      name: '内科',
      type: 'CLINICAL',
      level: 1,
      sort: 1,
      phone: '010-12345678',
      location: '门诊楼1楼',
      bedCount: 50,
      isActive: true,
    }
  })

  const surgeryDept = await prisma.department.upsert({
    where: { code: 'SURGERY' },
    update: {},
    create: {
      code: 'SURGERY',
      name: '外科',
      type: 'CLINICAL',
      level: 1,
      sort: 2,
      phone: '010-12345679',
      location: '门诊楼1楼',
      bedCount: 40,
      isActive: true,
    }
  })

  // 5. 创建用户
  console.log('创建用户数据...')
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      userId: 'U202501120001',
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      email: 'admin@hospital.com',
      phone: '13800138000',
      position: '系统管理员',
      title: '高级工程师',
      status: 'ACTIVE',
      departmentId: internalDept.id,
    }
  })

  const doctorUser = await prisma.user.upsert({
    where: { username: 'doctor001' },
    update: {},
    create: {
      userId: 'U202501120002',
      username: 'doctor001',
      password: await bcrypt.hash('doctor123', 12),
      realName: '张医生',
      email: 'doctor001@hospital.com',
      phone: '13800138001',
      position: '主治医师',
      title: '主治医师',
      status: 'ACTIVE',
      departmentId: internalDept.id,
    }
  })

  // 为用户分配角色
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id }
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: doctorUser.id, roleId: doctorRole.id } },
    update: {},
    create: { userId: doctorUser.id, roleId: doctorRole.id }
  })

  // 6. 创建系统设置
  console.log('创建系统设置数据...')
  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'system.name',
        value: 'EMR电子病历系统',
        description: '系统名称',
        type: 'STRING',
        category: 'basic',
        isPublic: true,
        isEditable: true,
        sort: 1
      },
      {
        key: 'system.version',
        value: '1.0.0',
        description: '系统版本',
        type: 'STRING',
        category: 'basic',
        isPublic: true,
        isEditable: false,
        sort: 2
      },
    ],
    skipDuplicates: true
  })

  // 7. 创建示例患者
  console.log('创建示例患者数据...')
  const patient1 = await prisma.patient.upsert({
    where: { patientId: 'P202501120001' },
    update: {},
    create: {
      patientId: 'P202501120001',
      name: '张三',
      gender: 'MALE',
      birthDate: new Date('1985-05-15'),
      idCard: '110101198505150001',
      phone: '13900139001',
      address: '北京市朝阳区示例街道123号',
      emergencyContact: '张父',
      emergencyPhone: '13900139002',
      bloodType: 'A',
      allergies: '青霉素过敏',
      medicalHistory: '高血压病史5年，定期服药控制',
      status: 'ACTIVE',
    }
  })

  const patient2 = await prisma.patient.upsert({
    where: { patientId: 'P202501120002' },
    update: {},
    create: {
      patientId: 'P202501120002',
      name: '李四',
      gender: 'FEMALE',
      birthDate: new Date('1990-08-20'),
      idCard: '110101199008200002',
      phone: '13900139003',
      address: '北京市海淀区示例路456号',
      emergencyContact: '李母',
      emergencyPhone: '13900139004',
      bloodType: 'O',
      status: 'ACTIVE',
    }
  })

  console.log('数据库初始化完成！')
  console.log('默认登录账户：')
  console.log('管理员: admin / admin123')
  console.log('医生: doctor001 / doctor123')
}

main()
  .catch((e) => {
    console.error('数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })