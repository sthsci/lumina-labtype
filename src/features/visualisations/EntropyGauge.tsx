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
  const cx = 130;
  const cy = 112;
  const r = 88;
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
      <svg viewBox="0 0 260 155" className="mx-auto w-full max-w-sm" role="img" aria-label={t('viz.entropy.title')}>
        <path d={arc(Math.PI, 0)} fill="none" stroke="rgba(52,64,80,0.15)" strokeWidth={12} strokeLinecap="round" />
        <defs>
          <linearGradient id="entropy-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0d7f9b" />
            <stop offset="100%" stopColor="#c26d10" />
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
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#262b31" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={4} fill="#262b31" />
        <text x={cx} y={cy + 31} fontSize={24} fill="#262b31" textAnchor="middle" className="font-mono">{value.toFixed(2)}</text>
      </svg>
      <div className="mx-auto mt-1 flex max-w-sm items-start justify-between gap-4 text-[11px] leading-snug text-haze">
        <span className="max-w-[45%]">{t('viz.entropy.low')}</span>
        <span className="max-w-[45%] text-right">{t('viz.entropy.high')}</span>
      </div>
      <p className="mt-2 text-center text-sm text-parchment/75">{phrase}</p>
    </ChartFrame>
  );
}
