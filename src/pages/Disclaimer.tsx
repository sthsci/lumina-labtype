import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';

export function Disclaimer() {
  const { t } = useI18n();
  return (
    <div className="max-w-3xl">
      <PageHeader title={t('disclaimer.title')} />
      <section className="panel p-6">
        <p className="text-parchment/85 leading-relaxed">{t('disclaimer.body')}</p>
        <p className="mt-4 border-t border-line pt-4 text-sm text-haze leading-relaxed">
          {t('disclaimer.hiddenNote')}
        </p>
      </section>
    </div>
  );
}
