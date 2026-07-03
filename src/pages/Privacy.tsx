import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppStore } from '@/app/store';

export function Privacy() {
  const { t, raw } = useI18n();
  const clearAllData = useAppStore((s) => s.clearAllData);
  const [done, setDone] = useState(false);

  return (
    <div className="max-w-3xl">
      <PageHeader title={t('privacy.title')} subtitle={t('privacy.intro')} />
      <section className="panel p-5">
        <ul className="space-y-2.5">
          {raw<string[]>('privacy.points').map((point, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-parchment/80">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lumina-300" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              clearAllData();
              setDone(true);
            }}
          >
            {t('privacy.deleteButton')}
          </button>
          {done && (
            <p className="mt-3 text-sm text-lumina-200" role="status">
              {t('privacy.deleted')}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
