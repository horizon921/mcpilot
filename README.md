# MCPilot - AI 助手与 MCP 服务器集成平台

MCPilot 是一个现代化的、功能完备的 AI 助手应用，支持 MCP (Model Context Protocol) 协议，可以集成多种 AI 模型和自定义工具服务器。项目包含一个基于 Next.js 的客户端应用和多个独立的 MCP 服务器，包括一个专门的北大树洞内容爬取工具。
## 🚀 项目特性

- **多模态输入**：支持文本和图片同时输入，实现了真正的多模态交互。
- **高级 JSON 结构化输出**：支持根据用户提供的 JSON Schema 强制模型输出结构化数据，并内置了对 `email` 等标准格式的校验。
- **增强的流式响应**：优化了流式输出，能够正确处理模型的“思考”过程，避免了重复消息框的出现，提升了用户体验。
- **多 AI 模型支持**：无缝集成 OpenAI、Anthropic Claude、Google Gemini 等多种主流及自定义的 AI 模型。
- **MCP 协议支持**：可连接和使用符合 MCP 标准的外部工具服务器，实现了强大的可扩展性。
- **现代化 UI**：基于 Next.js 14 和 Tailwind CSS 的响应式界面，支持明暗主题切换。
- **会话管理**：支持多会话管理、会话设置以及消息的创建、编辑、删除和分支功能。
- **状态持久化**：基于 Zustand 的状态管理和持久化，确保用户设置和聊天记录不会丢失。

### MCP服务器特性
- **计算器服务**：数学计算和公式求解
- **Python解释器**：代码执行和数据分析
- **网络搜索**：关键词搜索和信息检索
- **北大树洞爬虫**：支持关键词搜索、最近内容获取等功能
- **RESTful API**：标准的REST接口设计

## 📁 项目结构

```
mcpilot/
├── client/                      # Next.js 客户端应用
│   ├── src/                     # 源代码目录
│   │   ├── app/                 # Next.js App Router
│   │   ├── components/          # React 组件
│   │   ├── store/               # Zustand 状态管理
│   │   └── types/               # TypeScript 类型定义
│   └── ...
├── mcp/                         # MCP 服务器集合
│   ├── calculator/              # 计算器 MCP 服务器
│   ├── pku-treehole-crawler/    # 北大树洞爬虫 MCP 服务器
│   ├── python_interpreter/      # Python 解释器 MCP 服务器
│   └── web_search/              # 网络搜索 MCP 服务器
└── README.md                    # 项目主文档
```

## 🛠️ 技术栈

### 客户端技术栈
- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **UI组件**：Radix UI
- **图标**：Lucide React
- **主题**：next-themes
- **AI SDK**：
  - @anthropic-ai/sdk (Claude)
  - @openai (OpenAI GPT)
  - @google/generative-ai (Gemini)

### 后端技术栈
- **语言**：Python 3.8+
- **MCP协议**：Model Context Protocol
- **HTTP客户端**：Requests
- **数据处理**：各种专业库

## 🚀 快速开始

### 环境要求
- **Node.js** >= 18.0.0
- **Python** >= 3.8
- **npm** 或 **yarn**

### 1. 启动MCP服务器

根据需要启动相应的MCP服务器。每个服务器都需要独立启动：

#### 🧮 启动计算器服务
```bash
cd mcp/calculator
pip install -r requirements.txt
python server.py
```

#### 🐍 启动Python解释器
```bash
cd mcp/python_interpreter  
pip install -r requirements.txt
python server.py
```

#### 🔍 启动网络搜索服务
```bash
cd mcp/web_search
pip install -r requirements.txt
python server.py
```

#### 🌲 启动北大树洞爬虫
具体步骤详见/mcp/pku-treehole-crawler/README.md
```bash
cd mcp/pku-treehole-crawler
pip install -r requirements.txt
python server.py
```

> 💡 **提示**: 可以根据需要选择启动部分服务器，不需要全部启动。

### 2. 启动主应用

打开新的终端窗口：

```bash
cd client
npm install
npm run dev
```
（注意此时为nodejs为开发状态，若要投入生产实际或进行完整测试，请使用`npm run build`）

### 3. 访问应用

打开浏览器访问: **http://localhost:3000**

## ⚙️ 配置说明

### 1. 配置AI模型

1. 打开前端应用：http://localhost:3000
2. 进入设置页面
3. 在"提供商"页面添加AI服务提供商：
   - **OpenAI**：需要API密钥
   - **Anthropic**：需要API密钥
   - **Google Gemini**：需要API密钥
4. 在"模型管理"页面添加具体的AI模型

### 2. 配置MCP服务器

#### 添加MCP服务器
1. 进入设置 -> MCP服务器页面
2. 点击"添加新服务器"
3. 填写基本信息：
   - **名称**：服务器名称（如：计算器、Python解释器等）
   - **基础URL**：MCP服务器的API地址
   - **描述**：可选的服务器描述
   - **默认启用**：是否在添加后默认启用该服务器

#### 配置认证信息
根据MCP服务器的要求，填写相应的配置信息和认证信息

#### 示例配置

**本地计算器服务器**
```
名称：计算器
默认基础URL：http://localhost:8765
配置信息：无
```

**本地Python解释器**
```
名称：Python解释器
默认基础URL：http://localhost:8766
配置信息：无
```

**网络搜索服务**
```
名称：网络搜索
默认基础URL：http://localhost:8767
配置信息：无
```

**北大树洞爬虫服务器**
```
名称：北大树洞爬虫
基础URL：http://localhost:8765
认证方式：北大树洞认证
PKU Authorization：Bearer <YOUR_PKU_AUTHORIZATION_TOKEN>
PKU Cookie：your_cookie_string
PKU UUID：your_uuid
PKU XSRF Token：your_xsrf_token
```

## 📖 使用指南

### 基本聊天功能
1. 在主页点击开始聊天或导航到聊天页面
2. 选择要使用的AI模型
3. 输入消息开始对话
4. 支持多轮对话和会话管理

### 使用MCP工具
1. 确保相应的MCP服务器已启动并连接
2. 在聊天中，AI可以自动调用已配置的MCP工具
3. 例如：
   - "计算 2+3*4 的结果"（调用计算器）
   - "用Python画一个sin函数图像"（调用Python解释器）
   - "搜索最新的AI技术新闻"（调用网络搜索）
   - "搜索北大树洞中关于期末考试的内容"（调用树洞爬虫）

### 各MCP服务器功能
- **计算器**：数学计算、公式求解
- **Python解释器**：代码执行、数据分析、图表生成
- **网络搜索**：关键词搜索、信息检索
- **北大树洞**：关键词搜索、最近内容获取、时间筛选

## 🔧 部署指南

#### 客户端部署
```bash
cd client
npm install
npm run build
```

#### MCP服务器部署
每个MCP服务器都需要独立部署

```bash
# 部署计算器服务
cd mcp/calculator
pip install -r requirements.txt
python server.py

# 部署其他服务器...
```

### Docker部署
可以为每个服务创建独立的Docker容器：

```dockerfile
# client/Dockerfile
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
# mcp/calculator/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["python", "server.py"]
```

## 🏗️ 开发指南

### 添加新的MCP服务器

1. 在 `mcp/` 目录下创建新的服务器文件夹
2. 添加 `server.py`、`requirements.txt` 和 `README.md`
3. 实现MCP协议标准的API接口
4. 在前端设置中添加服务器配置

### 客户端开发

```bash
cd client
npm run dev      # 开发模式
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 代码检查
```

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 提交Pull Request

## 🙏 致谢

- Next.js 团队提供的优秀框架
- Anthropic、OpenAI、Google 提供的AI服务
- MCP协议标准制定者
- 开源社区的各种优秀组件和工具

---

**MCPilot** - 让AI助手与工具集成更简单！ 🚀

**注意**：本项目仅供学习和研究使用，请遵守相关服务的使用条款和法律法规。
