import { test, expect } from '@playwright/test';
import { fullAnswers, seedAnswers, seedLanguage } from './helpers';

test.describe('result page (direct navigation under the Pages subpath)', () => {
  test.beforeEach(async ({ page }) => {
    await seedLanguage(page, 'en');
    await seedAnswers(page, fullAnswers());
  });

  test('renders deterministic result with charts and text alternatives', async ({ page }) => {
    await page.goto('./result');
    await expect(page.getByTestId('archetype-code')).toBeVisible();
    const code = await page.getByTestId('archetype-code').textContent();

    // determinism: reload gives the same archetype
    await page.reload();
    await expect(page.getByTestId('archetype-code')).toHaveText(code!.trim());

    // core visualisations present
    await expect(page.getByRole('heading', { name: 'Dimension radar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Principal-component map' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nearest-neighbour map' })).toBeVisible();

    // chart data-table alternative is keyboard reachable
    const tableToggle = page.getByRole('button', { name: 'View data table' }).first();
    await tableToggle.focus();
    await tableToggle.press('Enter');
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('exports a share card PNG', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'download assertion on chromium only');
    test.slow();
    await page.goto('./result');
    await page.getByTestId('share-download').scrollIntoViewIfNeeded();
    const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
    await page.getByTestId('share-download').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('lumina-labtype');
  });

  test('ml-lab and atlas load directly under the subpath', async ({ page }) => {
    await page.goto('./ml-lab');
    await expect(page.getByRole('heading', { name: 'ML Lab' })).toBeVisible();
    await page.goto('./atlas');
    await expect(page.getByRole('heading', { name: 'Archetype atlas' })).toBeVisible();
  });

  test('optionally records the result as a cohort cell', async ({ page }) => {
    await page.goto('./result');
    await page.getByRole('button', { name: 'Save as cohort cell' }).click();
    await expect(page.getByText('Saved to the local cohort database on this device.')).toBeVisible();

    await page.getByRole('link', { name: 'Open cohort atlas' }).click();
    await expect(page.getByRole('heading', { name: 'Cohort atlas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'scRNA-style cohort cluster plot' })).toBeVisible();
    await expect(page.getByText('1 cells')).toBeVisible();
  });
});
