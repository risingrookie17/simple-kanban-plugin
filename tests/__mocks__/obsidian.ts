// Mock implementations for Obsidian API

export class TFile {
  path: string;
  name: string;
  extension: string;
  stat: { ctime: number; mtime: number };

  constructor(path: string, name: string, extension: string = 'md') {
    this.path = path;
    this.name = name;
    this.extension = extension;
    this.stat = { ctime: Date.now(), mtime: Date.now() };
  }
}

export class TFolder {
  path: string;
  name: string;
  children: (TFile | TFolder)[];

  constructor(path: string, name: string, children: (TFile | TFolder)[] = []) {
    this.path = path;
    this.name = name;
    this.children = children;
  }
}

export interface FileStats {
  ctime: number;
  mtime: number;
  size: number;
}

export interface Vault {
  read: jest.Mock;
  modify: jest.Mock;
  create: jest.Mock;
  delete: jest.Mock;
  getAbstractFileByPath: jest.Mock;
  on: jest.Mock;
  files?: Map<string, string>;  // Exposed for testing
}

export interface MetadataCache {
  getFileCache: jest.Mock;
}

export interface App {
  vault: Vault;
  metadataCache: MetadataCache;
  workspace: {
    getLeaf: jest.Mock;
  };
}

// Factory function to create a mock Vault
export function createMockVault(): Vault {
  const files: Map<string, string> = new Map();

  const vault: Vault = {
    read: jest.fn((file: TFile) => {
      const content = files.get(file.path);
      if (content === undefined) {
        throw new Error(`File not found: ${file.path}`);
      }
      return Promise.resolve(content);
    }),
    modify: jest.fn((file: TFile, content: string) => {
      files.set(file.path, content);
      file.stat.mtime = Date.now();
      return Promise.resolve();
    }),
    create: jest.fn((path: string, content: string) => {
      files.set(path, content);
      return Promise.resolve(new TFile(path, path.split('/').pop() || 'untitled'));
    }),
    delete: jest.fn((file: TFile) => {
      files.delete(file.path);
      return Promise.resolve();
    }),
    getAbstractFileByPath: jest.fn((path: string) => {
      if (files.has(path)) {
        return new TFile(path, path.split('/').pop() || 'untitled');
      }
      return null;
    }),
    on: jest.fn()
  };

  // Expose files map for testing
  vault.files = files;

  return vault;
}

// Factory function to create a mock App
export function createMockApp(vault?: Vault): App {
  const mockVault = vault || createMockVault();

  return {
    vault: mockVault,
    metadataCache: {
      getFileCache: jest.fn(() => ({
        frontmatter: null
      }))
    },
    workspace: {
      getLeaf: jest.fn(() => ({
        openFile: jest.fn()
      }))
    }
  };
}

// Mock View class
export class View {
  app!: App;
  constructor(public leaf: any) {}
  containerEl: any;
}

// Mock WorkspaceLeaf
export class WorkspaceLeaf {
  app!: App;
  constructor(public vault: any) {}
}
