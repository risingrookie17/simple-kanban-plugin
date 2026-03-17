# Simple Kanban

一个极简的 Obsidian 看板插件，帮助你以看板形式管理项目任务。

## 功能特性

- **看板视图** - 以拖拽方式管理任务状态
- **项目切换** - 支持多个项目
- **任务管理** - 创建、编辑、删除任务
- **状态自动更新** - 拖拽任务自动更新文件 frontmatter
- **自动刷新** - 文件修改后自动刷新视图
- **现代 UI** - 简洁美观的界面设计

## 安装

### 从 GitHub 安装（推荐）

1. 下载最新版本
2. 解压到你的 Obsidian 插件目录：
   - Windows: `%APPDATA%\obsidian\plugins\`
   - Mac: `~/Library/Application Support/obsidian/plugins/`
   - Linux: `~/.config/obsidian/plugins/`
3. 在 Obsidian 设置中启用插件

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/risingrookie17/simple-kanban-plugin.git
cd simple-kanban-plugin

# 安装依赖
npm install

# 构建
npm run build
```

## 使用方法

### 1. 打开看板

在 Obsidian 中按 `Ctrl+P`（Mac: `Cmd+P`）打开命令面板，搜索 "Simple Kanban" 并选择。

### 2. 项目管理

- 点击左上角的项目选择器切换不同项目
- 项目对应 Vault 中的文件夹

### 3. 任务状态

看板包含三个列：
- **待处理** - 新建的任务默认在此
- **进行中** - 正在处理的任务
- **已完成** - 已完成的任务

### 4. 拖拽操作

- 将任务卡片拖拽到不同列即可更新状态
- 状态变更会自动写入任务的 frontmatter

### 5. 新建任务

点击 "+ 新建任务" 按钮创建新任务。

### 6. 刷新

点击刷新按钮手动刷新看板视图。

## 任务文件格式

插件会自动查找符合格式的任务文件：

```markdown
---
status: todo
project: P-项目名
task_type: 开发
priority: high
---

# 任务标题

任务描述...
```

### Frontmatter 字段

| 字段 | 说明 | 可选值 |
|------|------|--------|
| `status` | 任务状态 | `todo`, `doing`, `done` |
| `project` | 所属项目 | 项目 ID |
| `task_type` | 任务类型 | 开发、设计、测试等 |
| `priority` | 优先级 | `high`, `medium`, `low` |
| `start_date` | 开始日期 | YYYY-MM-DD |
| `completed_date` | 完成日期 | YYYY-MM-DD |

## 项目结构

```
simple-kanban-plugin/
├── src/
│   ├── main.ts           # 插件入口
│   ├── types.ts          # 类型定义
│   ├── services/
│   │   ├── StorageService.ts    # 存储服务
│   │   └── FrontmatterParser.ts # Frontmatter 解析
│   └── views/
│       └── KanbanView.ts  # 看板视图
├── tests/
│   ├── unit/             # 单元测试
│   └── e2e/              # E2E 测试
├── styles/
│   └── kanban.css       # 样式文件
└── main.js              # 构建输出
```

## 开发

### 运行测试

```bash
# 单元测试
npm test

# E2E 测试
npm run test:e2e

# 监听模式
npm run test:watch
```

### 构建

```bash
npm run build
```

## 技术栈

- TypeScript
- Jest (单元测试)
- Playwright (E2E 测试)
- esbuild (构建工具)

## 许可证

MIT
