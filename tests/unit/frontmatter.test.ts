import {
  parseFrontmatter,
  extractFrontmatterBounds,
  rebuildFrontmatter,
  FrontmatterFields
} from '../../src/services/FrontmatterParser';

describe('Frontmatter Parser', () => {

  describe('extractFrontmatterBounds', () => {
    it('should find standard frontmatter bounds', () => {
      const content = `---
status: todo
project: P-Test
---

# Title

Content`;

      const result = extractFrontmatterBounds(content);
      expect(result).not.toBeNull();
      expect(result?.start).toBe(0);
      expect(result?.end).toBe(3);
    });

    it('should handle frontmatter with no indentation', () => {
      const content = `---
status:todo
project:P-Test
---

# Title`;

      const result = extractFrontmatterBounds(content);
      expect(result).not.toBeNull();
    });

    it('should handle frontmatter with 2-space indentation', () => {
      const content = `---
  status: todo
  project: P-Test
---

# Title`;

      const result = extractFrontmatterBounds(content);
      expect(result).not.toBeNull();
    });

    it('should return null when no frontmatter exists', () => {
      const content = `# Title

Content`;

      const result = extractFrontmatterBounds(content);
      expect(result).toBeNull();
    });

    it('should return null for empty frontmatter', () => {
      const content = `---
---

# Title`;

      const result = extractFrontmatterBounds(content);
      expect(result).not.toBeNull();
      expect(result?.start).toBe(0);
      expect(result?.end).toBe(1);
    });

    it('should handle corrupted frontmatter with multiple blocks - return first block only', () => {
      const content = `---
status: done
---

---
  status: doing
project: P-Test

---

# Title`;

      const result = extractFrontmatterBounds(content);
      // Should return first block bounds (0 to 2, where line 2 is the second ---)
      expect(result).not.toBeNull();
      expect(result?.start).toBe(0);
      expect(result?.end).toBe(2);
    });

    it('should handle triple frontmatter blocks', () => {
      const content = `---
status: done
---

---
  status: doing
project: P-Test

---

---
  status: todo
task_type: 开发

---

# Title`;

      const result = extractFrontmatterBounds(content);
      expect(result).not.toBeNull();
      expect(result?.start).toBe(0);
      expect(result?.end).toBe(2);
    });

    it('should handle frontmatter at start of file with no leading newline', () => {
      const content = `---
status: todo
---`;

      const result = extractFrontmatterBounds(content);
      expect(result).not.toBeNull();
    });
  });

  describe('parseFrontmatter', () => {
    it('should parse standard frontmatter correctly', () => {
      const content = `---
status: todo
project: P-Test
task_type: 开发
priority: high
---

# Title`;

      const result = parseFrontmatter(content);
      expect(result).toEqual({
        status: 'todo',
        project: 'P-Test',
        task_type: '开发',
        priority: 'high'
      });
    });

    it('should parse frontmatter with no indentation', () => {
      const content = `---
status:todo
project:P-Test
task_type:开发
priority:high
---

# Title`;

      const result = parseFrontmatter(content);
      expect(result.status).toBe('todo');
      expect(result.project).toBe('P-Test');
      expect(result.task_type).toBe('开发');
      expect(result.priority).toBe('high');
    });

    it('should parse frontmatter with mixed indentation', () => {
      const content = `---
  status: doing
project: P-Test
task_type: 开发
  priority: high
---

# Title`;

      const result = parseFrontmatter(content);
      expect(result.status).toBe('doing');
      expect(result.project).toBe('P-Test');
      expect(result.priority).toBe('high');
    });

    it('should handle extra fields gracefully', () => {
      const content = `---
status: todo
project: P-Test
task_type: 开发
priority: high
assignee: John
start_date: 2026-03-17
due_date: 2026-03-20
tags:
  - work
  - important
---

# Title`;

      const result = parseFrontmatter(content);
      expect(result.status).toBe('todo');
      expect(result.project).toBe('P-Test');
    });

    it('should return empty object when no frontmatter exists', () => {
      const content = `# Title

Content`;

      const result = parseFrontmatter(content);
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---

# Title`;

      const result = parseFrontmatter(content);
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle corrupted file with multiple blocks', () => {
      const content = `---
status: done
start_date: 2026-03-17
---

---
  status: doing
project: P-Test
task_type: 开发
priority: high

---

# Title`;

      // Should parse the FIRST block only
      const result = parseFrontmatter(content);
      expect(result.status).toBe('done');
      expect(result.start_date).toBe('2026-03-17');
    });

    it('should handle values with colons', () => {
      const content = `---
status: todo
project: P-Test
description: "URL: http://example.com"
---

# Title`;

      const result = parseFrontmatter(content);
      expect(result.description).toBe('"URL: http://example.com"');
    });

    it('should handle empty values', () => {
      const content = `---
status:
project: P-Test
task_type:
---

# Title`;

      const result = parseFrontmatter(content);
      expect(result.status).toBe('');
      expect(result.task_type).toBe('');
    });
  });

  describe('rebuildFrontmatter', () => {
    it('should rebuild frontmatter with correct 2-space indentation', () => {
      const fields: FrontmatterFields = {
        status: 'doing',
        project: 'P-Test',
        task_type: '开发',
        priority: 'high'
      };

      const result = rebuildFrontmatter(fields, '2026-03-17');
      const lines = result.split('\n');

      expect(lines[0]).toBe('---');
      expect(lines[1]).toBe('  status: doing');
      // start_date is added for doing status
      expect(lines[2]).toBe('  start_date: 2026-03-17');
      expect(lines[3]).toBe('  project: P-Test');
      expect(lines[4]).toBe('  task_type: 开发');
      expect(lines[5]).toBe('  priority: high');
      expect(lines[6]).toBe('---');
    });

    it('should add start_date when status is doing', () => {
      const fields: FrontmatterFields = {
        status: 'doing',
        project: 'P-Test',
        task_type: '开发',
        priority: 'medium'
      };

      const result = rebuildFrontmatter(fields);
      expect(result).toContain('start_date:');
    });

    it('should add completed_date when status is done', () => {
      const fields: FrontmatterFields = {
        status: 'done',
        project: 'P-Test',
        task_type: '开发',
        priority: 'medium'
      };

      const result = rebuildFrontmatter(fields);
      expect(result).toContain('completed_date:');
    });

    it('should preserve existing dates when present', () => {
      const fields: FrontmatterFields = {
        status: 'todo',  // Use todo so no date is added automatically
        project: 'P-Test',
        task_type: '开发',
        priority: 'medium',
        start_date: '2026-03-01',
        completed_date: undefined
      };

      const result = rebuildFrontmatter(fields, '2026-03-17');
      // Should include the existing start_date
      expect(result).toContain('start_date: 2026-03-01');
    });

    it('should handle undefined optional fields', () => {
      const fields: FrontmatterFields = {
        status: 'todo',
        project: 'P-Test',
        task_type: undefined,
        priority: undefined
      };

      const result = rebuildFrontmatter(fields);
      expect(result).toContain('status: todo');
      expect(result).toContain('project: P-Test');
    });
  });
});
