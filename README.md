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

## ✨ 核心功能

MCPilot 提供了四个预置的核心功能模块，每个模块都针对特定场景进行了优化：

### 💬 多功能聊天
通用的 AI 对话界面，提供完整的多会话、多模态（文本/图片）和聊天记录管理功能。用户可以在此与配置的任何 AI 模型进行自由对话，并利用所有已启用的 MCP 工具。

- **主要入口**: `/chat`
- **特点**: 高度灵活，可扩展，是与 AI 进行通用交互和测试工具功能的核心。

### ✍️ 思政论文写作
一个结构化的论文写作助手，旨在引导用户完成一篇思政论文。它通过分步流程（前期准备 -> 提纲修改 -> 最终成文）来辅助写作，帮助用户整理思路、生成内容并进行修改。

- **主要入口**: `/agents/political-essay`
- **特点**: 流程化、引导式，专注于长文本内容的生成与迭代。

### 🧮 数学学习辅助
专为解决高等数学和线性代数问题而设计的智能助手。它集成了计算器、Python 解释器和网络搜索等 MCP 服务，能够根据问题自动调用合适的工具进行符号运算、数值计算或概念查询，并提供详细的解题步骤。

- **主要入口**: `/agents/math-assistant`
- **特点**: 工具驱动，专业性强，将大语言模型与计算引擎相结合。

### 🌲 树洞信息助手
一个与“北大树洞”社区深度结合的信息工具。利用定制的树洞爬虫 MCP 服务，它可以帮助用户快速获取信息、洞察热点，提供三种核心操作：
- **总结最近树洞**：自动抓取并总结最近一天内的热门帖子和重要信息。
- **收藏帖子总结**：回顾并总结用户在树洞中收藏的帖子。
- **树洞信息查询**：根据用户提问，在树洞中搜索相关内容并回答。

- **主要入口**: `/agents/treehole-assistant`
- **特点**: 领域特定，数据驱动，展示了 MCPilot 在特定信息源上的应用潜力。

## 📁 项目结构

```
mcpilot/
├── client/                      # Next.js 客户端应用
│   ├── src/
│   │   ├── app/
│   │   │   ├── agents/          # 专用 AI 助手页面
│   │   │   ├── chat/            # 多功能聊天页面
│   │   │   └── ...
│   │   ├── components/          # React 组件
│   │   ├── store/               # Zustand 状态管理
│   │   ├── types/               # TypeScript 类型定义
│   │   └── ...
│   └── ...
├── mcp/                         # MCP 服务器集合
│   ├── calculator/              # 计算器服务
│   ├── pku-treehole-crawler/    # 北大树洞爬虫服务
│   ├── python_interpreter/      # Python 解释器服务
│   └── web_search/              # 网络搜索服务
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
  - openai (OpenAI GPT)
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

应用主页提供了四个功能入口，您可以根据需要选择使用：

### 1. 多功能聊天
- **使用场景**：进行通用的 AI 对话、测试 MCP 工具或任何其他非特定任务。
- **操作**：
  1. 在主页点击“多功能聊天”。
  2. 在右侧的设置面板中选择 AI 模型，配置系统提示词、温度等参数。
  3. 在“MCP 服务器”标签页中，勾选本次会话希望启用的工具。
  4. 在输入框中输入问题即可开始对话。AI 会根据问题内容和启用的工具自动进行交互。

### 2. 思政论文写作
- **使用场景**：需要撰写一篇结构完整的思政论文。
- **操作**：
  1. 在主页点击“思政论文写作”。
  2. 按照界面的引导，依次填写论文要求、参考教材等“前期准备”信息。
  3. 点击“生成提纲”，AI 会创建一份草稿。您可以在文本框中直接修改，或在下方的反馈框中输入修改意见，让 AI 重新生成。
  4. 提纲确认后，点击“生成完整论文”，等待 AI 完成正文。
  5. 对生成的论文进行审阅和修改，直至最终定稿。

### 3. 数学学习辅助
- **使用场景**：解答高等数学、线性代数等领域的数学问题。
- **操作**：
  1. 在主页点击“数学学习辅助”。
  2. 确保左侧边栏的“MCP 服务状态”中，计算器、Python 解释器或网络搜索至少有一个在线。
  3. 在输入框中输入您的数学问题，例如 `求积分 ∫x*sin(x)dx`。
  4. 点击“提交问题”，AI 将调用合适的工具进行计算，并在右侧显示详细的解题过程。

### 4. 树洞信息助手
- **使用场景**：快速获取和分析北大树洞的热点信息。
- **操作**：
  1. 在主页点击“树洞信息助手”。
  2. 确保左侧边栏的“树洞爬虫状态”为在线。
  3. 使用左侧的按钮执行不同操作：
     - **总结最近树洞**：点击后，AI 将自动总结最近一天的热点内容。
     - **收藏帖子总结**：点击后，AI 将展示您收藏的帖子摘要。
     - **信息查询**：在下方的输入框中输入您关心的问题（如“最近有什么实习机会？”），然后点击“查询”。

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
