@echo off
echo 🚀 启动MCPilot AI助手项目...

:: 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：需要安装Node.js ^(18+^)
    pause
    exit /b 1
)

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：需要安装Python ^(3.8+^)
    pause
    exit /b 1
)

echo 📦 安装前端依赖...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)

echo 📦 安装MCP服务器依赖...
cd ..\treehole_mcp_server
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ MCP服务器依赖安装失败
    pause
    exit /b 1
)

echo 🌟 启动服务...

:: 启动MCP服务器
echo 启动MCP服务器 ^(端口8001^)...
start "MCP Server" cmd /c "uvicorn main:app --host 0.0.0.0 --port 8001"

:: 等待2秒让MCP服务器启动
timeout /t 2 /nobreak >nul

:: 启动前端
echo 启动前端服务器 ^(端口3002^)...
cd ..\frontend
start "Frontend" cmd /c "npm run dev"

echo.
echo ✅ 服务启动成功！
echo 🌐 前端地址: http://localhost:3002
echo 🔧 MCP服务器: http://localhost:8001
echo.
echo 按任意键关闭此窗口...
pause >nul