# 计算器 MCP 服务器

这是一个基于 MCP (Model Context Protocol) 的计算器服务器，提供基础和高级数学计算功能。

## 🧮 功能特性

- ➕ **基础计算**: 四则运算、括号、数学函数
- 🔢 **高级计算**: 阶乘、幂运算、开方、百分比、复利计算
- 📝 **历史记录**: 保存和查看计算历史
- 💾 **内存功能**: 存储、回忆、累加计算结果

## 🚀 快速开始

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 启动服务器
```bash
# 默认端口8765
python calculator_server.py

# 自定义端口
python calculator_server.py --port 9999 --host 0.0.0.0
```

### 3. 测试服务器
```bash
# 检查服务器状态
curl http://localhost:8765/

# 获取工具列表
curl http://localhost:8765/tools

# 基础计算
curl -X POST http://localhost:8765/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "basic_calculate",
    "arguments": {
      "expression": "2+3*4"
    }
  }'
```

## 🛠️ MCP 工具说明

### 1. basic_calculate - 基础计算
支持的运算：
- 四则运算：`+`, `-`, `*`, `/`
- 括号：`(`, `)`
- 数学函数：`sin()`, `cos()`, `tan()`, `log()`, `ln()`, `sqrt()`, `abs()`, `exp()`
- 常数：`pi`, `e`

**示例：**
```json
{
  "tool_name": "basic_calculate",
  "arguments": {
    "expression": "sin(30) + sqrt(16) * pi"
  }
}
```

### 2. advanced_calculate - 高级计算
支持的操作：
- `factorial`: 阶乘计算
- `power`: 幂运算
- `root`: 开方运算
- `percentage`: 百分比计算
- `compound_interest`: 复利计算

**示例：**
```json
{
  "tool_name": "advanced_calculate",
  "arguments": {
    "operation": "factorial",
    "n": 5
  }
}
```

### 3. get_history - 获取历史
获取计算历史记录

### 4. clear_history - 清空历史
清空所有计算历史

### 5. memory_operation - 内存操作
- `store`: 存储数值到内存
- `recall`: 回忆内存中的数值
- `add`: 将数值加到内存
- `clear`: 清空内存

## 🔧 在 AI Agent 中使用

### HTTP 方式 (推荐)
```json
{
  "mcpServers": {
    "calculator": {
      "url": "http://localhost:8765",
      "type": "http"
    }
  }
}
```

### Stdio 方式
```json
{
  "mcpServers": {
    "calculator": {
      "command": "python",
      "args": ["/path/to/calculator_server.py"]
    }
  }
}
```

## 📝 使用示例

```python
# 基础计算
result = await mcp_client.call_tool("basic_calculate", {
    "expression": "2 + 3 * 4"
})

# 高级计算 - 阶乘
result = await mcp_client.call_tool("advanced_calculate", {
    "operation": "factorial",
    "n": 5
})

# 复利计算
result = await mcp_client.call_tool("advanced_calculate", {
    "operation": "compound_interest",
    "principal": 1000,
    "rate": 0.05,
    "time": 10,
    "n": 12
})

# 内存操作
await mcp_client.call_tool("memory_operation", {
    "operation": "store",
    "value": 42
})

result = await mcp_client.call_tool("memory_operation", {
    "operation": "recall"
})
```

## 🧪 API 端点

- `GET /` - 服务器信息
- `GET /mcp/info` - MCP 服务器信息
- `GET /tools` - 获取工具列表
- `POST /call_tool` - 调用工具
- `GET /mcp-config-schema` - 配置模式


