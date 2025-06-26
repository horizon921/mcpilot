# MCPilot - AI助手与MCP服务器集成平台

MCPilot是一个现代化的AI助手应用，支持MCP (Model Context Protocol) 协议，可以集成多种AI模型和自定义工具服务器。项目包含一个基于Next.js的前端界面和一个专门的北大树洞内容爬取MCP服务器。

## 📁 项目结构

```
mcpilot/
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
├── mcp/
│   ├── pku-treehole-crawler/   # 北大树洞爬虫
│   ├── calculator/             # 高级计算器，可进行微积分和线性代数计算
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

# 任务说明
这是一个AI Agent应用，frontend目录下的内容本质为一个mcp client，形式为网页前端；而mcp目录下的内容为mcp servers。这个AI Agnet现在已经实现了大部分功能，UI需要进一步美化。现在请你先大致浏览目前的代码框架，理解其功能和逻辑。