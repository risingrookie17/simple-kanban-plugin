import { Plugin, Setting } from 'obsidian';
import { KanbanView } from './views/KanbanView';

export default class SimpleKanban extends Plugin {
  async onload(): Promise<void> {
    console.log('Loading Simple Kanban plugin');

    // 加载 CSS 样式
    this.loadStyles();

    // 注册视图
    this.registerView('simple-kanban-view', (leaf: any) => new KanbanView(leaf, this));

    // 添加命令：打开看板
    this.addCommand({
      id: 'open-kanban',
      name: '打开看板',
      callback: () => this.openKanban()
    });

    // 添加左侧栏按钮
    this.addRibbonIcon('layout', '打开看板', () => {
      this.openKanban();
    });

    // 添加设置页面
    this.addSettingTab(new SimpleKanbanSetting(this));
  }

  // 加载 CSS 样式 - 全新设计的现代简洁风格
  loadStyles(): void {
    this.app.workspace.onLayoutReady(() => {
      const styleId = 'simple-kanban-styles-v2';
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
/* ===== Simple Kanban V2 - 现代简洁设计 ===== */
:root {
  --sk-accent: #6366f1;
  --sk-accent-hover: #4f46e5;
  --sk-bg: #fafbfc;
  --sk-card-bg: #ffffff;
  --sk-column-bg: #f1f5f9;
  --sk-border: #e2e8f0;
  --sk-text: #1e293b;
  --sk-text-muted: #64748b;
  --sk-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --sk-shadow-hover: 0 10px 25px rgba(99, 102, 241, 0.15), 0 4px 10px rgba(0,0,0,0.08);
  --sk-radius: 12px;
  --sk-radius-sm: 8px;
}

/* 看板容器 */
.simple-kanban {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--sk-bg);
  padding: 0;
}

/* 头部 */
.simple-kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--sk-card-bg);
  border-bottom: 1px solid var(--sk-border);
  flex-shrink: 0;
  gap: 12px;
}

/* 头部控件容器 - 包含项目选择和按钮 */
.simple-kanban-header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 头部标题 */
.simple-kanban-header-title {
  display: flex;
  align-items: center;
}

.simple-kanban-header h2,
.simple-kanban-header-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--sk-text);
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (max-width: 600px) {
  .simple-kanban-header {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }
  .simple-kanban-header h2 {
    font-size: 16px;
  }
}

/* 看板区域 */
.simple-kanban-board {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 16px;
  overflow-x: auto;
  align-items: flex-start;
}

/* 列 - 响应式 */
.simple-kanban-column {
  flex: 0 0 auto;
  width: 260px;
  min-width: 200px;
  max-width: 320px;
  height: calc(100vh - 120px);
  background: var(--sk-column-bg);
  border-radius: var(--sk-radius);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--sk-border);
  transition: all 0.2s ease;
}

/* 小屏幕 */
@media (max-width: 768px) {
  .simple-kanban-column {
    flex: 0 0 auto;
    width: 200px;
    min-width: 160px;
    max-width: 240px;
    height: calc(100vh - 100px);
  }
  .simple-kanban-board {
    gap: 8px;
    padding: 12px;
  }
}

/* 大屏幕 */
@media (min-width: 1400px) {
  .simple-kanban-column {
    flex: 0 0 auto;
    width: 300px;
    max-width: 360px;
    height: calc(100vh - 120px);
  }
}

.simple-kanban-column-drag-over {
  background: #e0e7ff;
  border-color: var(--sk-accent);
  transform: scale(1.02);
}

/* 列头部 */
.simple-kanban-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid var(--sk-border);
  background: var(--sk-card-bg);
  border-radius: var(--sk-radius) var(--sk-radius) 0 0;
}

.simple-kanban-column-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--sk-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.simple-kanban-task-count {
  background: var(--sk-accent);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  margin-left: 8px;
}

.simple-kanban-column-add {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--sk-accent);
  cursor: pointer;
  border-radius: var(--sk-radius-sm);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-weight: 300;
}

.simple-kanban-column-add:hover {
  background: var(--sk-accent);
  color: white;
  transform: scale(1.1);
}

/* 任务列表 */
.simple-kanban-task-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 80px;
}

/* 滚动条 */
.simple-kanban-task-list::-webkit-scrollbar {
  width: 6px;
}

.simple-kanban-task-list::-webkit-scrollbar-track {
  background: transparent;
}

.simple-kanban-task-list::-webkit-scrollbar-thumb {
  background: var(--sk-border);
  border-radius: 3px;
}

.simple-kanban-task-list::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* 任务卡片 */
.simple-kanban-card {
  background: var(--sk-card-bg);
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius-sm);
  padding: 14px;
  margin-bottom: 10px;
  cursor: grab;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.simple-kanban-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.simple-kanban-card:hover {
  box-shadow: var(--sk-shadow-hover);
  transform: translateY(-2px);
  border-color: var(--sk-accent);
}

.simple-kanban-card:hover::before {
  opacity: 1;
}

.simple-kanban-card-dragging {
  opacity: 0.6;
  transform: rotate(3deg) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* 任务标题 */
.simple-kanban-card-title {
  font-weight: 600;
  margin-bottom: 8px;
  word-break: break-word;
  color: var(--sk-text);
  font-size: 14px;
  line-height: 1.4;
}

/* 任务内容预览 */
.simple-kanban-card-content {
  font-size: 12px;
  color: var(--sk-text-muted);
  margin-bottom: 10px;
  word-break: break-word;
  line-height: 1.5;
}

/* 标签 */
.simple-kanban-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.simple-kanban-tag {
  font-size: 11px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: var(--sk-text-muted);
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid var(--sk-border);
}

/* 卡片操作按钮 */
.simple-kanban-card-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  position: absolute;
  top: 10px;
  right: 10px;
}

.simple-kanban-card:hover .simple-kanban-card-actions {
  opacity: 1;
}

.simple-kanban-card-edit,
.simple-kanban-card-delete {
  width: 26px;
  height: 26px;
  border: none;
  background: var(--sk-column-bg);
  color: var(--sk-text-muted);
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.simple-kanban-card-edit:hover {
  background: var(--sk-accent);
  color: white;
  transform: scale(1.1);
}

.simple-kanban-card-delete:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: scale(1.1);
}

/* 弹窗 */
.simple-kanban-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.simple-kanban-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.simple-kanban-modal-content {
  position: relative;
  background: var(--sk-card-bg);
  border-radius: 16px;
  width: 440px;
  max-width: 90vw;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.simple-kanban-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--sk-border);
  background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
}

.simple-kanban-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--sk-text);
}

.simple-kanban-modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 24px;
  color: var(--sk-text-muted);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.simple-kanban-modal-close:hover {
  background: var(--sk-column-bg);
  color: var(--sk-text);
  transform: rotate(90deg);
}

.simple-kanban-modal-body {
  padding: 24px;
  overflow-y: auto;
}

.simple-kanban-modal-field {
  margin-bottom: 20px;
}

.simple-kanban-modal-field label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-text);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.simple-kanban-modal-field input,
.simple-kanban-modal-field textarea,
.simple-kanban-modal-field select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--sk-border);
  border-radius: var(--sk-radius-sm);
  background: var(--sk-card-bg);
  color: var(--sk-text);
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  font-family: inherit;
}

.simple-kanban-modal-field input:focus,
.simple-kanban-modal-field textarea:focus,
.simple-kanban-modal-field select:focus {
  outline: none;
  border-color: var(--sk-accent);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.simple-kanban-modal-field textarea {
  min-height: 100px;
  resize: vertical;
}

.simple-kanban-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--sk-border);
  background: var(--sk-column-bg);
}

.simple-kanban-modal-cancel,
.simple-kanban-modal-save {
  padding: 12px 24px;
  border-radius: var(--sk-radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.simple-kanban-modal-cancel {
  background: transparent;
  border: 2px solid var(--sk-border);
  color: var(--sk-text-muted);
}

.simple-kanban-modal-cancel:hover {
  background: var(--sk-card-bg);
  border-color: var(--sk-text-muted);
  color: var(--sk-text);
}

.simple-kanban-modal-save {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.simple-kanban-modal-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* 空状态 */
.simple-kanban-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--sk-text-muted);
}

.simple-kanban-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 关联文件样式 */
.simple-kanban-card-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #bae6fd;
}

.simple-kanban-card-link:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
}

.simple-kanban-card-link-icon {
  font-size: 14px;
}

.simple-kanban-card-link-name {
  font-size: 12px;
  color: #0369a1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 文件选择器 */
.simple-kanban-file-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--sk-border);
  transition: background 0.15s ease;
  font-size: 14px;
}

.simple-kanban-file-item:hover {
  background: var(--sk-column-bg);
}

.simple-kanban-file-item:last-child {
  border-bottom: none;
}

.simple-kanban-file-more {
  padding: 12px 16px;
  text-align: center;
  color: var(--sk-text-muted);
  font-size: 12px;
}

/* 项目选择器包装器 */
.simple-kanban-project-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.simple-kanban-project-select {
  padding: 10px 36px 10px 14px;
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius-sm);
  background: var(--sk-card-bg);
  color: var(--sk-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-width: 140px;
  height: 40px;
  line-height: 20px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.simple-kanban-project-select:hover {
  border-color: var(--sk-accent);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
}

.simple-kanban-project-select option {
  padding: 10px 14px;
  background: var(--sk-card-bg);
  color: var(--sk-text);
  font-size: 14px;
}

.simple-kanban-project-select:focus {
  outline: none;
  border-color: var(--sk-accent);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* 自定义下拉箭头 */
.simple-kanban-project-arrow {
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: var(--sk-text-muted);
  transition: transform 0.2s ease;
}

.simple-kanban-project-wrapper:focus-within .simple-kanban-project-arrow {
  color: var(--sk-accent);
}

/* 统一按钮基础样式 */
.simple-kanban-project-select,
.simple-kanban-add-btn,
.simple-kanban-refresh-btn {
  height: 40px;
  border-radius: var(--sk-radius-sm);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

/* 项目选择器 */
.simple-kanban-project-select {
  padding: 10px 36px 10px 14px;
  border: 1px solid var(--sk-border);
  background: var(--sk-card-bg);
  color: var(--sk-text);
  min-width: 140px;
  line-height: 20px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.simple-kanban-project-select:hover,
.simple-kanban-project-select:focus {
  border-color: var(--sk-accent);
  outline: none;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.15);
}

/* 新建任务按钮 */
.simple-kanban-add-btn {
  padding: 0 20px;
  background: var(--sk-card-bg);
  color: var(--sk-text);
  border: 1px solid var(--sk-border);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.simple-kanban-add-btn:hover {
  background: var(--sk-accent);
  color: white;
  border-color: var(--sk-accent);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

/* 刷新按钮 */
.simple-kanban-refresh-btn {
  width: 40px;
  padding: 0;
  border: 1px solid var(--sk-border);
  background: var(--sk-card-bg);
  color: var(--sk-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.simple-kanban-refresh-btn svg {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}

.simple-kanban-refresh-btn:hover {
  background: var(--sk-accent);
  color: white;
  border-color: var(--sk-accent);
}

.simple-kanban-refresh-btn:hover svg {
  transform: rotate(180deg);
}

.simple-kanban-refresh-btn:active svg {
  transform: rotate(180deg) scale(0.9);
}

/* 任务元信息行 */
.simple-kanban-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

/* 任务类型标签 */
.simple-kanban-card-type {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--sk-column-bg);
  color: var(--sk-text-muted);
  border-radius: 4px;
}

/* 优先级标签 */
.simple-kanban-card-priority {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

/* 截止日期 */
.simple-kanban-card-due {
  font-size: 11px;
  color: var(--sk-text-muted);
  margin-left: auto;
}
`;
        document.head.appendChild(styleEl);
      }
    });
  }

  async onunload(): Promise<void> {
    console.log('Unloading Simple Kanban plugin');
  }

  async openKanban(): Promise<void> {
    const leaf = this.app.workspace.getLeavesOfType('simple-kanban-view')[0];

    if (leaf) {
      this.app.workspace.revealLeaf(leaf);
    } else {
      // 在主窗口打开（而不是侧边栏）
      await this.app.workspace.getLeaf(false).setViewState({
        type: 'simple-kanban-view'
      });
    }
  }
}

// 设置页面
class SimpleKanbanSetting {
  plugin: SimpleKanban;

  constructor(plugin: SimpleKanban) {
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this.plugin;
    containerEl.empty();

    const title = containerEl.createEl('h2');
    title.textContent = 'Simple Kanban';
    title.style.cssText = 'font-size: 24px; font-weight: 700; margin-bottom: 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;';

    new Setting(containerEl)
      .setName('关于')
      .setDesc('极简看板插件 - 为 Obsidian 打造的优雅看板工具');

    new Setting(containerEl)
      .setName('使用方法')
      .setDesc('点击左侧栏的看板图标或使用命令面板打开看板');

    new Setting(containerEl)
      .setName('快捷键')
      .setDesc('使用 Ctrl+P 打开命令面板，输入"看板"快速打开');
  }
}
