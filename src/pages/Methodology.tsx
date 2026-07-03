import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-parchment/80">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lumina-300" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Methodology() {
  const { t, raw } = useI18n();
  return (
    <div className="max-w-3xl">
      <PageHeader title={t('methodology.title')} subtitle={t('methodology.intro')} />
      <div className="space-y-5">
        <section className="panel p-5">
          <h2 className="text-lg font-semibold text-lumina-200">{t('methodology.realTitle')}</h2>
          <List items={raw<string[]>('methodology.realList')} />
        </section>
        <section className="panel p-5">
          <h2 className="text-lg font-semibold text-amber-glow">{t('methodology.fictionTitle')}</h2>
          <List items={raw<string[]>('methodology.fictionList')} />
        </section>
        {[
          ['scoringTitle', 'scoringBody'],
          ['syntheticTitle', 'syntheticBody'],
          ['contributionTitle', 'contributionBody'],
          ['enrichmentTitle', 'enrichmentBody'],
          ['treeTitle', 'treeBody'],
          ['noClaimsTitle', 'noClaimsBody'],
        ].map(([title, body]) => (
          <section key={title} className="panel p-5">
            <h2 className="text-lg font-semibold">{t(`methodology.${title}`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment/80">{t(`methodology.${body}`)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
