import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';

export function About() {
  const { t } = useI18n();
  return (
    <div className="max-w-3xl">
      <PageHeader title={t('about.title')} />
      <div className="space-y-5">
        <section className="panel p-6">
          <p className="text-parchment/85 leading-relaxed">{t('about.body')}</p>
        </section>
        {[
          ['openSourceTitle', 'openSourceBody'],
          ['creditsTitle', 'creditsBody'],
        ].map(([title, body]) => (
          <section key={title} className="panel p-5">
            <h2 className="text-lg font-semibold">{t(`about.${title}`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment/80">{t(`about.${body}`)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
