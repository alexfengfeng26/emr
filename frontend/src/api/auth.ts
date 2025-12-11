import request from '@/utils/request'
import type { LoginForm, LoginResponse } from '@/types/user'

export const authApi = {
  // 登录
  login: (data: LoginForm) => {
    return request.post<LoginResponse>('/auth/login', data)
  },

  // 登出
  logout: () => {
    return request.post('/auth/logout')
  },

  // 获取用户信息
  getUserInfo: () => {
    return request.get('/auth/me')
  },

  // 刷新token
  refreshToken: () => {
    return request.post('/auth/refresh')
  },

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) => {
    return request.post('/auth/change-password', data)
  }
}