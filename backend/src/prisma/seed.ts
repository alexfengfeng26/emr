import { PrismaClient, UserRole, Gender, BloodType, PatientStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from '@/config'

const prisma = new PrismaClient()

async function main() {
  console.log('开始数据库初始化...')

  // 清空现有数据（生产环境慎用）
  if (process.env.NODE_ENV === 'development') {
    console.log('清空现有数据...')
    await prisma.auditLog.deleteMany()
    await prisma.medicalOrder.deleteMany()
    await prisma.examination.deleteMany()
    await prisma.medicalRecord.deleteMany()
    await prisma.patient.deleteMany()
    await prisma.systemConfig.deleteMany()
    await prisma.user.deleteMany()
  }

  // 创建管理员用户
  console.log('创建管理员用户...')
  const adminPassword = await bcrypt.hash('admin123456', config.bcryptRounds)
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      name: '系统管理员',
      email: 'admin@emr.com',
      role: UserRole.ADMIN,
      department: '系统管理部'
    }
  })

  // 创建示例医生
  console.log('创建示例医生...')
  const doctorPassword = await bcrypt.hash('doctor123456', config.bcryptRounds)
  const doctor1 = await prisma.user.create({
    data: {
      username: 'doctor1',
      password: doctorPassword,
      name: '张医生',
      email: 'zhang@emr.com',
      role: UserRole.DOCTOR,
      department: '内科'
    }
  })

  const doctor2 = await prisma.user.create({
    data: {
      username: 'doctor2',
      password: doctorPassword,
      name: '李医生',
      email: 'li@emr.com',
      role: UserRole.DOCTOR,
      department: '外科'
    }
  })

  // 创建示例护士
  console.log('创建示例护士...')
  const nursePassword = await bcrypt.hash('nurse123456', config.bcryptRounds)
  const nurse1 = await prisma.user.create({
    data: {
      username: 'nurse1',
      password: nursePassword,
      name: '王护士',
      email: 'wang@emr.com',
      role: UserRole.NURSE,
      department: '护理部'
    }
  })

  // 创建示例患者
  console.log('创建示例患者...')
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: '张三',
        gender: Gender.MALE,
        birthDate: new Date('1980-05-15'),
        idCard: '110101198005150001',
        phone: '13800138001',
        address: '北京市朝阳区建国路1号',
        emergencyContact: '张四',
        emergencyPhone: '13800138002',
        bloodType: BloodType.A,
        allergies: '青霉素过敏',
        medicalHistory: '高血压，糖尿病',
        status: PatientStatus.ACTIVE
      }
    }),
    prisma.patient.create({
      data: {
        name: '李四',
        gender: Gender.FEMALE,
        birthDate: new Date('1992-08-20'),
        idCard: '110101199208200002',
        phone: '13800138003',
        address: '北京市海淀区中关村大街2号',
        emergencyContact: '李五',
        emergencyPhone: '13800138004',
        bloodType: BloodType.B,
        allergies: '无',
        medicalHistory: '体健',
        status: PatientStatus.ACTIVE
      }
    }),
    prisma.patient.create({
      data: {
        name: '王五',
        gender: Gender.MALE,
        birthDate: new Date('1975-12-10'),
        idCard: '110101197512100003',
        phone: '13800138005',
        address: '北京市西城区金融街3号',
        emergencyContact: '王六',
        emergencyPhone: '13800138006',
        bloodType: BloodType.O,
        allergies: '海鲜过敏',
        medicalHistory: '冠心病',
        status: PatientStatus.ACTIVE
      }
    })
  ])

  // 创建系统配置
  console.log('创建系统配置...')
  await Promise.all([
    prisma.systemConfig.create({
      data: {
        key: 'SYSTEM_NAME',
        value: '电子病历系统',
        description: '系统名称'
      }
    }),
    prisma.systemConfig.create({
      data: {
        key: 'SYSTEM_VERSION',
        value: '1.0.0',
        description: '系统版本'
      }
    }),
    prisma.systemConfig.create({
      data: {
        key: 'MAX_LOGIN_ATTEMPTS',
        value: '5',
        description: '最大登录尝试次数'
      }
    }),
    prisma.systemConfig.create({
      data: {
        key: 'SESSION_TIMEOUT',
        value: '30',
        description: '会话超时时间（分钟）'
      }
    })
  ])

  // 创建示例病历
  console.log('创建示例病历...')
  await prisma.medicalRecord.create({
    data: {
      patientId: patients[0].id,
      doctorId: doctor1.id,
      type: 'OUTPATIENT',
      title: '高血压复查',
      content: '患者因高血压前来复查，目前血压控制良好，继续药物治疗。',
      diagnosis: '原发性高血压',
      treatment: '继续服用降压药，定期监测血压',
      status: 'SUBMITTED'
    }
  })

  await prisma.medicalRecord.create({
    data: {
      patientId: patients[1].id,
      doctorId: doctor2.id,
      type: 'OUTPATIENT',
      title: '感冒就诊',
      content: '患者因咳嗽、发热就诊，诊断为上呼吸道感染。',
      diagnosis: '上呼吸道感染',
      treatment: '多喝水，注意休息，开具感冒药物',
      status: 'SUBMITTED'
    }
  })

  // 创建示例医嘱
  console.log('创建示例医嘱...')
  await prisma.medicalOrder.create({
    data: {
      patientId: patients[0].id,
      doctorId: doctor1.id,
      orderType: 'MEDICATION',
      content: '硝苯地平缓释片 30mg 口服 每日一次',
      dosage: '30mg',
      frequency: '每日一次',
      duration: '30天',
      priority: 'NORMAL',
      status: 'APPROVED'
    }
  })

  await prisma.medicalOrder.create({
    data: {
      patientId: patients[1].id,
      doctorId: doctor2.id,
      orderType: 'MEDICATION',
      content: '布洛芬缓释胶囊 0.3g 口服 每日两次',
      dosage: '0.3g',
      frequency: '每日两次',
      duration: '3天',
      priority: 'NORMAL',
      status: 'APPROVED'
    }
  })

  // 创建示例检查检验
  console.log('创建示例检查检验...')
  await prisma.examination.create({
    data: {
      patientId: patients[0].id,
      examType: 'LABORATORY',
      examName: '血常规检查',
      description: '检查血细胞计数、血红蛋白等指标',
      result: '白细胞计数正常，血红蛋白略低',
      status: 'COMPLETED',
      requestedBy: doctor1.id,
      reportedBy: doctor1.id,
      reportedAt: new Date()
    }
  })

  await prisma.examination.create({
    data: {
      patientId: patients[1].id,
      examType: 'RADIOLOGY',
      examName: '胸部X光检查',
      description: '检查肺部情况',
      result: '肺部纹理清晰，无明显异常',
      status: 'COMPLETED',
      requestedBy: doctor2.id,
      reportedBy: doctor2.id,
      reportedAt: new Date()
    }
  })

  console.log('数据库初始化完成！')
  console.log('')
  console.log('默认账号信息：')
  console.log('管理员：admin / admin123456')
  console.log('医生1：doctor1 / doctor123456')
  console.log('医生2：doctor2 / doctor123456')
  console.log('护士1：nurse1 / nurse123456')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('数据库初始化失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  })