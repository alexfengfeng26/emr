import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/components/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'House' }
      },
      // 患者管理模块
      {
        path: '/patients',
        name: 'Patients',
        component: () => import('@/views/patients/Index.vue'),
        meta: { title: '患者管理', icon: 'User' }
      },
      {
        path: '/patients/create',
        name: 'PatientCreate',
        component: () => import('@/views/patients/Form.vue'),
        meta: { title: '新增患者', hidden: true }
      },
      {
        path: '/patients/:id',
        name: 'PatientDetail',
        component: () => import('@/views/patients/Detail.vue'),
        meta: { title: '患者详情', hidden: true }
      },
      {
        path: '/patients/:id/edit',
        name: 'PatientEdit',
        component: () => import('@/views/patients/Form.vue'),
        meta: { title: '编辑患者', hidden: true }
      },
      // 病历管理模块
      {
        path: '/medical-records',
        name: 'MedicalRecords',
        component: () => import('@/views/medical-records/Index.vue'),
        meta: { title: '病历管理', icon: 'Document' }
      },
      {
        path: '/medical-records/create',
        name: 'MedicalRecordCreate',
        component: () => import('@/views/medical-records/Form.vue'),
        meta: { title: '新增病历', hidden: true }
      },
      {
        path: '/medical-records/:id',
        name: 'MedicalRecordDetail',
        component: () => import('@/views/medical-records/Detail.vue'),
        meta: { title: '病历详情', hidden: true }
      },
      {
        path: '/medical-records/:id/edit',
        name: 'MedicalRecordEdit',
        component: () => import('@/views/medical-records/Form.vue'),
        meta: { title: '编辑病历', hidden: true }
      },
      {
        path: '/medical-records/:id/approve',
        name: 'MedicalRecordApprove',
        component: () => import('@/views/medical-records/Approve.vue'),
        meta: { title: '审核病历', hidden: true }
      },
      // 医嘱管理模块
      {
        path: '/medical-orders',
        name: 'MedicalOrders',
        component: () => import('@/views/medical-orders/Index.vue'),
        meta: { title: '医嘱管理', icon: 'FirstAidKit' }
      },
      {
        path: '/medical-orders/create',
        name: 'MedicalOrderCreate',
        component: () => import('@/views/medical-orders/Form.vue'),
        meta: { title: '新增医嘱', hidden: true }
      },
      {
        path: '/medical-orders/:id',
        name: 'MedicalOrderDetail',
        component: () => import('@/views/medical-orders/Detail.vue'),
        meta: { title: '医嘱详情', hidden: true }
      },
      {
        path: '/medical-orders/:id/edit',
        name: 'MedicalOrderEdit',
        component: () => import('@/views/medical-orders/Form.vue'),
        meta: { title: '编辑医嘱', hidden: true }
      },
      {
        path: '/medical-orders/:id/execute',
        name: 'MedicalOrderExecute',
        component: () => import('@/views/medical-orders/Execute.vue'),
        meta: { title: '执行医嘱', hidden: true }
      },
      {
        path: '/medical-orders/statistics',
        name: 'MedicalOrderStatistics',
        component: () => import('@/views/medical-orders/Statistics.vue'),
        meta: { title: '医嘱统计', hidden: true }
      },
      // 检查管理模块
      {
        path: '/examinations',
        name: 'Examinations',
        component: () => import('@/views/examinations/Index.vue'),
        meta: { title: '检查管理', icon: 'Microscope' }
      },
      {
        path: '/examinations/create',
        name: 'ExaminationCreate',
        component: () => import('@/views/examinations/Form.vue'),
        meta: { title: '新增检查', hidden: true }
      },
      {
        path: '/examinations/:id',
        name: 'ExaminationDetail',
        component: () => import('@/views/examinations/Detail.vue'),
        meta: { title: '检查详情', hidden: true }
      },
      {
        path: '/examinations/:id/edit',
        name: 'ExaminationEdit',
        component: () => import('@/views/examinations/Form.vue'),
        meta: { title: '编辑检查', hidden: true }
      },
      {
        path: '/examinations/:id/report',
        name: 'ExaminationReport',
        component: () => import('@/views/examinations/Report.vue'),
        meta: { title: '检查报告', hidden: true }
      },
      {
        path: '/examinations/history',
        name: 'ExaminationHistory',
        component: () => import('@/views/examinations/History.vue'),
        meta: { title: '检查历史', hidden: true }
      },
      // 药品管理模块
      {
        path: '/medicines',
        name: 'Medicines',
        component: () => import('@/views/medicines/Index.vue'),
        meta: { title: '药品管理', icon: 'MedicineBottle' }
      },
      {
        path: '/medicines/create',
        name: 'MedicineCreate',
        component: () => import('@/views/medicines/Form.vue'),
        meta: { title: '新增药品', hidden: true }
      },
      {
        path: '/medicines/:id',
        name: 'MedicineDetail',
        component: () => import('@/views/medicines/Detail.vue'),
        meta: { title: '药品详情', hidden: true }
      },
      {
        path: '/medicines/:id/edit',
        name: 'MedicineEdit',
        component: () => import('@/views/medicines/Form.vue'),
        meta: { title: '编辑药品', hidden: true }
      },
      {
        path: '/medicines/stocks',
        name: 'MedicineStocks',
        component: () => import('@/views/medicines/Stock.vue'),
        meta: { title: '药品库存', icon: 'Box' }
      },
      {
        path: '/medicines/stocks/:id',
        name: 'MedicineStockDetail',
        component: () => import('@/views/medicines/StockDetail.vue'),
        meta: { title: '库存详情', hidden: true }
      },
      {
        path: '/medicines/stocks/transfer',
        name: 'MedicineStockTransfer',
        component: () => import('@/views/medicines/StockTransfer.vue'),
        meta: { title: '库存转移', hidden: true }
      },
      {
        path: '/medicines/stocks/taking',
        name: 'MedicineStockTaking',
        component: () => import('@/views/medicines/StockTaking.vue'),
        meta: { title: '库存盘点', hidden: true }
      },
      {
        path: '/prescriptions',
        name: 'Prescriptions',
        component: () => import('@/views/medicines/Prescriptions.vue'),
        meta: { title: '处方管理', icon: 'NotebookMedical' }
      },
      {
        path: '/prescriptions/create',
        name: 'PrescriptionCreate',
        component: () => import('@/views/medicines/PrescriptionForm.vue'),
        meta: { title: '开立处方', hidden: true }
      },
      {
        path: '/prescriptions/:id',
        name: 'PrescriptionDetail',
        component: () => import('@/views/medicines/PrescriptionDetail.vue'),
        meta: { title: '处方详情', hidden: true }
      },
      {
        path: '/prescriptions/:id/approve',
        name: 'PrescriptionApprove',
        component: () => import('@/views/medicines/PrescriptionApprove.vue'),
        meta: { title: '审核处方', hidden: true }
      },
      {
        path: '/prescriptions/:id/dispense',
        name: 'PrescriptionDispense',
        component: () => import('@/views/medicines/PrescriptionDispense.vue'),
        meta: { title: '调剂处方', hidden: true }
      },
      {
        path: '/medicines/statistics',
        name: 'MedicineStatistics',
        component: () => import('@/views/medicines/Statistics.vue'),
        meta: { title: '用药统计', icon: 'DataAnalysis' }
      },
      // 统计报表模块
      {
        path: '/statistics',
        name: 'Statistics',
        component: () => import('@/views/statistics/Index.vue'),
        meta: { title: '统计报表', icon: 'PieChart' }
      },
      {
        path: '/statistics/outpatient',
        name: 'OutpatientStatistics',
        component: () => import('@/views/statistics/Outpatient.vue'),
        meta: { title: '门诊统计', hidden: true }
      },
      {
        path: '/statistics/inpatient',
        name: 'InpatientStatistics',
        component: () => import('@/views/statistics/Inpatient.vue'),
        meta: { title: '住院统计', hidden: true }
      },
      {
        path: '/statistics/patients',
        name: 'PatientAnalysis',
        component: () => import('@/views/statistics/Patients.vue'),
        meta: { title: '患者分析', hidden: true }
      },
      {
        path: '/statistics/revenue',
        name: 'RevenueReport',
        component: () => import('@/views/statistics/Revenue.vue'),
        meta: { title: '收入报表', hidden: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  if (requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router