import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { useI18n } from '@/i18n/I18nProvider';
import { EmblemGlyph } from '@/components/Emblem';
import { LogoMark } from '@/app/Layout';
import { archetypeByCode } from '@/data/content';
import { canonicalUrl, BASE_URL } from '@/lib/basePath';
import { fitPca, projectPoint } from '@/lib/mathematics';
import { prototypeMatrix } from '@/features/visualisations/synthetic';
import { getShareCopy } from './shareCopy';
import type { ScoreResult } from '@/features/scoring/types';

/**
 * LBTI share cards — light "lab poster" system.
 *
 * Four formats: square card, portrait poster, tall identity card (WeChat /
 * Xiaohongshu friendly) and a compact result summary. All rendered on warm
 * paper with the archetype's own hue family, exported client-side as PNG.
 * Never contains raw answers.
 */
type Format = 'square' | 'portrait' | 'wechat' | 'landscape';
const FORMATS: { id: Format; w: number; h: number }[] = [
  { id: 'square', w: 540, h: 540 },
  { id: 'portrait', w: 480, h: 760 },
  { id: 'wechat', w: 420, h: 748 },
  { id: 'landscape', w: 720, h: 420 },
];

const PAPER = '#f6f3ec';
const CARD = '#fdfcf8';
const INK = '#22262c';
const GREY = '#5f6774';
const SERIF = 'LSRoman, "Latin Modern Roman", "Times New Roman", "Songti SC", "Noto Serif SC", STSong, serif';
const SANS = 'Inter, system-ui, "PingFang SC", "Noto Sans SC", "Noto Sans TC", sans-serif';
const MONO = 'Monaco, Menlo, Consolas, "SF Mono", monospace';

export function ShareCard({ result }: { result: ScoreResult }) {
  const { t, lang } = useI18n();
  const [format, setFormat] = useState<Format>('portrait');
  const [qr, setQr] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const archetype = archetypeByCode.get(result.primary)!;
  const hue = archetype.emblem.hue;
  const deep = `hsl(${hue}, 52%, 30%)`;
  const tint = `hsl(${hue}, 46%, 92%)`;
  const tintBorder = `hsl(${hue}, 36%, 78%)`;
  const copy = getShareCopy(lang, result.primary);
  const secondaryName = t(`archetypes.${result.secondary}.name`);

  const url = useMemo(
    () => canonicalUrl(typeof window !== 'undefined' ? window.location.origin : 'https://example.github.io', BASE_URL),
    [],
  );

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 132, color: { dark: INK, light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [url]);

  const map = useMemo(() => buildShareMap(result), [result]);

  const spec = FORMATS.find((f) => f.id === format)!;
  const mapCaption = formatMapCaption(lang, copy.headline, secondaryName);
  const mapTitle = formatMapTitle(lang);
  const hereLabel = formatHereLabel(lang);

  const download = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: PAPER });
      const link = document.createElement('a');
      link.download = `lbti-${result.primary}-${format}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setBusy(false);
    }
  };

  /* shared fragments ----------------------------------------------------- */

  const Brand = ({ caption = true }: { caption?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <LogoMark size={26} />
      <span style={{ lineHeight: 1 }}>
        <span style={{ display: 'block', fontFamily: SERIF, fontWeight: 700, fontSize: 16, color: INK }}>LBTI</span>
        {caption && (
          <span style={{ display: 'block', fontSize: 7, letterSpacing: 1.4, textTransform: 'uppercase', color: GREY, marginTop: 2 }}>
            {t('common.appFullName')}
          </span>
        )}
      </span>
    </div>
  );

  const Footer = ({ compact = false, qrSize = 54 }: { compact?: boolean; qrSize?: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${tintBorder}`, paddingTop: compact ? 7 : 9 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: MONO, fontSize: compact ? 8 : 9, color: GREY, wordBreak: 'break-all' }}>{url}</div>
      </div>
      {qr && <img src={qr} alt="QR code" width={qrSize} height={qrSize} style={{ borderRadius: 6, border: `1px solid ${tintBorder}` }} />}
    </div>
  );

  const CodeChip = ({ size = 13 }: { size?: number }) => (
    <span
      style={{
        display: 'inline-block',
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: 4,
        color: '#fdfcf8',
        background: deep,
        borderRadius: 8,
        padding: '5px 12px 5px 16px',
      }}
    >
      {result.primary}
    </span>
  );

  const TraitRow = ({ large = false }: { large?: boolean }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
      {copy.traits.map((trait) => (
        <span
          key={trait}
          style={{
            background: tint,
            border: `1px solid ${tintBorder}`,
            color: deep,
            fontSize: large ? 12 : 10,
            fontWeight: 700,
            padding: large ? '5px 9px' : '4px 8px',
            borderRadius: 999,
            lineHeight: 1.25,
          }}
        >
          {trait}
        </span>
      ))}
    </div>
  );

  const TextBlock = ({ label, body, compact = false }: { label: string; body: string; compact?: boolean }) => (
    <div style={{ borderLeft: `4px solid ${deep}`, background: tint, padding: compact ? '7px 9px' : '9px 11px', borderRadius: 8 }}>
      <div style={{ fontFamily: MONO, fontSize: compact ? 8 : 9, letterSpacing: 1.2, textTransform: 'uppercase', color: deep, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ marginTop: 3, fontSize: compact ? 11 : 12, lineHeight: 1.4, color: INK }}>{body}</div>
    </div>
  );

  /* format layouts -------------------------------------------------------- */

  const cardBase: React.CSSProperties = {
    width: spec.w,
    height: spec.h,
    background: CARD,
    border: `1px solid ${tintBorder}`,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: SANS,
    color: INK,
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            className={`rounded-lg px-3 py-1.5 text-xs ${format === f.id ? 'bg-lumina-300 text-void' : 'btn-ghost'}`}
            onClick={() => setFormat(f.id)}
            aria-pressed={format === f.id}
          >
            {t(`result.share.${f.id}`)}
          </button>
        ))}
        <button
          className="btn-primary ml-auto px-4 py-1.5 text-sm"
          onClick={download}
          disabled={busy}
          data-testid="share-download"
        >
          {busy ? t('common.loading') : t('result.share.download')}
        </button>
      </div>

      {result.primary === 'PREPRINT' && (
        <p className="mb-3 text-xs text-haze">
          bioRxiv and arXiv names are shown as plain text platform references; their names and marks belong to their respective owners.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-void p-4">
        <div ref={cardRef} className="mx-auto" style={cardBase} data-testid="share-card-preview">
          {format === 'square' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
                <Brand />
                <CodeChip size={10} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: 18, padding: '14px 24px 8px' }}>
                <EmblemGlyph emblem={archetype.emblem} code={result.primary} size={160} title={result.primary} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 800, lineHeight: 1.08 }}>{copy.headline}</div>
                  <div style={{ marginTop: 10, fontFamily: SERIF, fontSize: 17, lineHeight: 1.35, color: INK }}>“{copy.quote}”</div>
                </div>
              </div>
              {result.primary === 'PREPRINT' && <PlatformBadges deep={deep} tintBorder={tintBorder} />}
              <div style={{ padding: '0 20px 14px', display: 'grid', gap: 10 }}>
                <PersonalityMap map={map} primary={result.primary} secondary={result.secondary} deep={deep} tint={tint} tintBorder={tintBorder} caption={mapCaption} title={mapTitle} hereLabel={hereLabel} compact />
                <Footer compact qrSize={48} />
              </div>
            </>
          )}

          {format === 'portrait' && (
            <>
              <div style={{ padding: '18px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Brand />
                <span style={{ fontSize: 9, color: GREY }}>{t('common.fictionalBadge')}</span>
              </div>
              <div style={{ padding: '10px 26px 0', display: 'grid', justifyItems: 'center', gap: 7 }}>
                <EmblemGlyph emblem={archetype.emblem} code={result.primary} size={150} title={result.primary} />
                <CodeChip />
                <div style={{ fontFamily: SERIF, fontSize: 31, fontWeight: 800, lineHeight: 1.08, textAlign: 'center' }}>{copy.headline}</div>
                <div style={{ fontSize: 14, lineHeight: 1.45, color: INK, textAlign: 'center', maxWidth: 390 }}>{copy.tagline}</div>
                {result.primary === 'PREPRINT' && <PlatformBadges deep={deep} tintBorder={tintBorder} />}
              </div>
              <div style={{ flex: 1, padding: '11px 24px 0', display: 'grid', gap: 9, alignContent: 'start' }}>
                <PersonalityMap map={map} primary={result.primary} secondary={result.secondary} deep={deep} tint={tint} tintBorder={tintBorder} caption={mapCaption} title={mapTitle} hereLabel={hereLabel} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <TextBlock label={formatLabel(lang, 'habit')} body={copy.traits[0]} compact />
                  <TextBlock label={formatLabel(lang, 'failure')} body={copy.warning} compact />
                </div>
                <TextBlock label={formatLabel(lang, 'advice')} body={copy.advice} compact />
                <div style={{ borderTop: `1px solid ${tintBorder}`, paddingTop: 8, fontFamily: SERIF, fontSize: 17, lineHeight: 1.34, textAlign: 'center', color: INK }}>
                  “{copy.quote}”
                </div>
              </div>
              <div style={{ padding: '8px 22px 14px' }}>
                <Footer compact qrSize={54} />
              </div>
            </>
          )}

          {format === 'wechat' && (
            <>
              <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Brand caption={false} />
                <CodeChip size={11} />
              </div>
              <div style={{ display: 'grid', justifyItems: 'center', gap: 10, padding: '18px 26px 0' }}>
                <EmblemGlyph emblem={archetype.emblem} code={result.primary} size={172} title={result.primary} />
                <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 800, textAlign: 'center', lineHeight: 1.12 }}>{copy.headline}</div>
                <div style={{ fontSize: 16, color: INK, textAlign: 'center', lineHeight: 1.46 }}>“{copy.quote}”</div>
                {result.primary === 'PREPRINT' && <PlatformBadges deep={deep} tintBorder={tintBorder} />}
              </div>
              <div style={{ flex: 1, display: 'grid', gap: 11, alignContent: 'start', padding: '14px 22px 0' }}>
                <PersonalityMap map={map} primary={result.primary} secondary={result.secondary} deep={deep} tint={tint} tintBorder={tintBorder} caption={mapCaption} title={mapTitle} hereLabel={hereLabel} compact />
                <TraitRow large />
                <div style={{ display: 'grid', gap: 8 }}>
                  <TextBlock label={formatLabel(lang, 'watch')} body={copy.warning} />
                  <TextBlock label={formatLabel(lang, 'advice')} body={copy.advice} />
                </div>
              </div>
              <div style={{ padding: '10px 20px 16px' }}>
                <Footer compact qrSize={62} />
              </div>
            </>
          )}

          {format === 'landscape' && (
            <>
              <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <div
                  style={{
                    width: 250,
                    background: tint,
                    borderRight: `1px solid ${tintBorder}`,
                    display: 'grid',
                    justifyItems: 'center',
                    alignContent: 'center',
                    gap: 10,
                    padding: 18,
                  }}
                >
                  <EmblemGlyph emblem={archetype.emblem} code={result.primary} size={140} title={result.primary} />
                  <CodeChip size={11} />
                  <div style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 800, textAlign: 'center', lineHeight: 1.12 }}>{copy.headline}</div>
                  {result.primary === 'PREPRINT' && <PlatformBadges deep={deep} tintBorder={tintBorder} compact />}
                </div>
                <div style={{ width: 250, padding: '18px 16px', display: 'grid', alignContent: 'center' }}>
                  <PersonalityMap map={map} primary={result.primary} secondary={result.secondary} deep={deep} tint={tint} tintBorder={tintBorder} caption={mapCaption} title={mapTitle} hereLabel={hereLabel} compact />
                </div>
                <div style={{ flex: 1, padding: '18px 20px 14px', display: 'grid', gap: 10, alignContent: 'start', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Brand />
                    <span style={{ fontSize: 9, color: GREY }}>{t('common.fictionalBadge')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: INK, lineHeight: 1.45 }}>{copy.tagline}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1.3, color: INK }}>“{copy.quote}”</div>
                  <TextBlock label={formatLabel(lang, 'habit')} body={copy.traits[1]} compact />
                  <div style={{ fontSize: 11, color: GREY, lineHeight: 1.35 }}>
                    {copy.advice}
                  </div>
                  <Footer compact qrSize={50} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ShareMapPoint {
  code: string;
  x: number;
  y: number;
  role: 'primary' | 'secondary' | 'near';
}

interface ShareMapModel {
  points: ShareMapPoint[];
  user: { x: number; y: number };
}

function buildShareMap(result: ScoreResult): ShareMapModel {
  const protos = prototypeMatrix(false);
  const pca = fitPca(protos.map((p) => p.vector));
  const projected = protos.map((p) => ({ code: p.code, xy: projectPoint(p.vector, pca, 2) }));
  const userXy = projectPoint(result.scores, pca, 2);
  const codes = new Set([
    result.primary,
    result.secondary,
    ...result.distances.filter((d) => !d.hidden).slice(0, 6).map((d) => d.code),
  ]);
  const selected = projected.filter((p) => codes.has(p.code));
  const xs = [...selected.map((p) => p.xy[0]), userXy[0]];
  const ys = [...selected.map((p) => p.xy[1]), userXy[1]];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = (v: number) => 26 + ((v - minX) / Math.max(1, maxX - minX)) * 168;
  const sy = (v: number) => 134 - ((v - minY) / Math.max(1, maxY - minY)) * 100;

  return {
    points: selected.map((p) => ({
      code: p.code,
      x: sx(p.xy[0]),
      y: sy(p.xy[1]),
      role: p.code === result.primary ? 'primary' : p.code === result.secondary ? 'secondary' : 'near',
    })),
    user: { x: sx(userXy[0]), y: sy(userXy[1]) },
  };
}

function PersonalityMap({
  map,
  primary,
  secondary,
  deep,
  tint,
  tintBorder,
  caption,
  title,
  hereLabel,
  compact = false,
}: {
  map: ShareMapModel;
  primary: string;
  secondary: string;
  deep: string;
  tint: string;
  tintBorder: string;
  caption: string;
  title: { full: string; short: string };
  hereLabel: string;
  compact?: boolean;
}) {
  const height = compact ? 152 : 174;
  return (
    <div style={{ border: `1px solid ${tintBorder}`, borderRadius: 9, background: '#fffefa', overflow: 'hidden' }}>
      <div style={{ padding: compact ? '7px 9px 0' : '8px 10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: MONO, fontSize: compact ? 8 : 9, letterSpacing: 1.1, color: deep, fontWeight: 700 }}>
          {compact ? title.short : title.full}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 8, color: GREY }}>{hereLabel}</span>
      </div>
      <svg viewBox={`0 0 220 ${height}`} width="100%" height={height} role="img" aria-label="Laboratory personality map">
        <defs>
          <pattern id={`grid-${primary}-${compact ? 'c' : 'f'}`} width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M18 0H0V18" fill="none" stroke="rgba(34,38,44,0.08)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="12" y="10" width="196" height={compact ? 116 : 132} rx="7" fill={tint} fillOpacity="0.28" />
        <rect x="12" y="10" width="196" height={compact ? 116 : 132} rx="7" fill={`url(#grid-${primary}-${compact ? 'c' : 'f'})`} />
        <ellipse cx={map.user.x} cy={map.user.y} rx={34} ry={22} fill={deep} fillOpacity="0.1" stroke={deep} strokeOpacity="0.22" strokeDasharray="4 3" />
        {map.points.map((p) => (
          <g key={p.code}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.role === 'primary' ? 4.4 : p.role === 'secondary' ? 3.7 : 2.8}
              fill={p.role === 'near' ? '#88909a' : deep}
              fillOpacity={p.role === 'near' ? 0.58 : 0.95}
            />
            {(p.role !== 'near' || !compact) && (
              <text x={p.x + 5} y={p.y - 5} fontFamily={MONO} fontSize={compact ? 7 : 8} fill={p.role === 'near' ? GREY : INK} fontWeight={p.role === 'near' ? 500 : 700}>
                {p.code}
              </text>
            )}
          </g>
        ))}
        <circle cx={map.user.x} cy={map.user.y} r={8} fill="#fffefa" stroke={deep} strokeWidth="2" />
        <circle cx={map.user.x} cy={map.user.y} r={3.4} fill={deep} />
        <path d={`M${map.user.x + 8} ${map.user.y + 8} l13 12`} stroke={deep} strokeWidth="1.5" />
        <text x={Math.min(166, map.user.x + 24)} y={Math.min(compact ? 124 : 140, map.user.y + 27)} fontFamily={MONO} fontSize="8" fill={deep} fontWeight="700">
          {hereLabel.toUpperCase()}
        </text>
        <text x="17" y={compact ? 145 : 163} fontSize={compact ? 9 : 10} fill={GREY} fontFamily={SANS}>
          {caption}
        </text>
      </svg>
      <div style={{ display: 'none' }} data-primary={primary} data-secondary={secondary} data-pca-source="prototype-vectors" />
    </div>
  );
}

function PlatformBadges({ deep, tintBorder, compact = false }: { deep: string; tintBorder: string; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }} aria-label="bioRxiv and arXiv platform references">
      {['bioRxiv', 'arXiv'].map((name) => (
        <span key={name} style={{ border: `1px solid ${tintBorder}`, color: deep, borderRadius: 999, padding: compact ? '2px 7px' : '3px 9px', fontSize: compact ? 9 : 10, fontFamily: MONO, fontWeight: 700 }}>
          {name}
        </span>
      ))}
    </div>
  );
}

function formatLabel(lang: string, key: 'habit' | 'failure' | 'advice' | 'watch'): string {
  const labels = {
    en: { habit: 'habit', failure: 'failure mode', advice: 'field note', watch: 'watch out' },
    'zh-CN': { habit: '研究习惯', failure: '翻车预警', advice: '实用提醒', watch: '小心这里' },
    'zh-TW': { habit: '研究習慣', failure: '翻車預警', advice: '實用提醒', watch: '小心這裡' },
  } as const;
  return (labels[lang as keyof typeof labels] ?? labels.en)[key];
}

function formatMapCaption(lang: string, primaryName: string, secondaryName: string): string {
  if (lang === 'en') return `Near ${primaryName}; not far from ${secondaryName}.`;
  if (lang === 'zh-TW') return `你落在${primaryName}附近，離${secondaryName}不遠。`;
  return `你落在${primaryName}附近，离${secondaryName}不远。`;
}

function formatMapTitle(lang: string): { full: string; short: string } {
  if (lang === 'en') return { full: 'Laboratory personality map', short: 'LAB MAP' };
  if (lang === 'zh-TW') return { full: '實驗室人格地圖', short: '人格地圖' };
  return { full: '实验室人格地图', short: '人格地图' };
}

function formatHereLabel(lang: string): string {
  if (lang === 'en') return 'you';
  if (lang === 'zh-TW') return '你在這';
  return '你在这';
}
