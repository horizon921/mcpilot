# 跨机器认证配置示例

当MCP客户端和MCP服务器不在同一台机器上时，有以下几种方式传递认证信息：

## 方式一：环境变量配置（服务器端）

在MCP服务器所在的机器上设置环境变量：

```bash
export PKU_AUTHORIZATION="Bearer your_token_here"
export PKU_COOKIE="your_cookie_here"
export PKU_UUID="your_uuid_here"
export PKU_XSRF_TOKEN="your_xsrf_token_here"

# 启动服务器
python server.py --port 8765 --host 0.0.0.0
```

## 方式二：HTTP请求头传递（客户端）

MCP客户端可以通过HTTP请求头传递认证信息：

### 请求头格式

```http
POST /call_tool HTTP/1.1
Host: your-server-host:8765
Content-Type: application/json
PKU-Authorization: Bearer your_token_here
PKU-Cookie: your_cookie_here
PKU-UUID: your_uuid_here
PKU-XSRF-Token: your_xsrf_token_here

{
  "tool_name": "get_posts",
  "arguments": {
    "keyword": "期末考试",
    "limit": 5
  }
}
```

### 使用curl命令示例

```bash
curl -X POST http://your-server-host:8765/call_tool \
  -H "Content-Type: application/json" \
  -H "PKU-Authorization: Bearer your_token_here" \
  -H "PKU-Cookie: your_cookie_here" \
  -H "PKU-UUID: your_uuid_here" \
  -H "PKU-XSRF-Token: your_xsrf_token_here" \
  -d '{
    "tool_name": "get_posts",
    "arguments": {
      "keyword": "期末考试",
      "limit": 5
    }
  }'
```

### Python客户端示例

```python
import httpx
import json

# 认证信息
auth_headers = {
    "PKU-Authorization": "Bearer your_token_here",
    "PKU-Cookie": "your_cookie_here",
    "PKU-UUID": "your_uuid_here",
    "PKU-XSRF-Token": "your_xsrf_token_here"
}

# 调用工具
async def call_mcp_tool(server_url: str, tool_name: str, arguments: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{server_url}/call_tool",
            headers=auth_headers,
            json={
                "tool_name": tool_name,
                "arguments": arguments
            }
        )
        return response.json()

# 使用示例
result = await call_mcp_tool(
    "http://your-server-host:8765",
    "get_posts",
    {"keyword": "期末考试", "limit": 5}
)
```

## 方式三：配置文件传递

创建一个配置文件来管理认证信息：

### auth_config.json
```json
{
  "pku_auth": {
    "authorization": "Bearer your_token_here",
    "cookie": "your_cookie_here",
    "uuid": "your_uuid_here",
    "xsrf_token": "your_xsrf_token_here"
  }
}
```

### 客户端配置示例
```json
{
  "mcpServers": {
    "pku-treehole-crawler": {
      "url": "http://remote-server:8765",
      "type": "http",
      "auth_config_file": "./auth_config.json"
    }
  }
}
```

## 安全建议

1. **使用HTTPS**: 在生产环境中，建议使用HTTPS来保护认证信息的传输安全
2. **环境变量隔离**: 不要在代码中硬编码认证信息，使用环境变量或配置文件
3. **定期更新**: 认证信息有时效性，需要定期更新
4. **访问控制**: 限制MCP服务器的访问权限，只允许授权的客户端连接

## 故障排除

### 认证失败
- 检查请求头格式是否正确
- 确认认证信息是否有效
- 检查服务器日志以获取详细错误信息

### 网络连接问题
- 确认服务器端口是否正确开放
- 检查防火墙设置
- 验证网络连通性

### 示例测试命令
```bash
# 测试服务器连接
curl http://your-server-host:8765/

# 测试工具列表
curl http://your-server-host:8765/tools

# 测试工具调用（需要认证）
curl -X POST http://your-server-host:8765/call_tool \
  -H "Content-Type: application/json" \
  -H "PKU-Authorization: Bearer your_token_here" \
  -H "PKU-Cookie: your_cookie_here" \
  -H "PKU-UUID: your_uuid_here" \
  -H "PKU-XSRF-Token: your_xsrf_token_here" \
  -d '{"tool_name": "get_posts", "arguments": {"limit": 1}}'