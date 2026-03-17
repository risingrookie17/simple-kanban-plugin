import { App, TFolder, TFile } from 'obsidian';
import { KanbanBoard, KanbanProject, KanbanTask, KanbanColumn, TaskStatus, TaskType, Priority, TaskFrontmatter, STATUS_ORDER, STATUS_MAP } from '../types';
import { updateFrontmatterStatus } from './FrontmatterParser';

export class StorageService {
  private app: App;
  private projectsPath: string = 'Projects';

  constructor(app: App) {
    this.app = app;
  }

  // 扫描所有项目
  async scanProjects(): Promise<KanbanProject[]> {
    const projects: KanbanProject[] = [];
    const rootFolder = this.app.vault.getAbstractFileByPath(this.projectsPath);

    if (!rootFolder || !(rootFolder instanceof TFolder)) {
      return projects;
    }

    for (const item of rootFolder.children) {
      if (item instanceof TFolder && item.name.startsWith('P-')) {
        // 查找任务文件夹
        const taskFolder = this.app.vault.getAbstractFileByPath(`${item.path}/任务`);
        if (taskFolder && taskFolder instanceof TFolder) {
          projects.push({
            id: item.name,
            name: item.name.replace('P-', ''),
            path: item.path,
            taskFolder: taskFolder.path
          });
        }
      }
    }

    return projects;
  }

  // 扫描项目下的所有任务
  async scanTasks(projectId: string): Promise<KanbanTask[]> {
    const project = (await this.scanProjects()).find(p => p.id === projectId);
    if (!project) return [];

    const tasks: KanbanTask[] = [];
    const taskFolder = this.app.vault.getAbstractFileByPath(project.taskFolder);

    if (!taskFolder || !(taskFolder instanceof TFolder)) {
      return tasks;
    }

    for (const item of taskFolder.children) {
      if (item instanceof TFile && item.name.startsWith('T-') && item.extension === 'md') {
        const task = await this.loadTaskFromFile(item);
        if (task) {
          // 匹配项目：可以是 frontmatter.project，也可以从文件内容匹配
          const taskProject = task.frontmatter?.project || '';
          if (taskProject === projectId || !taskProject) {
            // 如果没有 project 字段但文件名在项目文件夹下，也添加
            tasks.push(task);
          }
        }
      }
    }

    return tasks;
  }

  // 从文件加载任务
  async loadTaskFromFile(file: TFile): Promise<KanbanTask | null> {
    try {
      const content = await this.app.vault.read(file);
      const cache = this.app.metadataCache.getFileCache(file);

      // 解析 frontmatter
      let frontmatter: TaskFrontmatter = {
        status: 'todo',
        project: '',
        task_type: '其他',
        priority: 'medium'
      };

      if (cache?.frontmatter) {
        const fm = cache.frontmatter as any;
        frontmatter = {
          status: fm.status || 'todo',
          project: fm.project || '',
          task_type: fm.task_type || '其他',
          priority: fm.priority || 'medium',
          assignee: fm.assignee,
          start_date: fm.start_date,
          due_date: fm.due_date,
          completed_date: fm.completed_date,
          estimated_hours: fm.estimated_hours,
          tags: fm.tags || []
        };
      }

      // 提取标题（从第一行 # 标题或文件名）
      let title = file.name.replace('.md', '');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.startsWith('# ')) {
          title = line.replace('# ', '').trim();
          break;
        }
      }

      return {
        id: file.path,
        filePath: file.path,
        fileName: file.name.replace('.md', ''),
        title,
        content,
        frontmatter,
        ctime: file.stat.ctime,
        mtime: file.stat.mtime
      };
    } catch (e) {
      console.error(`Failed to load task from ${file.path}:`, e);
      return null;
    }
  }

  // 构建看板
  async buildKanbanBoard(projectId: string): Promise<KanbanBoard> {
    // 初始化三列
    const columns: KanbanColumn[] = STATUS_ORDER.map((status, index) => ({
      id: status,
      name: STATUS_MAP[status],
      order: index,
      tasks: []
    }));

    // 扫描任务
    const tasks = await this.scanTasks(projectId);

    // 按状态分发到对应列
    for (const task of tasks) {
      const status = task.frontmatter.status || 'todo';
      const column = columns.find(c => c.id === status);
      if (column) {
        column.tasks.push(task);
      } else {
        columns[0].tasks.push(task);
      }
    }

    return {
      projects: await this.scanProjects(),
      selectedProject: projectId,
      columns,
      lastScanTime: Date.now()
    };
  }

  // 获取所有项目的任务统计
  async getAllProjectsWithStats(): Promise<{ id: string; name: string; taskCount: number }[]> {
    const projects = await this.scanProjects();
    const result: { id: string; name: string; taskCount: number }[] = [];

    for (const project of projects) {
      const tasks = await this.scanTasks(project.id);
      result.push({
        id: project.id,
        name: project.name,
        taskCount: tasks.length
      });
    }

    return result;
  }

  // 更新任务状态
  async updateTaskStatus(task: KanbanTask, newStatus: TaskStatus): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!file || !(file instanceof TFile)) {
      console.error('Task file not found:', task.filePath);
      return;
    }

    try {
      const content = await this.app.vault.read(file);
      const today = new Date().toISOString().split('T')[0];

      // Use the new frontmatter parser to update status
      const newContent = updateFrontmatterStatus(content, newStatus, today);

      await this.app.vault.modify(file, newContent);
      task.frontmatter.status = newStatus;
      task.mtime = file.stat.mtime;
    } catch (e) {
      console.error('Failed to update task status:', e);
    }
  }

  // 创建新任务
  async createTask(projectId: string, title: string, taskType: TaskType = '其他', priority: Priority = 'medium'): Promise<KanbanTask | null> {
    const project = (await this.scanProjects()).find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return null;
    }

    const taskFileName = `T-${title}.md`;
    const taskPath = `${project.taskFolder}/${taskFileName}`;

    const existingFile = this.app.vault.getAbstractFileByPath(taskPath);
    if (existingFile) {
      console.error('Task file already exists:', taskPath);
      return null;
    }

    const content = `---
status: todo
project: ${projectId}
task_type: ${taskType}
priority: ${priority}
---

# ${title}

## 任务描述

>

## 验收标准

- [ ]

## 备注

`;

    try {
      await this.app.vault.create(taskPath, content);
      const file = this.app.vault.getAbstractFileByPath(taskPath);
      if (file && file instanceof TFile) {
        return await this.loadTaskFromFile(file);
      }
    } catch (e) {
      console.error('Failed to create task:', e);
    }

    return null;
  }

  // 删除任务
  async deleteTask(task: KanbanTask): Promise<boolean> {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!file || !(file instanceof TFile)) {
      return false;
    }

    try {
      await this.app.vault.delete(file);
      return true;
    } catch (e) {
      console.error('Failed to delete task:', e);
      return false;
    }
  }
}
