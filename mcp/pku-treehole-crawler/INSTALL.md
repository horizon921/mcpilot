# 北大树洞爬虫 MCP 服务器 - 安装与使用指南

## 🚀 快速开始

### 1. 安装依赖

```bash
cd pku-treehole-crawler
pip install -r requirements.txt
```

### 2. 获取认证信息

1. 打开浏览器，访问 https://treehole.pku.edu.cn
2. 登录你的北大账号
3. 按 F12 打开开发者工具
4. 切换到"网络"(Network)选项卡
5. 在树洞页面进行任意操作（如刷新或点击）
6. 在网络请求中找到任意一个 API 请求（通常以 `pku_hole` 开头）
7. 点击该请求，在"请求标头"中找到以下字段：
   - `Authorization`: 形如 `Bearer eyJ0eXAiOiJKV1Q...`
   - `Cookie`: 包含 `pku_token` 等信息的长字符串
   - `Uuid`: 形如 `Web_PKUHOLE_2.0.0_WEB_UUID_...`
   - `X-XSRF-TOKEN`: 形如 `eyJpdiI6Ik54emlh...`

### 3. 配置环境变量

#### 方式一：命令行设置
```bash
export PKU_AUTHORIZATION="Bearer 你的授权令牌"
export PKU_COOKIE="你的Cookie字符串"
export PKU_UUID="你的UUID"
export PKU_XSRF_TOKEN="你的XSRF令牌"
```

#### 方式二：创建 .env 文件
```bash
echo 'PKU_AUTHORIZATION="Bearer 你的授权令牌"' > .env
echo 'PKU_COOKIE="你的Cookie字符串"' >> .env
echo 'PKU_UUID="你的UUID"' >> .env
echo 'PKU_XSRF_TOKEN="你的XSRF令牌"' >> .env
```

### 4. 测试运行

```bash
# 测试爬虫功能
python test_server.py

# 测试MCP协议
python test_mcp.py
```

## 🔧 在 AI Agent 中配置

### Claude Desktop 配置

编辑 Claude Desktop 的配置文件：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

添加以下配置：

```json
{
  "mcpServers": {
    "pku-treehole-crawler": {
      "command": "python",
      "args": ["/绝对路径/到/pku-treehole-crawler/server.py"],
      "env": {
        "PKU_AUTHORIZATION": "Bearer 你的授权令牌",
        "PKU_COOKIE": "你的Cookie字符串",
        "PKU_UUID": "你的UUID",
        "PKU_XSRF_TOKEN": "你的XSRF令牌"
      }
    }
  }
}
```

### 其他 MCP 客户端

参考 `mcp_config_example.json` 文件，根据你的 MCP 客户端进行相应配置。

## 🛠️ 工具使用说明

### get_posts - 获取帖子

```python
# 获取最新帖子
result = await client.call_tool("get_posts", {"limit": 10})

# 关键词搜索
result = await client.call_tool("get_posts", {
    "keyword": "期末考试", 
    "limit": 20
})

# 按标签筛选
result = await client.call_tool("get_posts", {
    "label": 4,  # 跳蚤市场
    "limit": 15
})

# 获取带回复的帖子
result = await client.call_tool("get_posts", {
    "keyword": "课程评价",
    "include_replies": True,
    "limit": 5
})

# 时间范围筛选
import time
week_ago = int(time.time()) - 7*24*3600
result = await client.call_tool("get_posts", {
    "time_start": week_ago,
    "limit": 50
})
```

### get_bookmark_groups - 获取关注分组

```python
# 获取所有关注分组
result = await client.call_tool("get_bookmark_groups", {})
```

### get_followed_posts - 获取关注的帖子

```python
# 获取所有关注的帖子
result = await client.call_tool("get_followed_posts", {"limit": 20})

# 获取特定分组的帖子
result = await client.call_tool("get_followed_posts", {
    "bookmark_id": 2518,
    "limit": 10,
    "include_replies": True
})
```

## 📊 返回数据格式

### 帖子数据结构

```json
{
  "posts": [
    {
      "pid": 7481846,
      "text": "帖子内容",
      "type": "text",
      "timestamp": 1750779219,
      "reply": 0,
      "likenum": 1,
      "label": 0,
      "label_info": null,
      "replies": [  // 仅当 include_replies=True 时存在
        {
          "cid": 34359052,
          "text": "回复内容",
          "name": "Alice",
          "timestamp": 1750779914
        }
      ],
      "image_data": "base64编码的图片数据",  // 仅当 include_images=True 时存在
      "image_note": "这里有一张图片"  // 当有图片但 include_images=False 时存在
    }
  ],
  "total_found": 25,
  "timestamp": 1750779223
}
```

### 关注分组数据结构

```json
{
  "bookmark_groups": [
    {
      "id": 2518,
      "bookmark_name": "信息贴"
    }
  ],
  "timestamp": 1750779223
}
```

## 🔍 故障排除

### 常见问题

1. **认证失败**
   - 检查环境变量是否正确设置
   - 确认认证信息是否过期（通常24小时内有效）
   - 重新从浏览器获取最新认证信息

2. **请求失败**
   - 检查网络连接
   - 确认北大树洞服务器状态
   - 检查请求参数格式

3. **MCP连接失败**
   - 确认 MCP 客户端配置正确
   - 检查 Python 环境和依赖包
   - 查看服务器日志输出

### 日志调试

服务器会输出详细的日志信息，包括：
- HTTP 请求状态
- 错误信息
- 工具调用情况

## 🔒 安全说明

- 认证信息包含敏感数据，请妥善保管
- 不要在公共场所或代码仓库中暴露认证信息
- 定期更新认证信息以确保安全性
- 遵守北大树洞使用条款，合理使用API

## 📝 更新日志

### v0.1.0 (2025-06-24)
- 初始版本发布
- 支持帖子获取、关键词搜索、标签筛选
- 支持关注分组和关注帖子获取
- 支持回复和图片获取
- 完整的 MCP 协议支持