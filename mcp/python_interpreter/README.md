# Python解释器 MCP 服务器

这是一个基于 MCP (Model Context Protocol) 的Python代码解释器服务器，提供安全的Python代码执行功能。

## 🐍 功能特性

- 🔒 **安全执行**: 受限的Python执行环境，防止危险操作
- 💾 **持久化变量**: 支持变量在多次执行间保持状态
- 📝 **执行历史**: 记录和查看代码执行历史
- 🔧 **变量管理**: 查看和清理全局变量
- ⏱️ **超时控制**: 可配置的代码执行超时时间

## 🚀 快速开始

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 启动服务器
```bash
# 默认端口8766
python python_interpreter_server.py

# 自定义端口
python python_interpreter_server.py --port 9999 --host 0.0.0.0
```

### 3. 测试服务器
```bash
# 检查服务器状态
curl http://localhost:8766/

# 执行Python代码
curl -X POST http://localhost:8766/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "execute_python",
    "arguments": {
      "code": "print(\"Hello, World!\")\nresult = 2 + 3\nprint(f\"2 + 3 = {result}\")"
    }
  }'
```

## 🛠️ MCP 工具说明

### 1. execute_python - 执行Python代码
执行Python代码并返回结果

**参数：**
- `code` (必需): 要执行的Python代码
- `timeout` (可选): 执行超时时间，默认10秒
- `persistent` (可选): 是否保持变量状态，默认false

**示例：**
```json
{
  "tool_name": "execute_python",
  "arguments": {
    "code": "import math\nprint(math.sqrt(16))",
    "timeout": 5,
    "persistent": true
  }
}
```

### 2. get_variables - 获取变量
获取当前Python环境中的全局变量

### 3. clear_variables - 清空变量
清空Python环境中的全局变量

### 4. get_execution_history - 获取历史
获取Python代码执行历史记录

### 5. clear_execution_history - 清空历史
清空Python代码执行历史记录

## 🔒 安全限制

为了安全考虑，以下操作被禁止：
- 文件操作 (`open`, `file`)
- 模块导入 (`import`, `from ... import`)
- 系统调用 (`os.system`, `subprocess`)
- 危险函数 (`exec`, `eval`, `compile`)
- 属性访问 (`__class__`, `__globals__`)

## 📝 使用示例

### 基础计算
```python
# 数学运算
result = await mcp_client.call_tool("execute_python", {
    "code": "import math\nprint(math.pi * 2)"
})

# 数据处理
result = await mcp_client.call_tool("execute_python", {
    "code": "data = [1, 2, 3, 4, 5]\nprint(sum(data))\nprint(max(data))"
})
```

### 持久化变量
```python
# 第一次执行 - 设置变量
await mcp_client.call_tool("execute_python", {
    "code": "x = 10\ny = 20",
    "persistent": True
})

# 第二次执行 - 使用之前的变量
await mcp_client.call_tool("execute_python", {
    "code": "result = x + y\nprint(f'x + y = {result}')",
    "persistent": True
})
```

### 变量管理
```python
# 查看当前变量
variables = await mcp_client.call_tool("get_variables", {})

# 清空所有变量
await mcp_client.call_tool("clear_variables", {})
```

## 🧪 API 端点

- `GET /` - 服务器信息
- `GET /mcp/info` - MCP 服务器信息
- `GET /tools` - 获取工具列表
- `POST /call_tool` - 调用工具
- `GET /mcp-config-schema` - 配置模式


