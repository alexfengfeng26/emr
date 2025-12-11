#!/bin/bash

echo "启动电子病历系统开发环境..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "安装根目录依赖..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "安装后端依赖..."
    cd backend && npm install && cd ..
fi

# 检查环境变量文件
if [ ! -f "backend/.env" ]; then
    echo "复制后端环境变量文件..."
    cp backend/.env.example backend/.env
fi

if [ ! -f "frontend/.env" ]; then
    echo "复制前端环境变量文件..."
    cp frontend/.env.example frontend/.env
fi

# 生成Prisma客户端
echo "生成Prisma客户端..."
cd backend && npx prisma generate && cd ..

# 启动服务
echo "启动开发服务..."
npm run dev