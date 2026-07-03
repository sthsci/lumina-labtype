import type { Page } from '@playwright/test';

/** Full 36-answer set (all "Agree") used to seed a deterministic result. */
export function fullAnswers(value = 4): Record<string, number> {
  return Object.fromEntries(
    Array.from({ length: 36 }, (_, i) => [`q${String(i + 1).padStart(2, '0')}`, value]),
  );
}

/** Seed localStorage before the app boots. */
export async function seedAnswers(page: Page, answers: Record<string, number>): Promise<void> {
  await page.addInitScript((data) => {
    localStorage.setItem('lumina:answers', JSON.stringify(data));
  }, answers);
}

export async function seedLanguage(page: Page, lang: string): Promise<void> {
  await page.addInitScript((l) => {
    localStorage.setItem('lumina:language', l);
  }, lang);
}
