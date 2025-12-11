# 电子病历系统 (EMR System)

基于Vue3 + Fastify + MySQL的现代化电子病历系统。

## 项目结构

```
emr/
├── frontend/           # Vue3前端项目
├── backend/           # Fastify后端项目
├── docs/              # 项目文档
├── .claude/           # Claude配置和计划
├── docker-compose.yml # Docker编排配置
└── README.md
```

## 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **状态管理**: Pinia
- **UI组件**: Element Plus
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **类型检查**: TypeScript
- **构建工具**: Vite

### 后端
- **框架**: Fastify
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: MySQL
- **缓存**: Redis
- **认证**: JWT
- **日志**: Winston

## 核心功能

- 🏥 患者管理
- 📝 病历录入（门诊、住院、手术记录）
- 💊 医嘱管理
- 🔬 检查检验查看
- 👥 用户权限管理
- 🔒 数据安全和日志
- 📊 HIS系统集成

## 快速开始

### 环境要求
- Node.js >= 18
- MySQL >= 8.0
- Redis >= 6.0

### 安装依赖
```bash
npm run install:all
```

### 启动开发服务
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 开发规范

- 代码风格遵循ESLint配置
- 提交信息遵循Conventional Commits
- 组件命名使用PascalCase
- API接口遵循RESTful规范

## 安全标准

- 遵循HL7、FHIR医疗行业标准
- 数据传输HTTPS加密
- 敏感数据脱敏处理
- 完整的操作审计日志

## 许可证

MIT License