import { test, expect, type Page } from '@playwright/test';
import { seedLanguage } from './helpers';

/** The language switcher lives in the burger menu on small viewports. */
async function openLanguageSwitcher(page: Page): Promise<void> {
  const burger = page.getByRole('button', { name: /Open menu|打开菜单|開啟選單/ });
  if (await burger.isVisible().catch(() => false)) {
    await burger.click();
  }
}

test.describe('internationalisation', () => {
  test('language switch updates the interface and persists', async ({ page }) => {
    // Playwright's default locale is en-US, so the app boots in English.
    // (Deliberately no init-script seeding here: it would re-seed on reload
    // and mask the persistence we are asserting.)
    await page.goto('./');
    await expect(page.getByText('Fifteen variables describing how you decide, collaborate and survive in the lab.').first()).toBeVisible();

    await openLanguageSwitcher(page);
    await page.getByRole('button', { name: '简体中文' }).first().click();
    await expect(page.getByText('用十五维变量，描绘你在实验室里的决策、协作与生存方式。').first()).toBeVisible();

    // persists across reload via localStorage
    await page.reload();
    await expect(page.getByText('用十五维变量，描绘你在实验室里的决策、协作与生存方式。').first()).toBeVisible();

    // traditional Chinese
    await openLanguageSwitcher(page);
    await page.getByRole('button', { name: '繁體中文' }).first().click();
    await expect(page.getByText('用十五維變量，描繪你在實驗室裡的決策、協作與生存方式。').first()).toBeVisible();
  });

  test('html lang attribute follows the selection', async ({ page }) => {
    await seedLanguage(page, 'zh-CN');
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  });
});
