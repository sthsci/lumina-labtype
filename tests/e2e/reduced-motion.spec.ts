import { test, expect } from '@playwright/test';
import { fullAnswers, seedAnswers, seedLanguage } from './helpers';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

test.describe('reduced motion', () => {
  test('pipeline completes in under ~2 seconds and stays skippable', async ({ page }) => {
    await seedLanguage(page, 'en');
    await seedAnswers(page, fullAnswers());
    await page.goto('./pipeline');

    // skip is always available
    await expect(page.getByRole('button', { name: /Skip to result/ })).toBeVisible();

    // with reduced motion the whole 9-stage sequence finishes quickly
    await expect(page.getByRole('button', { name: 'Reveal my archetype' })).toBeVisible({
      timeout: 2500,
    });
    await page.getByRole('button', { name: 'Reveal my archetype' }).click();
    await expect(page.getByTestId('archetype-code')).toBeVisible();
  });

  test('result page renders fully with reduced motion', async ({ page }) => {
    await seedLanguage(page, 'en');
    await seedAnswers(page, fullAnswers());
    await page.goto('./result');
    await expect(page.getByTestId('archetype-code')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dimension radar' })).toBeVisible();
  });
});
