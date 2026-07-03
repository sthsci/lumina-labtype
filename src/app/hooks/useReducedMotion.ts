import { useEffect, useState } from 'react';
import { useAppStore } from '@/app/store';

/**
 * Effective reduced-motion state = app setting (if explicitly set) OR the OS
 * `prefers-reduced-motion` media query. Also mirrors the state onto a
 * documentElement data attribute so global CSS can respond.
 */
export function useReducedMotion(): boolean {
  const setting = useAppStore((s) => s.settings.reducedMotion);
  const [system, setSystem] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setSystem(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const reduced = setting === null ? system : setting;

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced);
  }, [reduced]);

  return reduced;
}
