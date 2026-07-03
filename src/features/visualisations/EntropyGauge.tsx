import { motion } from 'framer-motion';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import type { ScoreResult } from '@/features/scoring/types';

export function EntropyGauge({ result }: { result: ScoreResult }) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const value = result.entropy; // 0..1
  const phrase = value < 0.6 ? t('viz.entropy.low') : t('viz.entropy.high');

  // semicircle gauge
  const cx = 110;
  const cy = 100;
  const r = 78;
  const a0 = Math.PI;
  const a1 = 0;
  const angle = a0 + (a1 - a0) * value;
  const nx = cx + Math.cos(angle) * r;
  const ny = cy + Math.sin(angle) * r;

  const arc = (from: number, to: number) => {
    const x1 = cx + Math.cos(from) * r;
    const y1 = cy + Math.sin(from) * r;
    const x2 = cx + Math.cos(to) * r;
    const y2 = cy + Math.sin(to) * r;
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <ChartFrame
      title={t('viz.entropy.title')}
      description={t('viz.entropy.plain')}
      summary={t('viz.entropy.summary', { value: value.toFixed(2), phrase })}
    >
      <svg viewBox="0 0 220 130" className="mx-auto w-full max-w-xs" role="img" aria-label={t('viz.entropy.title')}>
        <path d={arc(Math.PI, 0)} fill="none" stroke="rgba(148,173,210,0.15)" strokeWidth={12} strokeLinecap="round" />
        <defs>
          <linearGradient id="entropy-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5fdcf7" />
            <stop offset="100%" stopColor="#f2b054" />
          </linearGradient>
        </defs>
        <motion.path
          d={arc(Math.PI, 0)}
          fill="none"
          stroke="url(#entropy-grad)"
          strokeWidth={12}
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: value }}
          transition={{ duration: reduced ? 0 : 0.9, ease: 'easeOut' }}
        />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#e8e2d1" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={4} fill="#e8e2d1" />
        <text x={cx} y={cy + 24} fontSize={22} fill="#e8e2d1" textAnchor="middle" className="font-mono">{value.toFixed(2)}</text>
        <text x={32} y={122} fontSize={8} fill="#8ea3c4">{t('viz.entropy.low')}</text>
        <text x={188} y={122} fontSize={8} fill="#8ea3c4" textAnchor="end">{t('viz.entropy.high')}</text>
      </svg>
      <p className="mt-2 text-center text-sm text-parchment/75">{phrase}</p>
    </ChartFrame>
  );
}
