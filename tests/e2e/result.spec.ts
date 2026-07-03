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
    expect(download.suggestedFilename()).toContain('lbti-');
  });

  test('ml-lab and atlas load directly under the subpath', async ({ page }) => {
    await page.goto('./ml-lab');
    await expect(page.getByRole('heading', { name: 'ML Lab' })).toBeVisible();
    await page.goto('./atlas');
    await expect(page.getByRole('heading', { name: 'Archetype atlas' })).toBeVisible();
  });

  test('cohort join never fakes success (blocked network shows a real state)', async ({ page }) => {
    // Block the Supabase REST API. Depending on whether credentials are present
    // in this build, the app must surface EITHER "upload failed" (real error)
    // or "not configured" — but never a false "saved".
    await page.route('**/rest/v1/**', (route) => route.abort());
    await page.goto('./result');
    await page.getByTestId('cohort-save').click();

    const failed = page.getByText('Upload failed');
    const unconfigured = page.getByText('The shared database is not configured, so nothing was uploaded.');
    await expect(failed.or(unconfigured)).toBeVisible();
    // must NOT claim success
    await expect(page.getByText('Added to the public map')).toHaveCount(0);

    await page.getByRole('link', { name: 'Open cohort atlas' }).click();
    await expect(page.getByRole('heading', { name: 'Cohort atlas' })).toBeVisible();
  });

  test('renders the LBTI × SBTI × zodiac cross-reading with eight aspects', async ({ page }) => {
    await page.goto('./result');
    const cross = page.getByRole('region', { name: 'Cross-reading: LBTI × SBTI (not MBTI) × zodiac' });
    await expect(cross).toBeVisible();
    // choose an SBTI type and a star sign; text updates deterministically
    await cross.getByLabel('Your SBTI type (optional)').selectOption('CTRL');
    await cross.getByLabel('Your star sign (optional)').selectOption('leo');
    await expect(cross.getByText('Research decisions', { exact: true })).toBeVisible();
    await expect(cross.getByText('Best-fit lab role', { exact: true })).toBeVisible();
  });
});
