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

#### 添加北大树洞MCP服务器
1. 进入设置 -> MCP服务器页面
2. 点击"添加新服务器"
3. 填写信息：
   - **名称**：北大树洞
   - **基础URL**：http://localhost:8001
   - **描述**：北大树洞内容爬取服务

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

3. **用户体验优化**
   - 添加快捷键支持
   - 优化移动端适配
   - 实现离线模式

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