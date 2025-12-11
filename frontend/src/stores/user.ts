import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginForm } from '@/types/user'
import { authApi } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const userName = computed(() => user.value?.name || '')

  // 登录
  const login = async (loginForm: LoginForm) => {
    try {
      const response = await authApi.login(loginForm)

      token.value = response.token
      user.value = response.user
      permissions.value = response.permissions || []

      localStorage.setItem('token', response.token)

      ElMessage.success('登录成功')
      return Promise.resolve(response)
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败')
      return Promise.reject(error)
    }
  }

  // 登出
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      token.value = ''
      user.value = null
      permissions.value = []
      localStorage.removeItem('token')
      ElMessage.success('已退出登录')
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const response = await authApi.getUserInfo()
      user.value = response.user
      permissions.value = response.permissions || []
      return Promise.resolve(response)
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return Promise.reject(error)
    }
  }

  // 检查权限
  const hasPermission = (permission: string) => {
    return permissions.value.includes(permission)
  }

  // 检查角色
  const hasRole = (role: string) => {
    return userRole.value === role
  }

  return {
    // 状态
    token,
    user,
    permissions,
    // 计算属性
    isLoggedIn,
    userRole,
    userName,
    // 方法
    login,
    logout,
    getUserInfo,
    hasPermission,
    hasRole
  }
})