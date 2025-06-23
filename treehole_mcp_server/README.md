# 北大树洞 MCP Server

这是一个功能全面的北大树洞内容爬取 MCP (Model Context Protocol) 服务器，支持关键词检索、获取最近树洞、按时间筛选等功能，并能识别和标记图片内容。

## 安装和启动

### 1. 安装依赖

```bash
cd treehole_mcp_server
pip install -r requirements.txt
```

### 2. 启动服务器

```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

服务器将在 `http://localhost:8001` 启动。

## 手动测试

### 1. 查看可用工具

```bash
curl http://localhost:8001/tools
```

### 2. 测试关键词检索

```bash
curl -X POST "http://localhost:8001/tools/search_treehole" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "高数",
    "page": 1,
    "limit": 5,
    "first_message_only": false,
    "token": "Bearer YOUR_TOKEN_HERE",
    "cookie": "YOUR_COOKIE_HERE",
    "uuid": "YOUR_UUID_HERE",
    "xsrf": "YOUR_XSRF_TOKEN_HERE"
  }'
```

#### 仅获取每个帖子的第一条消息（主贴）

```bash
curl -X POST "http://localhost:8001/tools/search_treehole" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "高数",
    "page": 1,
    "limit": 5,
    "first_message_only": true,
    "token": "Bearer YOUR_TOKEN_HERE",
    "cookie": "YOUR_COOKIE_HERE",
    "uuid": "YOUR_UUID_HERE",
    "xsrf": "YOUR_XSRF_TOKEN_HERE"
  }'
```

### 3. 测试获取最近树洞

```bash
curl -X POST "http://localhost:8001/tools/get_recent_treehole" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "limit": 10,
    "first_message_only": false,
    "token": "Bearer YOUR_TOKEN_HERE",
    "cookie": "YOUR_COOKIE_HERE",
    "uuid": "YOUR_UUID_HERE",
    "xsrf": "YOUR_XSRF_TOKEN_HERE"
  }'
```

### 4. 测试按时间获取树洞

```bash
curl -X POST "http://localhost:8001/tools/get_treehole_by_time" \
  -H "Content-Type: application/json" \
  -d '{
    "hours": 6,
    "page": 1,
    "limit": 15,
    "first_message_only": false,
    "token": "Bearer YOUR_TOKEN_HERE",
    "cookie": "YOUR_COOKIE_HERE",
    "uuid": "YOUR_UUID_HERE",
    "xsrf": "YOUR_XSRF_TOKEN_HERE"
  }'
```

### 5. 使用 Postman 测试

- 方法: POST
- URL: `http://localhost:8001/tools/search_treehole` 或其他工具URL
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "keyword": "高数",
  "page": 1,
  "limit": 5,
  "first_message_only": false,
  "token": "",
  "cookie": "",
  "uuid": "",
  "xsrf": ""
}
```

## 在 MCPilot 中添加服务器

1. 打开 MCPilot 应用
2. 进入"设置" -> "MCP 服务器"页面
3. 点击"添加新服务器"
4. 填写以下信息：
   - 名称: `北大树洞`
   - 基础URL: `http://localhost:8001`
   - 描述: `北大树洞关键词检索服务`
5. 保存配置
6. MCPilot 将自动发现所有可用工具：
   - `search_treehole`: 关键词检索树洞
   - `get_recent_treehole`: 获取最近树洞
   - `get_treehole_by_time`: 按时间获取树洞

## API 接口说明

### GET /tools
返回可用工具列表

### POST /tools/search_treehole
根据关键词检索树洞内容

参数:
- `keyword` (必需): 搜索关键词
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认25
- `first_message_only` (可选): 是否仅返回每个帖子的第一条消息（主贴），默认false
- `token` (可选): Authorization token
- `cookie` (可选): Cookie
- `uuid` (可选): UUID
- `xsrf` (可选): XSRF Token

### POST /tools/get_recent_treehole
获取最近的树洞内容（不需要关键词）

参数:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认25
- `first_message_only` (可选): 是否仅返回每个帖子的第一条消息（主贴），默认false
- `token` (可选): Authorization token
- `cookie` (可选): Cookie
- `uuid` (可选): UUID
- `xsrf` (可选): XSRF Token

### POST /tools/get_treehole_by_time
根据时间获取最近若干小时的树洞内容

参数:
- `hours` (可选): 获取最近多少小时的树洞，默认24
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认25
- `first_message_only` (可选): 是否仅返回每个帖子的第一条消息（主贴），默认false
- `token` (可选): Authorization token
- `cookie` (可选): Cookie
- `uuid` (可选): UUID
- `xsrf` (可选): XSRF Token

### 返回格式
所有工具都返回统一格式：
```json
{
  "posts": [
    {
      "pid": 123456,
      "text": "树洞内容...[🖼️图片]",
      "timestamp": 1234567890,
      "likenum": 10,
      "reply": 5,
      "messages": [
        {
          "cid": null,
          "text": "主贴内容...",
          "timestamp": 1234567890,
          "is_image": false,
          "image_placeholder": null
        },
        {
          "cid": 789,
          "text": "回复内容...[🖼️图片]",
          "timestamp": 1234567900,
          "is_image": true,
          "image_placeholder": "[🖼️图片]"
        }
      ],
      "has_images": true
    }
  ],
  "total": 100
}
```

## 新功能特性

### 🖼️ 图片识别与标记
- 自动识别树洞内容中的图片
- 用 `[🖼️图片]` 占位符标记图片位置
- 在 `has_images` 字段标示是否包含图片
- 每条消息的 `is_image` 字段指示该消息是否包含图片

### 📝 完整消息结构与筛选
- 支持获取树洞的完整结构（主贴+所有回复）
- `messages` 数组包含按时间顺序排列的所有消息
- 主贴的 `cid` 为 null，回复的 `cid` 为具体评论ID
- **新增**: `first_message_only` 参数控制返回内容：
  - `false`（默认）：返回完整帖子和所有回复
  - `true`：仅返回每个帖子的第一条消息（主贴）

### ⏰ 时间筛选功能
- 支持按时间范围获取树洞内容
- 可指定获取最近N小时内的树洞
- 自动处理时间戳转换和筛选

## 配置认证信息

### 方法1: 环境变量
```bash
export TREEHOLE_TOKEN="Bearer YOUR_TOKEN"
export TREEHOLE_COOKIE="YOUR_COOKIE"
export TREEHOLE_UUID="YOUR_UUID"
export TREEHOLE_XSRF="YOUR_XSRF"
```

### 方法2: API配置
```bash
# 查看当前配置
curl http://localhost:8001/config

# 设置配置
curl -X POST "http://localhost:8001/config" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "Bearer YOUR_TOKEN",
    "cookie": "YOUR_COOKIE",
    "uuid": "YOUR_UUID", 
    "xsrf": "YOUR_XSRF"
  }'
```

## 获取认证信息

1. 打开浏览器访问 https://treehole.pku.edu.cn/web/
2. 登录北大树洞
3. 打开浏览器开发者工具 (F12)
4. 切换到 Network 标签页
5. 刷新页面或进行任意操作
6. 查找对 `pku_hole` 的请求
7. 在请求头中复制以下信息：
   - `Authorization`: 复制完整值
   - `Cookie`: 复制完整值
   - `Uuid`: 复制完整值
   - `X-Xsrf-Token`: 复制完整值

## 注意事项

- 请遵守北大树洞的使用条款
- 不要过于频繁地请求接口，建议添加适当的延时
- 认证信息有时效性，需要定期更新
- 生产环境建议使用 HTTPS