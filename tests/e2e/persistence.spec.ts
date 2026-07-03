import { test, expect } from '@playwright/test';
import { fullAnswers, seedAnswers, seedLanguage } from './helpers';

test.describe('persistence and local data', () => {
  test('progress is restored after a reload', async ({ page }) => {
    await seedLanguage(page, 'en');
    await page.goto('./test');

    for (let i = 0; i < 3; i += 1) {
      await page.getByRole('radio').nth(2).click();
      await expect(page.getByText(`Question ${i + 2} of 36`)).toBeVisible();
    }
    await page.reload();
    await expect(page.getByText('3 of 36 answered')).toBeVisible();
  });

  test('restart clears answers', async ({ page }) => {
    await seedLanguage(page, 'en');
    await seedAnswers(page, fullAnswers());
    await page.goto('./result');
    await page.getByRole('button', { name: 'Take the test again' }).click();
    await expect(page.getByText('0 of 36 answered')).toBeVisible();
  });

  test('privacy page erases all local lumina data', async ({ page }) => {
    await seedLanguage(page, 'en');
    await seedAnswers(page, fullAnswers());
    await page.goto('./privacy');
    await page.getByRole('button', { name: 'Delete all my local data now' }).click();
    await expect(page.getByText('Done — your local data has been erased.')).toBeVisible();
    const luminaKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith('lumina:')),
    );
    expect(luminaKeys).toEqual([]);
  });

  test('result page delete button erases data after confirm', async ({ page }) => {
    await seedLanguage(page, 'en');
    await seedAnswers(page, fullAnswers());
    await page.goto('./result');
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete all my local data' }).click();
    await expect(page).toHaveURL(/\/lumina-labtype\/?$/);
    const answers = await page.evaluate(() => localStorage.getItem('lumina:answers'));
    expect(answers).toBeNull();
  });
});
