// 数据模型定义 - 与 Obsidian 文件深度联动

// 任务状态
export type TaskStatus = 'todo' | 'doing' | 'done';

// 项目状态
export type ProjectStatus = 'active' | 'completed' | 'archived';

// 任务类型
export type TaskType = '开发' | '设计' | '文档' | '测试' | '运维' | '其他';

// 优先级
export type Priority = 'high' | 'medium' | 'low';

// 任务元数据（从文件 frontmatter 读取）
export interface TaskFrontmatter {
  status: TaskStatus;
  project: string;
  task_type: TaskType;
  priority: Priority;
  assignee?: string;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  tags?: string[];
}

// 看板任务（对应一个任务文件）
export interface KanbanTask {
  id: string;                      // 文件路径作为 ID
  filePath: string;               // 文件完整路径
  fileName: string;               // 文件名（不含 .md）
  title: string;                  // 任务标题
  content: string;                 // 任务内容
  frontmatter: TaskFrontmatter;   // 文件元数据
  ctime: number;                  // 创建时间
  mtime: number;                  // 修改时间
}

// 看板列
export interface KanbanColumn {
  id: TaskStatus;                   // todo / doing / done
  name: string;                    // 列显示名称
  order: number;                    // 排序
  tasks: KanbanTask[];             // 该列下的任务
}

// 项目
export interface KanbanProject {
  id: string;                      // 项目 ID（文件夹名）
  name: string;                   // 项目名称
  path: string;                   // 项目路径
  taskFolder: string;            // 任务文件夹路径
}

// 看板
export interface KanbanBoard {
  projects: KanbanProject[];       // 所有项目
  selectedProject: string;        // 当前选中的项目
  columns: KanbanColumn[];        // 三列：todo/doing/done
  lastScanTime: number;           // 最后扫描时间
}

// 状态映射
export const STATUS_MAP: Record<TaskStatus, string> = {
  'todo': '待处理',
  'doing': '进行中',
  'done': '已完成'
};

export const STATUS_ORDER: TaskStatus[] = ['todo', 'doing', 'done'];

// 任务类型映射
export const TASK_TYPE_MAP: Record<TaskType, string> = {
  '开发': '💻 开发',
  '设计': '🎨 设计',
  '文档': '📝 文档',
  '测试': '🧪 测试',
  '运维': '⚙️ 运维',
  '其他': '📦 其他'
};

// 优先级映射
export const PRIORITY_MAP: Record<Priority, { label: string; color: string }> = {
  'high': { label: '高', color: '#ef4444' },
  'medium': { label: '中', color: '#f59e0b' },
  'low': { label: '低', color: '#22c55e' }
};
