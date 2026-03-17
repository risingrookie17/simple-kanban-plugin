// Frontmatter Parser Utility - Handles parsing and rebuilding frontmatter

export interface FrontmatterFields {
  status?: string;
  project?: string;
  task_type?: string;
  priority?: string;
  assignee?: string;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  tags?: string[];
  [key: string]: any;
}

export interface FrontmatterBounds {
  start: number;
  end: number;
  contentStart: number;
  contentEnd: number;
}

/**
 * Extract the bounds of the frontmatter block in a markdown file
 * Returns the line indices of the opening and closing ---
 */
export function extractFrontmatterBounds(content: string): FrontmatterBounds | null {
  const lines = content.split('\n');

  // Find first ---
  let firstDash = -1;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    if (lines[i].trim() === '---') {
      firstDash = i;
      break;
    }
  }

  if (firstDash === -1) {
    return null;
  }

  // Find second ---
  let secondDash = -1;
  for (let i = firstDash + 1; i < Math.min(lines.length, 50); i++) {
    if (lines[i].trim() === '---') {
      secondDash = i;
      break;
    }
  }

  if (secondDash === -1) {
    return null;
  }

  return {
    start: firstDash,
    end: secondDash,
    contentStart: firstDash + 1,
    contentEnd: secondDash
  };
}

/**
 * Parse frontmatter fields from markdown content
 */
export function parseFrontmatter(content: string): FrontmatterFields {
  const bounds = extractFrontmatterBounds(content);

  if (!bounds) {
    return {};
  }

  const lines = content.split('\n');
  const frontmatterLines = lines.slice(bounds.contentStart, bounds.contentEnd);
  const fields: FrontmatterFields = {};

  for (const line of frontmatterLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Handle key: value format
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    fields[key] = value;
  }

  return fields;
}

/**
 * Rebuild frontmatter from fields with consistent 2-space indentation
 */
export function rebuildFrontmatter(fields: FrontmatterFields, today?: string): string {
  const date = today || new Date().toISOString().split('T')[0];
  const lines: string[] = ['---'];

  // Add status first
  if (fields.status) {
    lines.push(`  status: ${fields.status}`);

    // Add start_date for doing
    if (fields.status === 'doing' && !fields.start_date) {
      lines.push(`  start_date: ${date}`);
    }

    // Add completed_date for done
    if (fields.status === 'done' && !fields.completed_date) {
      lines.push(`  completed_date: ${date}`);
    }
  }

  // Add other fields
  const excludeFields = ['status'];  // Only exclude status, include dates
  for (const [key, value] of Object.entries(fields)) {
    if (excludeFields.includes(key)) {
      continue;
    }
    if (value !== undefined && value !== null && value !== '') {
      lines.push(`  ${key}: ${value}`);
    }
  }

  lines.push('---');

  return lines.join('\n');
}

/**
 * Check if content has corrupted frontmatter (multiple blocks)
 */
export function hasCorruptedFrontmatter(content: string): boolean {
  const lines = content.split('\n');
  let dashCount = 0;

  for (const line of lines) {
    if (line.trim() === '---') {
      dashCount++;
      if (dashCount > 2) {
        return true;
      }
    }
    // Stop checking after first block content starts (non-empty, not ---)
    if (dashCount === 2 && line.trim() && !line.trim().startsWith('---')) {
      // Check if this looks like new frontmatter content (has key: value)
      if (/^\s*\w+:\s*/.test(line)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Clean corrupted frontmatter - remove all blocks and keep only content
 */
export function cleanCorruptedFrontmatter(content: string): string {
  const lines = content.split('\n');
  const cleanedLines: string[] = [];
  let inFrontmatter = false;
  let foundFirstBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '---') {
      if (!foundFirstBlock) {
        // First ---, start tracking
        inFrontmatter = true;
        foundFirstBlock = true;
        continue;
      } else if (inFrontmatter) {
        // Second ---, end first block
        inFrontmatter = false;
        continue;
      } else {
        // Additional ---, skip
        continue;
      }
    }

    // Skip content between first block end and any additional blocks
    if (foundFirstBlock && !inFrontmatter && trimmed) {
      // Check if this looks like frontmatter content
      if (/^\s*\w+:\s*/.test(line)) {
        continue;
      }
      // This is the actual content
      cleanedLines.push(line);
      continue;
    }

    if (!inFrontmatter) {
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n');
}

/**
 * Update status in frontmatter - the main function used by StorageService
 */
export function updateFrontmatterStatus(content: string, newStatus: string, today?: string): string {
  const bounds = extractFrontmatterBounds(content);

  // If no frontmatter exists, create one
  if (!bounds) {
    const newFrontmatter = rebuildFrontmatter({ status: newStatus }, today);
    return `${newFrontmatter}\n\n${content}`;
  }

  // Parse existing frontmatter
  const fields = parseFrontmatter(content);

  // Update status
  fields.status = newStatus;

  // Rebuild frontmatter
  const newFrontmatter = rebuildFrontmatter(fields, today);

  // Replace the old frontmatter with new one
  const lines = content.split('\n');

  // Handle case where frontmatter was corrupted
  if (hasCorruptedFrontmatter(content)) {
    // Clean the content first, removing all frontmatter blocks
    const cleanedContent = cleanCorruptedFrontmatter(content);
    const cleanedLines = cleanedContent.split('\n');

    // Find where actual content starts
    let contentStartIndex = 0;
    for (let i = 0; i < cleanedLines.length; i++) {
      if (cleanedLines[i].trim() && !cleanedLines[i].trim().startsWith('---')) {
        contentStartIndex = i;
        break;
      }
    }

    // Rebuild with new frontmatter and clean content
    const finalContent = [
      newFrontmatter,
      '',
      ...cleanedLines.slice(contentStartIndex)
    ].join('\n');

    return finalContent;
  }

  // Normal case: replace first frontmatter block
  const newLines = [
    ...lines.slice(0, bounds.start),
    newFrontmatter,
    ...lines.slice(bounds.end + 1)
  ];

  return newLines.join('\n');
}
