@echo off
echo 启动电子病历系统开发环境...

:: 检查是否安装了依赖
if not exist "node_modules" (
    echo 安装根目录依赖...
    npm install
)

if not exist "frontend\node_modules" (
    echo 安装前端依赖...
    cd frontend && npm install && cd ..
)

if not exist "backend\node_modules" (
    echo 安装后端依赖...
    cd backend && npm install && cd ..
)

:: 检查环境变量文件
if not exist "backend\.env" (
    echo 复制后端环境变量文件...
    copy backend\.env.example backend\.env
)

if not exist "frontend\.env" (
    echo 复制前端环境变量文件...
    copy frontend\.env.example frontend\.env
)

:: 生成Prisma客户端
echo 生成Prisma客户端...
cd backend && npx prisma generate && cd ..

:: 启动服务
echo 启动开发服务...
npm run dev

pause