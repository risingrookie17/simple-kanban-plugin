import { test, expect } from '@playwright/test';

test.describe('Kanban Drag and Drop', () => {

  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', msg => console.log(`[Browser ${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[Browser Error] ${err}`));

    // Navigate to test page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for scripts to load
    await page.waitForTimeout(1000);
  });

  test('should load and execute JavaScript', async ({ page }) => {
    // Check if tasks are loaded
    const tasksLoaded = await page.evaluate(() => typeof window.tasks !== 'undefined');
    expect(tasksLoaded).toBe(true);
  });

  test('should display three columns', async ({ page }) => {
    await page.waitForSelector('.simple-kanban-column', { timeout: 5000 });

    const columns = await page.locator('.simple-kanban-column').all();
    expect(columns).toHaveLength(3);

    await expect(page.locator('.simple-kanban-column[data-status="todo"] h3')).toHaveText('待处理');
    await expect(page.locator('.simple-kanban-column[data-status="doing"] h3')).toHaveText('进行中');
    await expect(page.locator('.simple-kanban-column[data-status="done"] h3')).toHaveText('已完成');
  });

  test('should show correct task counts', async ({ page }) => {
    await page.waitForSelector('.simple-kanban-column', { timeout: 5000 });

    await expect(page.locator('.simple-kanban-column[data-status="todo"] .simple-kanban-task-count')).toHaveText('2');
    await expect(page.locator('.simple-kanban-column[data-status="doing"] .simple-kanban-task-count')).toHaveText('1');
    await expect(page.locator('.simple-kanban-column[data-status="done"] .simple-kanban-task-count')).toHaveText('1');
  });

  test('should drag task from todo to doing column', async ({ page }) => {
    await page.waitForSelector('.simple-kanban-card', { timeout: 5000 });

    const card = page.locator('.simple-kanban-column[data-status="todo"] .simple-kanban-card').first();
    const cardTitle = await card.locator('.simple-kanban-card-title').textContent();

    const doingColumn = page.locator('.simple-kanban-column[data-status="doing"] .simple-kanban-task-list');
    await card.dragTo(doingColumn);
    await page.waitForTimeout(500);

    const doingCards = await doingColumn.locator('.simple-kanban-card').all();
    const doingTitles = await Promise.all(doingCards.map(c => c.locator('.simple-kanban-card-title').textContent()));
    expect(doingTitles).toContain(cardTitle);

    await expect(page.locator('.simple-kanban-column[data-status="todo"] .simple-kanban-task-count')).toHaveText('1');
    await expect(page.locator('.simple-kanban-column[data-status="doing"] .simple-kanban-task-count')).toHaveText('2');
  });

  test('should update file frontmatter correctly after drag', async ({ page }) => {
    await page.waitForSelector('.simple-kanban-card', { timeout: 5000 });

    const card = page.locator('.simple-kanban-column[data-status="todo"] .simple-kanban-card').first();
    const doingColumn = page.locator('.simple-kanban-column[data-status="doing"] .simple-kanban-task-list');

    await card.dragTo(doingColumn);
    await page.waitForTimeout(500);

    const fileContent = await page.evaluate(() => {
      const tasks = (window as any).tasks;
      for (const [id, task] of tasks) {
        if (task.title === 'Test Task 1') {
          return (window as any).mockVault.files.get(task.filePath);
        }
      }
      return null;
    });

    expect(fileContent).toContain('status: doing');
    expect(fileContent).toContain('start_date:');
  });
});
