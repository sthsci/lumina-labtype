import { test, expect } from '@playwright/test';
import { seedLanguage } from './helpers';

test.describe('complete test journey', () => {
  test('landing → intro → context → 36 questions → pipeline → result', async ({ page }) => {
    test.slow();
    await seedLanguage(page, 'en');
    await page.goto('./');

    // landing
    await expect(page.getByRole('heading', { level: 1 })).toContainText('LBTI');
    await page.getByRole('link', { name: 'Start the test' }).click();

    // intro
    await expect(page.getByRole('heading', { name: 'Before you begin' })).toBeVisible();
    await page.getByRole('link', { name: 'Choose your context' }).click();

    // context
    await page.getByRole('button', { name: 'Computational / data' }).click();
    await page.getByRole('button', { name: 'PhD', exact: true }).click();
    await page.getByRole('button', { name: 'Start the questions' }).click();

    // 36 questions — answer "Agree" (4th option) each time
    for (let i = 0; i < 36; i += 1) {
      await expect(page.getByText(`Question ${i + 1} of 36`)).toBeVisible();
      await page.getByRole('radio').nth(3).click();
      if (i < 35) {
        await expect(page.getByText(`Question ${i + 2} of 36`)).toBeVisible();
      }
    }

    // finish
    await page.getByRole('button', { name: 'All answered — run the analysis' }).click();

    // pipeline
    await expect(page.getByRole('heading', { name: 'Analysing your profile' })).toBeVisible();
    await page.getByRole('button', { name: /Skip to result/ }).click();

    // result
    await expect(page.getByText('Your fictional research archetype')).toBeVisible();
    await expect(page.getByTestId('archetype-code')).toBeVisible();
  });

  test('pipeline redirects to the test when nothing is answered', async ({ page }) => {
    await seedLanguage(page, 'en');
    await page.goto('./pipeline');
    await expect(page.getByText('Question 1 of 36')).toBeVisible();
  });
});
