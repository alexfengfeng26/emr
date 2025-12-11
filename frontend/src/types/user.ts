export interface User {
  id: number
  username: string
  name: string
  email?: string
  phone?: string
  role: 'admin' | 'doctor' | 'nurse'
  department?: string
  avatar?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface LoginForm {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  permissions?: string[]
  expiresIn?: number
}

export interface RegisterForm {
  username: string
  password: string
  name: string
  email?: string
  phone?: string
  role: 'doctor' | 'nurse'
  department?: string
}