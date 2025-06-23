#!/bin/bash

echo "🚀 启动MCPilot AI助手项目..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：需要安装Node.js (18+)"
    exit 1
fi

# 检查Python是否安装
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ 错误：需要安装Python (3.8+)"
    exit 1
fi

echo "📦 安装前端依赖..."
cd frontend && npm install

echo "📦 安装MCP服务器依赖..."
cd ../treehole_mcp_server && pip install -r requirements.txt

echo "🌟 启动服务..."

# 启动MCP服务器
echo "启动MCP服务器 (端口8001)..."
uvicorn main:app --host 0.0.0.0 --port 8001 &
MCP_PID=$!

# 启动前端
echo "启动前端服务器 (端口3002)..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动成功！"
echo "🌐 前端地址: http://localhost:3002"
echo "🔧 MCP服务器: http://localhost:8001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断信号
trap "echo '🛑 停止所有服务...'; kill $MCP_PID $FRONTEND_PID; exit" INT

# 保持脚本运行
wait