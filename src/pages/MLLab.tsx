import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { ProfileBars } from '@/components/ProfileBars';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppStore } from '@/app/store';
import { useResult } from '@/features/results/useResult';
import { PCAProjection } from '@/features/visualisations/PCAProjection';
import { KMeansAnimation } from '@/features/visualisations/KMeansAnimation';
import { Dendrogram } from '@/features/visualisations/Dendrogram';
import { PhylogenyTree } from '@/features/visualisations/PhylogenyTree';
import { SimilarityMatrix } from '@/features/visualisations/SimilarityMatrix';
import { EntropyGauge } from '@/features/visualisations/EntropyGauge';
import { BootstrapStability } from '@/features/visualisations/BootstrapStability';
import { DecisionPlayground } from '@/features/visualisations/DecisionPlayground';

/** Two-layer explanation: precise wording + plain-language rephrasing. */
function Concept({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <div className="panel mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
      <div>
        <p className="kicker mb-1 text-[10px]">{t('mllab.academic')}</p>
        <p className="text-sm leading-relaxed text-parchment/85">{t(`mllab.concepts.${id}Academic`)}</p>
      </div>
      <div className="border-t border-line pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <p className="kicker mb-1 text-[10px] text-amber-glow/80">{t('mllab.plain')}</p>
        <p className="text-sm leading-relaxed text-parchment/75">{t(`mllab.concepts.${id}Plain`)}</p>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 border-b border-line pb-2 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function MLLab() {
  const { t } = useI18n();
  const result = useResult();
  const answers = useAppStore((s) => s.answers);

  const sections = [
    'vectors',
    'scaling',
    'distances',
    'pca',
    'clustering',
    'hierarchical',
    'bootstrap',
    'entropy',
    'decision',
  ] as const;

  return (
    <div className="space-y-10">
      <PageHeader kicker={t('common.fictionalBadge')} title={t('mllab.title')} subtitle={t('mllab.subtitle')}>
        <nav className="mt-5 flex flex-wrap gap-1.5" aria-label={t('mllab.title')}>
          {sections.map((s) => (
            <a key={s} href={`#${s}`} className="rounded-lg border border-line bg-white/[0.02] px-2.5 py-1 text-xs text-haze hover:text-parchment">
              {t(`mllab.sections.${s}`)}
            </a>
          ))}
        </nav>
      </PageHeader>

      {!result && (
        <div className="panel border-lumina-400/30 p-5">
          <h2 className="text-base font-semibold text-lumina-200">{t('mllab.noResultTitle')}</h2>
          <p className="mt-1 text-sm text-haze">{t('mllab.noResultBody')}</p>
          <Link to="/intro" className="btn-primary mt-4 inline-flex">
            {t('landing.cta')}
          </Link>
        </div>
      )}

      <Section id="vectors" title={t('mllab.sections.vectors')}>
        <Concept id="vectors" />
        {result && (
          <div className="panel p-5">
            <p className="mb-3 text-sm text-haze">{t('common.you')}</p>
            <ProfileBars vector={result.scores} height={90} />
          </div>
        )}
      </Section>

      <Section id="scaling" title={t('mllab.sections.scaling')}>
        <Concept id="scaling" />
        <div className="panel p-5 font-mono text-sm text-parchment/85">
          <p>z = (x − 3) / 2</p>
          <p className="mt-1">s = 50 + 50 · (Σ w·z) / (Σ |w|)</p>
          <p className="mt-3 font-sans text-xs text-haze">{t('methodology.scoringBody')}</p>
        </div>
      </Section>

      <Section id="distances" title={t('mllab.sections.distances')}>
        <Concept id="euclidean" />
        <Concept id="cosine" />
        {result ? (
          <div className="panel overflow-x-auto p-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-haze">
                  <th className="py-1.5 pr-3">Archetype</th>
                  <th className="py-1.5 pr-3">{t('viz.metrics.weighted')}</th>
                  <th className="py-1.5 pr-3">{t('viz.metrics.euclidean')}</th>
                  <th className="py-1.5 pr-3">{t('viz.metrics.cosine')}</th>
                  <th className="py-1.5 pr-3">{t('viz.metrics.pearson')}</th>
                  <th className="py-1.5">{t('viz.metrics.spearman')}</th>
                </tr>
              </thead>
              <tbody>
                {result.distances.filter((d) => !d.hidden).slice(0, 5).map((d) => (
                  <tr key={d.code} className="border-t border-line/60">
                    <td className="py-1.5 pr-3">
                      <span className="font-mono text-haze">{d.code}</span> {t(`archetypes.${d.code}.name`)}
                    </td>
                    <td className="py-1.5 pr-3 font-mono">{d.weighted.toFixed(1)}</td>
                    <td className="py-1.5 pr-3 font-mono">{d.euclidean.toFixed(1)}</td>
                    <td className="py-1.5 pr-3 font-mono">{d.cosine.toFixed(3)}</td>
                    <td className="py-1.5 pr-3 font-mono">{d.pearson.toFixed(3)}</td>
                    <td className="py-1.5 font-mono">{d.spearman.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="panel p-5 text-sm text-haze">{t('viz.common.noData')}</p>
        )}
      </Section>

      <Section id="pca" title={t('mllab.sections.pca')}>
        <Concept id="pca" />
        {result ? <PCAProjection result={result} /> : <p className="panel p-5 text-sm text-haze">{t('viz.common.noData')}</p>}
      </Section>

      <Section id="clustering" title={t('mllab.sections.clustering')}>
        <Concept id="kmeans" />
        <KMeansAnimation />
      </Section>

      <Section id="hierarchical" title={t('mllab.sections.hierarchical')}>
        <Concept id="hierarchical" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Dendrogram result={result ?? undefined} />
          <PhylogenyTree highlight={result?.primary} />
        </div>
        <div className="mt-5">
          <SimilarityMatrix result={result ?? undefined} />
        </div>
      </Section>

      <Section id="bootstrap" title={t('mllab.sections.bootstrap')}>
        <Concept id="bootstrap" />
        {result ? <BootstrapStability answers={answers} /> : <p className="panel p-5 text-sm text-haze">{t('viz.common.noData')}</p>}
      </Section>

      <Section id="entropy" title={t('mllab.sections.entropy')}>
        <Concept id="entropy" />
        {result ? <EntropyGauge result={result} /> : <p className="panel p-5 text-sm text-haze">{t('viz.common.noData')}</p>}
      </Section>

      <Section id="decision" title={t('mllab.sections.decision')}>
        <Concept id="decision" />
        <DecisionPlayground result={result ?? undefined} />
      </Section>
    </div>
  );
}
