import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { EmblemGlyph } from '@/components/Emblem';
import { ProfileBars } from '@/components/ProfileBars';
import { useI18n } from '@/i18n/I18nProvider';
import { useResult } from '@/features/results/useResult';
import { hiddenArchetypes, visibleArchetypes, archetypeByCode } from '@/data/content';
import { PhylogenyTree } from '@/features/visualisations/PhylogenyTree';
import type { Archetype } from '@/data/schemas';

export function Atlas() {
  const { t, raw } = useI18n();
  const result = useResult();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleArchetypes;
    return visibleArchetypes.filter((a) => {
      const name = t(`archetypes.${a.code}.name`).toLowerCase();
      const tagline = t(`archetypes.${a.code}.tagline`).toLowerCase();
      const keywords = raw<string[]>(`archetypes.${a.code}.keywords`).join(' ').toLowerCase();
      return a.code.toLowerCase().includes(q) || name.includes(q) || tagline.includes(q) || keywords.includes(q);
    });
  }, [query, t, raw]);

  const selectedArchetype = selected ? archetypeByCode.get(selected) : null;

  return (
    <div className="space-y-8">
      <PageHeader kicker={t('common.fictionalBadge')} title={t('atlas.title')} subtitle={t('atlas.subtitle')}>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('atlas.searchPlaceholder')}
            aria-label={t('atlas.searchPlaceholder')}
            className="w-full max-w-xs rounded-xl border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-parchment placeholder:text-haze/60 focus:border-lumina-400/60 focus:outline-none"
          />
          <span className="text-xs text-haze">{t('atlas.visibleCount', { count: filtered.length })}</span>
        </div>
      </PageHeader>

      <PhylogenyTree highlight={result?.primary} />

      {/* card grid */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((a, i) => (
          <motion.li
            key={a.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
          >
            <button
              type="button"
              onClick={() => setSelected(selected === a.code ? null : a.code)}
              aria-expanded={selected === a.code}
              className={`card-hover flex w-full flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors hover:-translate-y-0.5 ${
                selected === a.code
                  ? 'border-lumina-400 bg-lumina-400/10'
                  : result?.primary === a.code
                    ? 'border-amber-glow/60 bg-amber-glow/5'
                    : 'border-line bg-panel'
              }`}
            >
              <EmblemGlyph emblem={a.emblem} size={72} title={a.code} />
              <span className="font-mono text-[10px] tracking-[0.25em] text-haze">{a.code}</span>
              <span className="text-sm font-semibold leading-tight text-parchment">{t(`archetypes.${a.code}.name`)}</span>
              <span className="text-xs leading-snug text-haze">{t(`archetypes.${a.code}.tagline`)}</span>
              {result?.primary === a.code && (
                <span className="rounded-full bg-amber-glow/15 px-2 py-0.5 text-[10px] text-amber-glow">{t('common.you')} ★</span>
              )}
            </button>
          </motion.li>
        ))}
      </ul>

      {/* detail panel */}
      {selectedArchetype && <DetailPanel archetype={selectedArchetype} onClose={() => setSelected(null)} />}

      {/* hidden archetypes */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">{t('atlas.hiddenSection')}</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {hiddenArchetypes.map((a) => {
            const unlocked = result?.hidden.archetype === a.code;
            return (
              <li key={a.code} className="panel flex flex-col items-center gap-2 p-5 text-center">
                {unlocked ? (
                  <>
                    <EmblemGlyph emblem={a.emblem} size={72} title={a.code} />
                    <span className="font-mono text-[10px] tracking-[0.25em] text-amber-glow">{a.code}</span>
                    <span className="text-sm font-semibold">{t(`archetypes.${a.code}.name`)}</span>
                    <span className="text-xs text-haze">{t(`archetypes.${a.code}.tagline`)}</span>
                    <span className="text-[11px] text-amber-glow">★ {t('atlas.hiddenUnlockedBody')}</span>
                    <button type="button" className="btn-quiet mt-1 px-3 py-1 text-xs" onClick={() => setSelected(a.code)}>
                      {t('atlas.openDetail')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-dashed border-line text-2xl text-haze/50" aria-hidden="true">
                      ?
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.25em] text-haze/60">???</span>
                    <span className="text-sm font-semibold text-haze">{t('atlas.hiddenLockedTitle')}</span>
                    <span className="text-xs text-haze/80">{t('atlas.hiddenLockedBody')}</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function DetailPanel({ archetype, onClose }: { archetype: Archetype; onClose: () => void }) {
  const { t, raw } = useI18n();
  const code = archetype.code;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel border-lumina-400/40 p-6"
      aria-label={t(`archetypes.${code}.name`)}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <EmblemGlyph emblem={archetype.emblem} size={84} title={code} />
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-amber-glow">{code}</p>
            <h3 className="text-2xl font-semibold">{t(`archetypes.${code}.name`)}</h3>
            <p className="text-sm text-lumina-200">{t(`archetypes.${code}.tagline`)}</p>
          </div>
        </div>
        <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-parchment/85">{t(`archetypes.${code}.description`)}</p>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-lumina-200">{t('result.strengths')}</h4>
          <ul className="mt-1.5 space-y-1 text-sm text-parchment/80">
            {raw<string[]>(`archetypes.${code}.strengths`).map((s, i) => (
              <li key={i}>· {s}</li>
            ))}
          </ul>
          <h4 className="mt-4 text-sm font-semibold text-amber-glow">{t('result.blindSpots')}</h4>
          <ul className="mt-1.5 space-y-1 text-sm text-parchment/80">
            {raw<string[]>(`archetypes.${code}.blindSpots`).map((s, i) => (
              <li key={i}>· {s}</li>
            ))}
          </ul>
        </div>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-semibold">{t('result.teamRole')}</dt>
            <dd className="text-parchment/80">{t(`archetypes.${code}.teamRole`)}</dd>
          </div>
          <div>
            <dt className="font-semibold">{t('result.reviewerTwo')}</dt>
            <dd className="text-parchment/80">{t(`archetypes.${code}.reviewerTwo`)}</dd>
          </div>
          <div>
            <dt className="font-semibold">{t('result.failureMode')}</dt>
            <dd className="text-parchment/80">{t(`archetypes.${code}.failureMode`)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-lumina-200">{t('result.survivalAdvice')}</dt>
            <dd className="text-parchment/80">{t(`archetypes.${code}.survivalAdvice`)}</dd>
          </div>
          <div className="flex gap-6">
            <div>
              <dt className="font-semibold">{t('result.idealCollaborator')}</dt>
              <dd className="text-parchment/80">
                <span className="font-mono text-xs text-haze">{archetype.idealCollaborator}</span>{' '}
                {t(`archetypes.${archetype.idealCollaborator}.name`)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">{t('result.difficultCollaborator')}</dt>
              <dd className="text-parchment/80">
                <span className="font-mono text-xs text-haze">{archetype.difficultCollaborator}</span>{' '}
                {t(`archetypes.${archetype.difficultCollaborator}.name`)}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold">{t('atlas.prototypeTitle')}</h4>
        <ProfileBars vector={archetype.vector} height={70} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {raw<string[]>(`archetypes.${code}.keywords`).map((k) => (
          <span key={k} className="rounded-full border border-line bg-white/[0.03] px-2.5 py-0.5 text-xs text-haze">
            #{k}
          </span>
        ))}
      </div>
    </motion.section>
  );
}
