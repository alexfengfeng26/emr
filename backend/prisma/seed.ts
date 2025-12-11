import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库数据...')

  // 清理现有数据（可选）
  // await prisma.auditLog.deleteMany()
  // await prisma.examination.deleteMany()
  // await prisma.medicalOrder.deleteMany()
  // await prisma.medicalRecord.deleteMany()
  // await prisma.patient.deleteMany()
  // await prisma.user.deleteMany()
  // await prisma.systemConfig.deleteMany()

  // 创建系统配置
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'hospital_name',
        value: '示例医院',
        description: '医院名称'
      },
      {
        key: 'system_version',
        value: '1.0.0',
        description: '系统版本'
      },
      {
        key: 'max_file_size',
        value: '10485760',
        description: '最大文件上传大小（字节）'
      },
      {
        key: 'enable_audit_log',
        value: 'true',
        description: '是否启用审计日志'
      },
      {
        key: 'default_page_size',
        value: '20',
        description: '默认分页大小'
      }
    ],
    skipDuplicates: true
  })

  console.log('系统配置创建完成')

  // 创建默认用户
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hospital.com',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      department: '信息科',
      phone: '13800138000'
    }
  })

  const doctorUser = await prisma.user.upsert({
    where: { username: 'doctor001' },
    update: {},
    create: {
      username: 'doctor001',
      email: 'doctor001@hospital.com',
      password: await bcrypt.hash('doctor123', 12),
      name: '张医生',
      role: 'DOCTOR',
      department: '内科',
      phone: '13800138001'
    }
  })

  const nurseUser = await prisma.user.upsert({
    where: { username: 'nurse001' },
    update: {},
    create: {
      username: 'nurse001',
      email: 'nurse001@hospital.com',
      password: await bcrypt.hash('nurse123', 12),
      name: '李护士',
      role: 'NURSE',
      department: '内科',
      phone: '13800138002'
    }
  })

  console.log('默认用户创建完成')

  // 创建示例患者
  const patient1 = await prisma.patient.upsert({
    where: { idCard: '110101198505150001' },
    update: {},
    create: {
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
      medicalHistory: '高血压病史5年，定期服药控制'
    }
  })

  const patient2 = await prisma.patient.upsert({
    where: { idCard: '110101199008200002' },
    update: {},
    create: {
      name: '李四',
      gender: 'FEMALE',
      birthDate: new Date('1990-08-20'),
      idCard: '110101199008200002',
      phone: '13900139003',
      address: '北京市海淀区示例路456号',
      emergencyContact: '李母',
      emergencyPhone: '13900139004',
      bloodType: 'O',
      allergies: '无已知药物过敏史'
    }
  })

  const patient3 = await prisma.patient.upsert({
    where: { idCard: '110101197812100003' },
    update: {},
    create: {
      name: '王五',
      gender: 'MALE',
      birthDate: new Date('1978-12-10'),
      idCard: '110101197812100003',
      phone: '13900139005',
      address: '北京市西城区示例胡同789号',
      emergencyContact: '王妻',
      emergencyPhone: '13900139006',
      bloodType: 'B',
      medicalHistory: '糖尿病史3年，2型糖尿病'
    }
  })

  console.log('示例患者创建完成')

  // 创建示例病历
  const record1 = await prisma.medicalRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: doctorUser.id,
      type: 'OUTPATIENT',
      title: '高血压复查',
      content: '患者因高血压前来复查，血压145/95mmHg，较上次略有升高。',
      diagnosis: '原发性高血压',
      treatment: '继续服用降压药物，建议低盐饮食，适量运动。',
      prescription: '1. 硝苯地平缓释片 30mg 每日一次\n2. 建议监测血压每日早晚各一次',
      version: 1,
      status: 'SUBMITTED'
    }
  })

  const record2 = await prisma.medicalRecord.create({
    data: {
      patientId: patient2.id,
      doctorId: doctorUser.id,
      type: 'OUTPATIENT',
      title: '感冒就诊',
      content: '患者因咳嗽、流涕、发热2天前来就诊。',
      diagnosis: '急性上呼吸道感染',
      treatment: '对症治疗，多休息，多饮水。',
      prescription: '1. 布洛芬缓释胶囊 0.3g 每日两次\n2. 复方氨酚烷胺片 1片 每日两次\n3. 连续用药3天',
      version: 1,
      status: 'SUBMITTED'
    }
  })

  console.log('示例病历创建完成')

  // 创建示例医嘱
  await prisma.medicalOrder.create({
    data: {
      patientId: patient1.id,
      doctorId: doctorUser.id,
      orderType: 'MEDICATION',
      content: '硝苯地平缓释片 30mg 每日一次 口服',
      dosage: '30mg',
      frequency: 'qd',
      duration: '30天',
      priority: 'NORMAL',
      status: 'EXECUTED',
      notes: '注意监测血压变化'
    }
  })

  await prisma.medicalOrder.create({
    data: {
      patientId: patient2.id,
      doctorId: doctorUser.id,
      orderType: 'MEDICATION',
      content: '布洛芬缓释胶囊 0.3g 每日两次 口服',
      dosage: '0.3g',
      frequency: 'bid',
      duration: '3天',
      priority: 'NORMAL',
      status: 'PENDING',
      notes: '饭后服用，注意胃肠道反应'
    }
  })

  await prisma.medicalOrder.create({
    data: {
      patientId: patient1.id,
      doctorId: doctorUser.id,
      orderType: 'EXAMINATION',
      content: '血常规检查',
      priority: 'NORMAL',
      status: 'PENDING',
      notes: '检查白细胞、红细胞、血小板等指标'
    }
  })

  console.log('示例医嘱创建完成')

  // 创建示例检查检验
  await prisma.examination.create({
    data: {
      patientId: patient1.id,
      examType: 'LABORATORY',
      examName: '血常规检查',
      description: '检查血液各项指标',
      result: 'WBC: 6.5×10^9/L\nRBC: 4.5×10^12/L\nHGB: 140g/L\nPLT: 210×10^9/L\n各项指标均在正常范围内',
      status: 'COMPLETED',
      requestedBy: doctorUser.id,
      reportedBy: doctorUser.id,
      reportedAt: new Date()
    }
  })

  await prisma.examination.create({
    data: {
      patientId: patient1.id,
      examType: 'FUNCTION',
      examName: '血压测量',
      description: '测量血压',
      result: '血压: 145/95mmHg\n心率: 78次/分',
      status: 'COMPLETED',
      requestedBy: doctorUser.id,
      reportedBy: doctorUser.id,
      reportedAt: new Date()
    }
  })

  console.log('示例检查检验创建完成')

  console.log('数据库初始化完成！')
  console.log('默认登录账户：')
  console.log('管理员: admin / admin123')
  console.log('医生: doctor001 / doctor123')
  console.log('护士: nurse001 / nurse123')
}

main()
  .catch((e) => {
    console.error('数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })