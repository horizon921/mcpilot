# 北大树洞爬虫 MCP 服务器

这是一个基于 MCP (Model Context Protocol) 的北大树洞爬虫服务器，提供获取北大树洞帖子、关注内容等功能。

## 功能特性

- 🔍 **搜索帖子**: 支持关键词搜索、标签筛选、时间范围筛选
- 📝 **获取回复**: 可选择性获取每个帖子下的所有回复
- 🖼️ **图片处理**: 支持获取图片内容或显示占位文本
- 📂 **关注管理**: 获取关注分组和关注的帖子
- ⚡ **异步高效**: 基于异步框架，支持并发请求

## 安装与配置

### 1. 安装依赖

```bash
cd pku-treehole-crawler
pip install -r requirements.txt
```

### 2. 配置认证信息

需要设置以下环境变量（从浏览器开发者工具中获取）：

```bash
export PKU_AUTHORIZATION="Bearer your_token_here"
export PKU_COOKIE="your_cookie_here"
export PKU_UUID="your_uuid_here"
export PKU_XSRF_TOKEN="your_xsrf_token_here"
```

### 3. 运行服务器

**方式一：HTTP端口通信 (推荐)**
```bash
# 启动HTTP服务器，默认端口8765
python server.py --port 8765 --host 0.0.0.0

# 或者使用自定义端口
python server.py --port 9999
```

**方式二：Stdio通信 (传统方式)**
```bash
python server.py
```

## MCP 工具说明

### 1. get_posts - 获取帖子

获取北大树洞帖子，支持多种筛选条件。

**参数：**
- `keyword` (可选): 搜索关键词
- `label` (可选): 标签筛选
  - 1: 课程心得
  - 2: 失物招领  
  - 3: 求职经历
  - 4: 跳蚤市场
- `limit` (可选): 获取帖子数量，默认10，最大100
- `time_start` (可选): 起始时间戳，获取该时间到现在的帖子
- `include_replies` (可选): 是否包含回复，默认false
- `include_images` (可选): 是否包含图片，默认false

**示例：**
```json
{
  "keyword": "高数",
  "label": 1,
  "limit": 5,
  "include_replies": true
}
```

### 2. get_bookmark_groups - 获取关注分组

获取账号的所有关注分组列表。

**参数：** 无

### 3. get_followed_posts - 获取关注的帖子

获取账号关注的帖子，支持按分组筛选。

**参数：**
- `bookmark_id` (可选): 分组ID，不指定则获取所有关注的帖子
- `limit` (可选): 获取帖子数量，默认10，最大100
- `include_replies` (可选): 是否包含回复，默认false
- `include_images` (可选): 是否包含图片，默认false

## 在 AI Agent 中使用

### 1. 配置 MCP 客户端

**方式一：HTTP端口通信 (推荐)**

首先启动HTTP服务器：
```bash
PKU_AUTHORIZATION="Bearer your_token_here" \
PKU_COOKIE="your_cookie_here" \
PKU_UUID="your_uuid_here" \
PKU_XSRF_TOKEN="your_xsrf_token_here" \
python server.py --port 8765
```

然后在你的 AI Agent 配置文件中添加：
```json
{
  "mcpServers": {
    "pku-treehole-crawler": {
      "url": "http://localhost:8765",
      "type": "http"
    }
  }
}
```

**方式二：Stdio通信 (传统方式)**

在你的 AI Agent 配置文件中添加：
```json
{
  "mcpServers": {
    "pku-treehole-crawler": {
      "command": "python",
      "args": ["/path/to/pku-treehole-crawler/server.py"],
      "env": {
        "PKU_AUTHORIZATION": "Bearer your_token_here",
        "PKU_COOKIE": "your_cookie_here",
        "PKU_UUID": "your_uuid_here",
        "PKU_XSRF_TOKEN": "your_xsrf_token_here"
      }
    }
  }
}
```

### HTTP API 端点

当使用HTTP通信时，可以直接调用以下API端点：

- `GET /` - 服务器信息
- `GET /tools` - 获取可用工具列表
- `POST /call_tool` - 调用工具

**示例调用：**
```bash
# 获取工具列表
curl http://localhost:8765/tools

# 调用工具
curl -X POST http://localhost:8765/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "get_posts",
    "arguments": {
      "keyword": "期末考试",
      "limit": 5
    }
  }'
```

### 2. 使用示例

```python
# 获取最新的10个帖子
result = await mcp_client.call_tool("get_posts", {})

# 搜索关键词相关的帖子
result = await mcp_client.call_tool("get_posts", {
    "keyword": "期末考试",
    "limit": 20,
    "include_replies": True
})

# 获取跳蚤市场的帖子
result = await mcp_client.call_tool("get_posts", {
    "label": 4,
    "limit": 15
})

# 获取关注分组
groups = await mcp_client.call_tool("get_bookmark_groups", {})

# 获取特定分组的关注帖子
posts = await mcp_client.call_tool("get_followed_posts", {
    "bookmark_id": 2518,
    "include_replies": True
})
```

## 获取认证信息

1. 打开浏览器，登录北大树洞 (https://treehole.pku.edu.cn)
2. 按 F12 打开开发者工具
3. 在网络选项卡中找到任意一个 API 请求
4. 在请求头中找到以下字段：
   - `Authorization`: 复制完整的 Bearer token
   - `Cookie`: 复制完整的 cookie 字符串
   - `Uuid`: 复制 UUID 值
   - `X-XSRF-TOKEN`: 复制 XSRF token 值

## 注意事项

- 🔐 认证信息具有时效性，过期后需要重新获取
- 🚫 请遵守北大树洞使用规范，不要过度频繁请求
- 📸 图片获取功能会增加请求时间和数据量
- 💾 建议合理设置获取数量限制以提高响应速度

## 故障排除

### 认证失败
- 检查环境变量是否正确设置
- 确认认证信息是否过期
- 重新从浏览器获取最新的认证信息

### 请求失败
- 检查网络连接
- 确认北大树洞服务器是否正常
- 检查请求参数是否正确

## 开发与贡献

项目基于 Python 3.8+ 开发，使用 asyncio 和 httpx 进行异步HTTP请求。

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License