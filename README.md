# MCPilot - AI助手与MCP服务器集成平台

MCPilot是一个现代化的AI助手应用，支持MCP (Model Context Protocol) 协议，可以集成多种AI模型和自定义工具服务器。项目包含一个基于Next.js的前端界面和一个专门的北大树洞内容爬取MCP服务器。

## 🚀 项目特性

### 前端特性
- **多AI模型支持**：集成OpenAI、Anthropic Claude、Google Gemini等主流AI模型
- **MCP协议支持**：可连接和使用符合MCP标准的外部工具服务器
- **现代化UI**：基于Next.js 14和Tailwind CSS的响应式界面
- **实时聊天**：支持流式响应的聊天体验
- **会话管理**：支持多会话管理和会话设置
- **主题切换**：支持明暗主题切换
- **状态持久化**：基于Zustand的状态管理和持久化

### MCP服务器特性
- **北大树洞内容爬取**：支持关键词搜索、最近内容获取等功能
- **图片识别标记**：自动识别和标记树洞中的图片内容
- **时间筛选**：支持按时间范围筛选树洞内容
- **RESTful API**：标准的REST接口设计

## 📁 项目结构

```
ai-assistant/
├── frontend/                    # Next.js前端应用
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── (main)/         # 主要页面路由组
│   │   │   │   ├── page.tsx    # 首页
│   │   │   │   ├── chat/       # 聊天页面
│   │   │   │   └── layout.tsx  # 主布局
│   │   │   ├── (settings)/     # 设置页面路由组
│   │   │   │   ├── providers/  # AI提供商设置
│   │   │   │   ├── models/     # AI模型设置
│   │   │   │   ├── mcp/        # MCP服务器设置
│   │   │   │   └── application/ # 应用设置
│   │   │   └── api/            # API路由
│   │   │       ├── chat/       # 聊天API
│   │   │       └── mcp/        # MCP代理API
│   │   ├── components/         # React组件
│   │   │   ├── Chat/           # 聊天相关组件
│   │   │   ├── Common/         # 通用UI组件
│   │   │   ├── Settings/       # 设置页面组件
│   │   │   └── Theme/          # 主题相关组件
│   │   ├── store/              # Zustand状态管理
│   │   │   ├── chatStore.ts    # 聊天状态
│   │   │   ├── settingsStore.ts # 设置状态
│   │   │   └── uiStore.ts      # UI状态
│   │   ├── types/              # TypeScript类型定义
│   │   │   ├── api.ts          # API类型
│   │   │   ├── chat.ts         # 聊天类型
│   │   │   ├── config.ts       # 配置类型
│   │   │   └── mcp.ts          # MCP类型
│   │   └── lib/                # 工具函数
│   └── package.json            # 前端依赖配置
├── treehole_mcp_server/        # 北大树洞MCP服务器
│   ├── main.py                 # 服务器主文件
│   ├── requirements.txt        # Python依赖
│   └── README.md              # MCP服务器文档
└── README.md                   # 项目主文档（本文件）
```

## 🛠️ 技术栈

### 前端技术栈
- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **UI组件**：Radix UI
- **图标**：Lucide React
- **主题**：next-themes
- **AI SDK**：
  - @anthropic-ai/sdk (Claude)
  - openai (OpenAI GPT)
  - @google/generative-ai (Gemini)

### 后端技术栈
- **框架**：FastAPI
- **语言**：Python 3.12
- **服务器**：Uvicorn
- **数据验证**：Pydantic
- **HTTP客户端**：Requests

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.8+
- npm 或 yarn

### 1. 安装依赖

#### 前端依赖
```bash
cd frontend
npm install
```

#### MCP服务器依赖
```bash
cd treehole_mcp_server
pip install -r requirements.txt
```

### 2. 启动服务

#### 方法一：使用启动脚本（推荐）

**Linux/macOS用户：**
```bash
./start.sh
```

**Windows用户：**
```cmd
start.bat
```

启动脚本将自动：
- 安装所有依赖
- 启动MCP服务器（端口8001）
- 启动前端服务器（端口3002）

#### 方法二：手动启动

**启动前端开发服务器**
```bash
cd frontend
npm run dev
```
前端将运行在：http://localhost:3002

**启动MCP服务器**
```bash
cd treehole_mcp_server
uvicorn main:app --host 0.0.0.0 --port 8001
```
MCP服务器将运行在：http://localhost:8001

### 3. 配置AI模型

1. 打开前端应用：http://localhost:3002
2. 进入设置页面
3. 在"提供商"页面添加AI服务提供商：
   - **OpenAI**：需要API密钥
   - **Anthropic**：需要API密钥
   - **Google Gemini**：需要API密钥
4. 在"模型"页面添加具体的AI模型
5. 在"MCP服务器"页面添加MCP服务器

### 4. 配置MCP服务器

#### 添加MCP服务器
1. 进入设置 -> MCP服务器页面
2. 点击"添加新服务器"
3. 填写基本信息：
   - **名称**：服务器名称（如：北大树洞、OpenAI API等）
   - **基础URL**：MCP服务器的API地址
   - **描述**：可选的服务器描述
   - **默认启用**：是否在添加后默认启用该服务器

#### 配置认证信息
根据MCP服务器的要求，选择相应的认证方式：

**无认证**
- 适用于不需要认证的本地或测试服务器

**Bearer Token认证**
- 输入Bearer Token
- 适用于使用Authorization: Bearer <token>的API

**API Key认证**
- **API Key (Header)**：API Key通过HTTP请求头传递
  - API Key：输入你的API密钥
  - API Key名称：请求头名称（如：X-API-Key、Authorization等）
- **API Key (Query)**：API Key通过URL查询参数传递
  - API Key：输入你的API密钥
  - API Key名称：查询参数名称（如：api_key、key等）

**基础认证**
- 输入用户名和密码
- 适用于HTTP Basic Authentication

**自定义请求头**
- 输入JSON格式的自定义请求头对象
- 示例：`{"Authorization": "Bearer your-token", "X-Custom-Header": "value"}`
- 适用于需要特殊请求头配置的服务器

#### 示例配置

**本地MCP服务器（无认证）**
```
名称：北大树洞
基础URL：http://localhost:8001
认证方式：无认证
```

**OpenAI兼容的MCP服务器**
```
名称：OpenAI API Server
基础URL：https://api.openai.com/v1
认证方式：Bearer Token
Bearer Token：your-openai-api-key
```

**使用API Key的第三方服务**
```
名称：第三方API服务
基础URL：https://api.example.com
认证方式：API Key (Header)
API Key：your-api-key
API Key名称：X-API-Key
```

**北大树洞MCP服务器**
```
名称：北大树洞爬虫
基础URL：http://localhost:8765
认证方式：北大树洞认证
PKU Authorization：Bearer your_authorization_token
PKU Cookie：your_cookie_string
PKU UUID：your_uuid
PKU XSRF Token：your_xsrf_token
```

#### 北大树洞认证信息获取步骤

1. **启动北大树洞MCP服务器**
   ```bash
   cd mcp/pku-treehole-crawler
   pip install -r requirements.txt
   python server.py --port 8765
   ```

2. **获取认证信息**
   - 打开浏览器，访问 https://treehole.pku.edu.cn
   - 使用北大账号登录
   - 按 F12 打开开发者工具，切换到"网络"选项卡
   - 刷新页面或进行任意操作，找到发送到 `treehole.pku.edu.cn` 的请求
   - 在请求头中找到以下信息：
     - `Authorization`: 复制完整值（如：Bearer xxxxxx）
     - `Cookie`: 复制完整的Cookie字符串
     - `Uuid`: 复制UUID值
     - `X-XSRF-TOKEN`: 复制XSRF token值

3. **配置MCP服务器**
   - 在前端应用中进入设置 -> MCP服务器
   - 点击"添加新服务器"
   - 选择"北大树洞认证"方式
   - 填入从浏览器获取的认证信息

4. **测试连接**
   - 保存配置后，系统会自动检测服务器连接状态
   - 绿色状态表示连接成功，可以看到可用的工具列表
   - 如果连接失败，请检查认证信息是否正确或是否过期

## 📖 使用指南

### 基本聊天功能
1. 在主页点击开始聊天或导航到聊天页面
2. 选择要使用的AI模型
3. 输入消息开始对话
4. 支持多轮对话和会话管理

### 使用MCP工具
1. 确保MCP服务器已连接
2. 在聊天中，AI可以自动调用已配置的MCP工具
3. 例如：询问"帮我搜索北大树洞中关于期末考试的内容"

### 北大树洞MCP服务器功能
- **关键词搜索**：`search_treehole`
- **获取最近内容**：`get_recent_treehole`
- **时间筛选**：`get_treehole_by_time`

## ⚙️ 配置说明

### 环境变量配置

#### 前端环境变量 (.env.local)
```bash
# AI API密钥 (可选，也可通过UI配置)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key
```

#### MCP服务器环境变量
```bash
# 北大树洞认证信息 (可选)
TREEHOLE_TOKEN=Bearer_your_token
TREEHOLE_COOKIE=your_cookie
TREEHOLE_UUID=your_uuid
TREEHOLE_XSRF=your_xsrf_token
```

### API密钥获取
- **OpenAI**：https://platform.openai.com/api-keys
- **Anthropic**：https://console.anthropic.com/
- **Google Gemini**：https://makersuite.google.com/app/apikey

### 北大树洞认证信息获取
详见 `treehole_mcp_server/README.md` 中的说明。

## 🏗️ 开发指南

### 前端开发

#### 添加新的AI提供商
1. 在 `src/types/config.ts` 中添加提供商类型
2. 在 `src/app/api/chat/stream/route.ts` 中添加API集成
3. 在设置页面中添加相应的配置选项

#### 添加新的UI组件
1. 在 `src/components/` 下创建组件
2. 使用Tailwind CSS进行样式设计
3. 遵循现有的组件结构和命名规范

#### 状态管理
- 使用Zustand进行状态管理
- 聊天相关状态：`chatStore.ts`
- 设置相关状态：`settingsStore.ts`
- UI状态：`uiStore.ts`

### MCP服务器开发

#### 添加新工具
1. 在 `main.py` 中定义工具函数
2. 添加相应的Pydantic模型
3. 在tools列表中注册新工具
4. 更新API文档

#### 扩展数据源
当前支持北大树洞，可以扩展到其他数据源：
1. 创建新的数据获取函数
2. 定义相应的参数模型
3. 添加API端点

## 🔧 部署指南

### 生产部署

#### 前端部署
```bash
cd frontend
npm run build
npm start
```

#### MCP服务器部署
```bash
cd treehole_mcp_server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Docker部署
可以创建Docker容器来部署两个服务：

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# treehole_mcp_server/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### 常见问题

**Q: 如何为需要API密钥的MCP服务器配置认证？**
A: 在设置 -> MCP服务器页面，添加或编辑服务器时，选择相应的认证方式并填入必要的认证信息。支持Bearer Token、API Key、基础认证等多种方式。

**Q: 认证信息存储在哪里？**
A: 认证信息存储在浏览器的本地存储中。出于安全考虑，建议定期更新API密钥，避免在公共设备上使用。

**Q: 如何测试MCP服务器连接？**
A: 添加MCP服务器后，系统会自动尝试连接并显示状态。绿色表示连接成功，红色表示连接失败。可以查看错误详情进行故障排除。

**Q: 支持哪些类型的MCP服务器？**
A: 支持所有符合MCP (Model Context Protocol) 标准的服务器，包括但不限于：
- 本地运行的MCP服务器
- 需要API密钥认证的云端服务
- 企业内部的MCP服务
- 第三方MCP服务提供商

## 🚀 进一步开发方向

### 短期目标
1. **安全性增强**
   - 添加API密钥加密存储
   - 实现用户认证系统
   - 添加请求限流和防护

2. **功能完善**
   - 支持文件上传和处理
   - 添加聊天记录导出功能
   - 实现插件系统
   - 扩展更多MCP认证方式（OAuth2、JWT等）

3. **用户体验优化**
   - 添加快捷键支持
   - 优化移动端适配
   - 实现离线模式
   - MCP服务器连接状态实时监控

### 中期目标
1. **多模态支持**
   - 图像理解和生成
   - 语音输入输出
   - 视频处理能力

2. **协作功能**
   - 多用户会话共享
   - 团队工作空间
   - 权限管理系统

3. **集成扩展**
   - 更多MCP服务器支持
   - 第三方应用集成
   - API开放平台

### 长期目标
1. **智能化升级**
   - 自适应模型选择
   - 智能工具推荐
   - 个性化助手配置

2. **企业级功能**
   - 私有化部署方案
   - 数据安全合规
   - 大规模用户支持

3. **生态建设**
   - MCP工具市场
   - 开发者社区
   - 插件开发SDK

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 提交Pull Request

## 📝 许可证

该项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- Next.js 团队提供的优秀框架
- Anthropic、OpenAI、Google 提供的AI服务
- 开源社区的各种优秀组件和工具

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 GitHub Issue
- 发送邮件到项目维护者
- 加入开发者讨论群

---

**注意**：本项目仅供学习和研究使用，请遵守相关服务的使用条款和法律法规。