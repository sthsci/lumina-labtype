import { useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { scoreColor } from './palette';
import type { ScoreResult } from '@/features/scoring/types';

const W = 340;
const ROW = 24;
const PAD_L = 96;
const PAD_R = 24;

export function ThemeDotPlot({ result }: { result: ScoreResult }) {
  const { t } = useI18n();
  const themes = useMemo(
    () => [...result.themeScores].sort((a, b) => b.specificity - a.specificity),
    [result.themeScores],
  );
  const topTheme = themes[0];
  const x = scaleLinear([0, 100], [PAD_L, W - PAD_R]);
  const maxInform = Math.max(1, ...themes.map((th) => th.informativeQuestions));
  const H = themes.length * ROW + 30;

  return (
    <ChartFrame
      title={t('viz.themeDot.title')}
      description={t('viz.themeDot.plain')}
      summary={t('viz.themeDot.summary', { topTheme: t(`themes.${topTheme.id}`) })}
      table={
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-haze"><th className="py-1 pr-3">Theme</th><th className="py-1 pr-3">Score</th><th className="py-1 pr-3">Questions</th><th className="py-1">Specificity</th></tr>
          </thead>
          <tbody>
            {themes.map((th) => (
              <tr key={th.id} className="border-t border-line/60">
                <td className="py-1 pr-3">{t(`themes.${th.id}`)}</td>
                <td className="py-1 pr-3 font-mono">{Math.round(th.score)}</td>
                <td className="py-1 pr-3 font-mono">{th.informativeQuestions}</td>
                <td className="py-1 font-mono">{th.specificity.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-lg" role="img" aria-label={t('viz.themeDot.title')}>
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} y1={16} x2={x(tick)} y2={H - 14} stroke="rgba(148,173,210,0.1)" />
            <text x={x(tick)} y={H - 4} fontSize={7} fill="#8ea3c4" textAnchor="middle">{tick}</text>
          </g>
        ))}
        {themes.map((th, i) => {
          const cy = 26 + i * ROW;
          const size = 4 + (th.informativeQuestions / maxInform) * 8;
          return (
            <g key={th.id}>
              <text x={PAD_L - 8} y={cy + 3} fontSize={9} fill="#e8e2d1" textAnchor="end">{t(`themes.${th.id}`)}</text>
              <line x1={PAD_L} y1={cy} x2={x(th.score)} y2={cy} stroke="rgba(148,173,210,0.15)" />
              <circle
                cx={x(th.score)}
                cy={cy}
                r={size}
                fill={scoreColor(th.score)}
                stroke="#e8e2d1"
                strokeOpacity={0.3 + th.specificity * 0.7}
                strokeWidth={1 + th.specificity * 2}
              />
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-[11px] text-haze">{t('viz.themeDot.note')}</p>
    </ChartFrame>
  );
}
