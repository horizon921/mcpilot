# GitHub 部署指南

## 🚀 将项目上传到GitHub

### 步骤1：在GitHub上创建新仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `mcpilot-ai-assistant` (或您喜欢的名称)
   - **Description**: `MCPilot - AI Assistant with MCP Server Support`
   - **Visibility**: 选择 Public 或 Private
   - **⚠️ 不要勾选** "Add a README file"、"Add .gitignore"、"Choose a license"
4. 点击 "Create repository"

### 步骤2：连接本地仓库到GitHub

在项目根目录执行以下命令：

```bash
# 添加远程仓库（替换为您的GitHub用户名和仓库名）
git remote add origin https://github.com/YOUR_USERNAME/mcpilot-ai-assistant.git

# 推送代码到GitHub
git push -u origin master
```

### 步骤3：验证上传成功

1. 刷新GitHub页面
2. 确认所有文件都已上传
3. 检查README.md是否正确显示

## 📝 项目结构说明

您的GitHub仓库将包含：

```
mcpilot-ai-assistant/
├── .gitignore                 # Git忽略规则
├── README.md                  # 项目主文档
├── start.sh                   # Linux/macOS启动脚本
├── start.bat                  # Windows启动脚本
├── GITHUB_SETUP.md           # GitHub部署指南（本文件）
├── frontend/                  # Next.js前端应用
│   ├── .env.example          # 前端环境变量示例
│   ├── package.json          # 前端依赖配置
│   └── src/                  # 前端源代码
└── treehole_mcp_server/      # Python MCP服务器
    ├── .env.example          # MCP服务器环境变量示例
    ├── main.py               # MCP服务器主文件
    ├── requirements.txt      # Python依赖
    └── README.md            # MCP服务器说明
```

## 🔒 安全注意事项

### 已被.gitignore保护的敏感信息：
- ✅ API密钥文件 (`.env`, `.env.local`)
- ✅ Node.js依赖 (`node_modules/`)
- ✅ Python缓存 (`__pycache__/`)
- ✅ 构建文件 (`build/`, `dist/`, `.next/`)
- ✅ 日志文件 (`*.log`)
- ✅ 临时文件

### ⚠️ 安全提醒：
- **永远不要**将真实的API密钥提交到GitHub
- 使用`.env.example`文件作为配置模板
- 在生产环境中使用环境变量管理敏感信息

## 🌟 为项目添加徽章

在GitHub上，您可以为项目添加状态徽章。在README.md顶部添加：

```markdown
![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/mcpilot-ai-assistant)
![GitHub forks](https://img.shields.io/github/forks/YOUR_USERNAME/mcpilot-ai-assistant)
![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/mcpilot-ai-assistant)
![License](https://img.shields.io/github/license/YOUR_USERNAME/mcpilot-ai-assistant)
```

## 📚 后续维护

### 日常开发流程：
```bash
# 拉取最新代码
git pull origin master

# 添加更改
git add .

# 提交更改
git commit -m "描述您的更改"

# 推送到GitHub
git push origin master
```

### 创建新功能分支：
```bash
# 创建并切换到新分支
git checkout -b feature/new-feature

# 完成开发后推送分支
git push origin feature/new-feature

# 在GitHub上创建Pull Request
```

## 🤝 开源协作

### 如果您想开源此项目：

1. **添加LICENSE文件**：
   - 在GitHub仓库中点击 "Add file" > "Create new file"
   - 文件名输入 `LICENSE`
   - GitHub会自动提供许可证模板选择

2. **完善文档**：
   - 添加贡献指南 (`CONTRIBUTING.md`)
   - 添加行为准则 (`CODE_OF_CONDUCT.md`)
   - 完善README中的贡献部分

3. **设置GitHub Pages**（可选）：
   - 用于展示项目文档或演示

## 🎯 推荐的GitHub设置

### 仓库设置：
- **Branches**: 启用分支保护规则
- **Actions**: 可以设置CI/CD自动化
- **Issues**: 启用问题跟踪
- **Discussions**: 启用社区讨论

### GitHub Actions示例（可选）：
可以创建 `.github/workflows/ci.yml` 进行自动化测试：

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install && npm run build
```

---

🎉 **恭喜！您的MCPilot项目现在已经准备好在GitHub上展示了！**