import { View, TFile, WorkspaceLeaf } from 'obsidian';
import { KanbanBoard, KanbanTask, KanbanColumn, KanbanProject, TaskStatus, TaskType, Priority, STATUS_MAP, TASK_TYPE_MAP, PRIORITY_MAP } from '../types';
import { StorageService } from '../services/StorageService';

export class KanbanView extends View {
  private board: KanbanBoard | null = null;
  private storage: StorageService;
  private draggedTask: { task: KanbanTask; columnId: string } | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: any) {
    super(leaf);
    this.storage = new StorageService(plugin.app);
  }

  getViewType(): string {
    return 'simple-kanban-view';
  }

  getDisplayText(): string {
    return 'Simple Kanban';
  }

  async onOpen(): Promise<void> {
    await this.loadBoard();
    this.render();
    this.registerFileWatcher();
  }

  async onClose(): void {
    // 清理工作
  }

  // 加载看板数据
  async loadBoard(): Promise<void> {
    const projects = await this.storage.scanProjects();
    if (projects.length === 0) {
      this.board = {
        projects: [],
        selectedProject: '',
        columns: [],
        lastScanTime: Date.now()
      };
      return;
    }

    // 默认选择第一个项目
    const selectedProject = projects[0].id;
    this.board = await this.storage.buildKanbanBoard(selectedProject);
  }

  // 切换项目
  async switchProject(projectId: string): Promise<void> {
    if (!this.board) return;
    this.board = await this.storage.buildKanbanBoard(projectId);
    this.render();
  }

  // 注册文件变化监听
  registerFileWatcher(): void {
    // 监听文件修改
    this.app.vault.on('modify', async (file) => {
      if (file instanceof TFile && file.name.startsWith('T-')) {
        await this.refresh();
      }
    });

    // 监听文件创建
    this.app.vault.on('create', async (file) => {
      if (file instanceof TFile && file.name.startsWith('T-')) {
        await this.refresh();
      }
    });

    // 监听文件删除
    this.app.vault.on('delete', async (file) => {
      if (file instanceof TFile && file.name.startsWith('T-')) {
        await this.refresh();
      }
    });
  }

  // 刷新看板
  async refresh(): Promise<void> {
    console.log('Refreshing kanban board...');
    if (!this.board) {
      console.log('No board to refresh');
      return;
    }
    console.log('Current project:', this.board.selectedProject);
    this.board = await this.storage.buildKanbanBoard(this.board.selectedProject);
    console.log('Board tasks:', this.board.columns.map(c => `${c.name}: ${c.tasks.length}`));
    this.render();
    console.log('Render complete');
  }

  // 渲染看板
  render(): void {
    if (!this.board) return;

    const container = this.containerEl;
    container.empty();
    container.addClass('simple-kanban');

    // 渲染头部（项目选择器）
    this.renderHeader(container);

    // 如果没有项目，显示提示
    if (this.board.projects.length === 0) {
      this.renderEmptyState(container);
      return;
    }

    // 渲染看板列
    this.renderColumns(container);
  }

  // 渲染头部
  renderHeader(container: HTMLElement): void {
    const header = container.createDiv('simple-kanban-header');

    // 左侧控件容器
    const controls = header.createDiv('simple-kanban-header-controls');

    // 项目选择器包装器
    const projectWrapper = controls.createDiv('simple-kanban-project-wrapper');
    const projectSelect = projectWrapper.createEl('select');
    projectSelect.className = 'simple-kanban-project-select';

    // 自定义下拉箭头
    const arrowIcon = projectWrapper.createSpan('simple-kanban-project-arrow');
    arrowIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`;

    for (const project of this.board!.projects) {
      const option = projectSelect.createEl('option');
      option.value = project.id;
      option.textContent = project.name;
      if (project.id === this.board!.selectedProject) {
        option.selected = true;
      }
    }

    projectSelect.addEventListener('change', () => {
      this.switchProject(projectSelect.value);
    });

    // 新建任务按钮
    const addBtn = controls.createEl('button');
    addBtn.className = 'simple-kanban-add-btn';
    addBtn.textContent = '+ 新建任务';
    addBtn.addEventListener('click', () => this.showCreateTaskModal());

    // 刷新按钮 - 使用SVG图标
    const refreshBtn = controls.createEl('button');
    refreshBtn.className = 'simple-kanban-refresh-btn';
    refreshBtn.title = '刷新';
    refreshBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>`;
    refreshBtn.addEventListener('click', async () => {
      console.log('Refreshing kanban...');
      await this.refresh();
      console.log('Kanban refreshed');
    });

    // 右侧标题
    const title = header.createDiv('simple-kanban-header-title');
  }

  // 渲染空状态
  renderEmptyState(container: HTMLElement): void {
    const emptyEl = container.createDiv('simple-kanban-empty');
    const icon = emptyEl.createDiv('simple-kanban-empty-icon');
    icon.textContent = '📁';
    emptyEl.createDiv().textContent = '没有找到项目';
    const hint = emptyEl.createDiv();
    hint.textContent = '请在 Projects/ 目录下创建 P- 开头的项目文件夹';
    hint.style.cssText = 'color: var(--sk-text-muted); font-size: 14px; margin-top: 8px;';
  }

  // 渲染列
  renderColumns(container: HTMLElement): void {
    const boardEl = container.createDiv('simple-kanban-board');

    for (const column of this.board!.columns) {
      this.renderColumn(boardEl, column);
    }
  }

  // 渲染单个列
  renderColumn(parent: HTMLElement, column: KanbanColumn): void {
    const columnEl = parent.createDiv('simple-kanban-column');

    // 列头部
    const header = columnEl.createDiv('simple-kanban-column-header');
    const h3 = header.createEl('h3');
    h3.textContent = column.name;

    // 任务数量
    const countSpan = header.createSpan('simple-kanban-task-count');
    countSpan.textContent = `(${column.tasks.length})`;

    // 任务列表
    const taskList = columnEl.createDiv('simple-kanban-task-list');

    // 渲染任务卡片
    for (const task of column.tasks) {
      this.renderTask(taskList, task, column.id);
    }

    // 设置列的拖拽区域
    this.setupColumnDropZone(columnEl, column.id);
  }

  // 渲染任务卡片
  renderTask(parent: HTMLElement, task: KanbanTask, columnId: string): void {
    const card = parent.createDiv('simple-kanban-card');
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-task-id', task.id);
    card.setAttribute('data-column-id', columnId);

    // 任务标题
    const titleDiv = card.createDiv('simple-kanban-card-title');
    titleDiv.textContent = task.title;

    // 元信息行：任务类型 + 优先级
    const metaRow = card.createDiv('simple-kanban-card-meta');

    // 任务类型标签
    const typeSpan = metaRow.createSpan('simple-kanban-card-type');
    typeSpan.textContent = TASK_TYPE_MAP[task.frontmatter.task_type as TaskType] || task.frontmatter.task_type;

    // 优先级标签
    const priorityInfo = PRIORITY_MAP[task.frontmatter.priority as Priority] || PRIORITY_MAP.medium;
    const prioritySpan = metaRow.createSpan('simple-kanban-card-priority');
    prioritySpan.textContent = priorityInfo.label;
    prioritySpan.style.backgroundColor = priorityInfo.color + '20';
    prioritySpan.style.color = priorityInfo.color;

    // 截止日期
    if (task.frontmatter.due_date) {
      const dueSpan = metaRow.createSpan('simple-kanban-card-due');
      dueSpan.textContent = '📅 ' + task.frontmatter.due_date;
    }

    // 卡片操作按钮
    const actions = card.createDiv('simple-kanban-card-actions');

    // 编辑按钮
    const editBtn = actions.createEl('button');
    editBtn.className = 'simple-kanban-card-edit';
    editBtn.textContent = '✎';
    editBtn.title = '编辑';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openTaskFile(task.filePath);
    });

    // 删除按钮
    const deleteBtn = actions.createEl('button');
    deleteBtn.className = 'simple-kanban-card-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = '删除';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteTask(task);
    });

    // 点击卡片打开文件
    card.addEventListener('click', () => {
      this.openTaskFile(task.filePath);
    });

    // 拖拽事件
    this.setupTaskDrag(card, task, columnId);
  }

  // 打开任务文件
  async openTaskFile(filePath: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file && file instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    }
  }

  // 设置任务拖拽
  setupTaskDrag(card: HTMLElement, task: KanbanTask, columnId: string): void {
    card.addEventListener('dragstart', (e) => {
      console.log('[Kanban] Drag start:', task.title, 'from column:', columnId);
      this.draggedTask = { task, columnId };
      card.addClass('simple-kanban-card-dragging');
      e.dataTransfer?.setData('text/plain', task.id);
      e.dataTransfer!.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      console.log('[Kanban] Drag end');
      card.removeClass('simple-kanban-card-dragging');
      // 不在这里清除 draggedTask，由 drop 事件处理
      // 添加一个超时保护，防止 drop 事件没有触发
      setTimeout(() => {
        if (this.draggedTask) {
          console.log('[Kanban] Drag ended without drop, clearing draggedTask');
          this.draggedTask = null;
        }
      }, 500);
    });
  }

  // 设置列拖拽区域
  setupColumnDropZone(columnEl: HTMLElement, columnId: string): void {
    columnEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
      columnEl.addClass('simple-kanban-column-drag-over');
    });

    columnEl.addEventListener('dragleave', () => {
      columnEl.removeClass('simple-kanban-column-drag-over');
    });

    columnEl.addEventListener('drop', (e) => {
      e.preventDefault();
      columnEl.removeClass('simple-kanban-column-drag-over');

      const draggedTaskInfo = this.draggedTask ? `${this.draggedTask.task.title} from ${this.draggedTask.columnId}` : 'null';
      console.log('[Kanban] Drop event on column:', columnId, '| draggedTask:', draggedTaskInfo);

      if (this.draggedTask) {
        const fromColumn = this.draggedTask.columnId;
        const toColumn = columnId;

        console.log('[Kanban] Move task:', this.draggedTask.task.title, 'from', fromColumn, 'to', toColumn);

        // 如果跨列移动，更新状态
        if (fromColumn !== toColumn) {
          this.moveTask(this.draggedTask.task, fromColumn, toColumn as TaskStatus);
        } else {
          console.log('[Kanban] Same column reorder - refreshing');
          this.refresh();
        }
        // 清除 draggedTask
        this.draggedTask = null;
      } else {
        console.log('[Kanban] No draggedTask found!');
      }
    });
  }

  // 移动任务
  async moveTask(task: KanbanTask, fromColumnId: string, toColumnId: TaskStatus): Promise<void> {
    console.log('[Kanban] moveTask called:', task.title, 'to', toColumnId);
    await this.storage.updateTaskStatus(task, toColumnId);
    // 注意：不需要手动调用 refresh()，文件监听器会自动触发刷新
    console.log('[Kanban] Task status updated, file watcher will trigger refresh');
  }

  // 删除任务
  async deleteTask(task: KanbanTask): Promise<void> {
    const confirmed = confirm(`确定要删除任务 "${task.title}" 吗？`);
    if (confirmed) {
      await this.storage.deleteTask(task);
      await this.refresh();
    }
  }

  // 显示创建任务弹窗
  showCreateTaskModal(): void {
    if (!this.board || !this.board.selectedProject) return;

    const taskTypes: TaskType[] = ['开发', '设计', '文档', '测试', '运维', '其他'];
    const priorities: Priority[] = ['high', 'medium', 'low'];

    const modal = this.createModal('新建任务', `
      <div class="simple-kanban-modal-field">
        <label>任务标题</label>
        <input type="text" id="task-title" placeholder="输入任务标题" autofocus>
      </div>
      <div class="simple-kanban-modal-field">
        <label>任务类型</label>
        <select id="task-type">
          ${taskTypes.map(t => `<option value="${t}">${TASK_TYPE_MAP[t]}</option>`).join('')}
        </select>
      </div>
      <div class="simple-kanban-modal-field">
        <label>优先级</label>
        <select id="task-priority">
          ${priorities.map(p => `<option value="${p}" ${p === 'medium' ? 'selected' : ''}>${PRIORITY_MAP[p].label}</option>`).join('')}
        </select>
      </div>
    `, async () => {
      const title = (document.getElementById('task-title') as HTMLInputElement).value.trim();
      const taskType = (document.getElementById('task-type') as HTMLSelectElement).value as TaskType;
      const priority = (document.getElementById('task-priority') as HTMLSelectElement).value as Priority;

      if (!title) return;

      await this.storage.createTask(this.board!.selectedProject, title, taskType, priority);
      await this.refresh();
    });

    modal.open();
  }

  // 创建弹窗
  createModal(title: string, content: string, onSave: () => void): any {
    const modalEl = document.createElement('div');
    modalEl.className = 'simple-kanban-modal';
    modalEl.innerHTML = `
      <div class="simple-kanban-modal-backdrop"></div>
      <div class="simple-kanban-modal-content">
        <div class="simple-kanban-modal-header">
          <h3>${title}</h3>
          <button class="simple-kanban-modal-close">&times;</button>
        </div>
        <div class="simple-kanban-modal-body">
          ${content}
        </div>
        <div class="simple-kanban-modal-footer">
          <button class="simple-kanban-modal-cancel">取消</button>
          <button class="simple-kanban-modal-save">创建</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const closeModal = () => {
      document.body.removeChild(modalEl);
    };

    modalEl.querySelector('.simple-kanban-modal-backdrop')?.addEventListener('click', closeModal);
    modalEl.querySelector('.simple-kanban-modal-close')?.addEventListener('click', closeModal);
    modalEl.querySelector('.simple-kanban-modal-close')?.addEventListener('click', closeModal);
    modalEl.querySelector('.simple-kanban-modal-save')?.addEventListener('click', async () => {
      await onSave();
      closeModal();
    });

    return {
      open: () => {
        (modalEl.querySelector('#task-title') as HTMLInputElement)?.focus();
      }
    };
  }
}
