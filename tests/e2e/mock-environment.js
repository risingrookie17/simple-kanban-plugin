// Mock Obsidian API for E2E Testing (Plain JavaScript)

// In-memory file storage
const fileStorage = new Map();

// Mock Vault
const mockVault = {
  files: fileStorage,

  read: async function(file) {
    const content = fileStorage.get(file.path);
    if (content === undefined) {
      throw new Error('File not found: ' + file.path);
    }
    return content;
  },

  modify: async function(file, content) {
    fileStorage.set(file.path, content);
  },

  create: async function(path, content) {
    fileStorage.set(path, content);
    return { path: path, name: path.split('/').pop() };
  },

  delete: async function(file) {
    fileStorage.delete(file.path);
  },

  getAbstractFileByPath: function(path) {
    if (fileStorage.has(path)) {
      return {
        path: path,
        name: path.split('/').pop(),
        extension: 'md',
        stat: { ctime: Date.now(), mtime: Date.now() }
      };
    }
    return null;
  },

  on: function(event, callback) {}
};

// Mock MetadataCache
const mockMetadataCache = {
  getFileCache: function(file) {
    const content = fileStorage.get(file.path);
    if (!content) return null;

    // Simple frontmatter parsing
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return { frontmatter: null };

    const fm = {};
    const lines = fmMatch[1].split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        fm[key] = value;
      }
    }
    return { frontmatter: fm };
  }
};

// Mock App
const mockApp = {
  vault: mockVault,
  metadataCache: mockMetadataCache,
  workspace: {
    getLeaf: function(newTab) {
      return {
        openFile: async function(file) {}
      };
    }
  }
};

// Task data
const tasksData = [
  { id: 'T-Test1', filePath: 'Projects/P-Test/任务/T-Test1.md', title: 'Test Task 1', status: 'todo', project: 'P-Test', task_type: '开发', priority: 'high' },
  { id: 'T-Test2', filePath: 'Projects/P-Test/任务/T-Test2.md', title: 'Test Task 2', status: 'todo', project: 'P-Test', task_type: '设计', priority: 'medium' },
  { id: 'T-Test3', filePath: 'Projects/P-Test/任务/T-Test3.md', title: 'Test Task 3', status: 'doing', project: 'P-Test', task_type: '开发', priority: 'high' },
  { id: 'T-Test4', filePath: 'Projects/P-Test/任务/T-Test4.md', title: 'Test Task 4', status: 'done', project: 'P-Test', task_type: '测试', priority: 'low' },
];

// Current tasks in memory
const tasks = new Map();
tasksData.forEach(t => tasks.set(t.id, t));

// Initialize file storage with task files
function initializeFiles() {
  tasks.forEach(function(task) {
    const content = '---\n' +
      'status: ' + task.status + '\n' +
      'project: ' + task.project + '\n' +
      'task_type: ' + task.task_type + '\n' +
      'priority: ' + task.priority + '\n' +
      '---\n\n' +
      '# ' + task.title;
    fileStorage.set(task.filePath, content);
  });
}

// Update task status in file
async function updateTaskStatus(taskId, newStatus) {
  const task = tasks.get(taskId);
  if (!task) throw new Error('Task not found: ' + taskId);

  const filePath = task.filePath;
  let content = fileStorage.get(filePath);
  if (!content) throw new Error('File not found: ' + filePath);

  const today = new Date().toISOString().split('T')[0];

  // Use the same frontmatter parser logic
  const lines = content.split('\n');
  let frontmatterStart = -1;
  let frontmatterEnd = -1;

  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    if (lines[i].trim() === '---') {
      if (frontmatterStart === -1) {
        frontmatterStart = i;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }

  if (frontmatterStart !== -1 && frontmatterEnd !== -1) {
    const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
    let statusFound = false;

    const newFrontmatterLines = frontmatterLines.map(function(line) {
      const trimmed = line.trim();
      if (trimmed.startsWith('status:')) {
        statusFound = true;
        return '  status: ' + newStatus;
      }
      return line;
    });

    if (!statusFound) {
      newFrontmatterLines.unshift('  status: ' + newStatus);
    }

    // Add dates
    if (newStatus === 'doing') {
      newFrontmatterLines.push('  start_date: ' + today);
    }
    if (newStatus === 'done') {
      newFrontmatterLines.push('  completed_date: ' + today);
    }

    content = [
      ...lines.slice(0, frontmatterStart + 1),
      ...newFrontmatterLines,
      ...lines.slice(frontmatterEnd + 1)
    ].join('\n');
  } else {
    // Add new frontmatter
    let fm = '---\nstatus: ' + newStatus + '\n';
    if (newStatus === 'doing') fm += 'start_date: ' + today + '\n';
    if (newStatus === 'done') fm += 'completed_date: ' + today + '\n';
    fm += '---\n\n';
    content = fm + content;
  }

  fileStorage.set(filePath, content);
  task.status = newStatus;
}

// Get task from column
function getTasksByStatus(status) {
  const result = [];
  tasks.forEach(function(task) {
    if (task.status === status) {
      result.push(task);
    }
  });
  return result;
}

// Initialize on load
initializeFiles();

// Export for use in browser
window.mockApp = mockApp;
window.mockVault = mockVault;
window.tasks = tasks;
window.updateTaskStatus = updateTaskStatus;
window.getTasksByStatus = getTasksByStatus;
window.initializeFiles = initializeFiles;
