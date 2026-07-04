import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { useI18n } from '@/i18n/I18nProvider';
import { EmblemGlyph } from '@/components/Emblem';
import { LogoMark } from '@/app/Layout';
import { archetypeByCode, dimensionOrder } from '@/data/content';
import { canonicalUrl, BASE_URL } from '@/lib/basePath';
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
  { id: 'portrait', w: 480, h: 640 },
  { id: 'wechat', w: 420, h: 748 },
  { id: 'landscape', w: 680, h: 400 },
];

const PAPER = '#f6f3ec';
const CARD = '#fdfcf8';
const INK = '#22262c';
const GREY = '#5f6774';
const SERIF = 'Georgia, "Times New Roman", "Songti SC", "Noto Serif SC", serif';
const SANS = 'Inter, system-ui, "PingFang SC", "Noto Sans SC", "Noto Sans TC", sans-serif';
const MONO = 'Menlo, Consolas, "SF Mono", monospace';

export function ShareCard({ result }: { result: ScoreResult }) {
  const { t } = useI18n();
  const [format, setFormat] = useState<Format>('portrait');
  const [qr, setQr] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const archetype = archetypeByCode.get(result.primary)!;
  const hue = archetype.emblem.hue;
  const deep = `hsl(${hue}, 52%, 30%)`;
  const tint = `hsl(${hue}, 46%, 92%)`;
  const tintBorder = `hsl(${hue}, 36%, 78%)`;

  const url = useMemo(
    () => canonicalUrl(typeof window !== 'undefined' ? window.location.origin : 'https://example.github.io', BASE_URL),
    [],
  );

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 132, color: { dark: INK, light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [url]);

  const dims = useMemo(
    () =>
      result.dimensionScores
        .map((d, i) => ({ id: d.id, dev: Math.abs(result.scores[i] - 50), score: result.scores[i] }))
        .sort((a, b) => b.dev - a.dev)
        .slice(0, 3),
    [result],
  );

  const spec = FORMATS.find((f) => f.id === format)!;
  const name = t(`archetypes.${result.primary}.name`);
  const tagline = t(`archetypes.${result.primary}.tagline`);

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

  const Footer = ({ compact = false }: { compact?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${tintBorder}`, paddingTop: 10 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color: GREY, wordBreak: 'break-all' }}>{url}</div>
        {!compact && (
          <div style={{ fontSize: 8, color: GREY, marginTop: 4, lineHeight: 1.5 }}>{t('common.entertainmentDisclaimer')}</div>
        )}
      </div>
      {qr && <img src={qr} alt="QR code" width={compact ? 44 : 52} height={compact ? 44 : 52} style={{ borderRadius: 6, border: `1px solid ${tintBorder}` }} />}
    </div>
  );

  const DimChips = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
      {dims.map((d) => (
        <span
          key={d.id}
          style={{
            background: tint,
            border: `1px solid ${tintBorder}`,
            color: deep,
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            fontFamily: SANS,
          }}
        >
          {t(`dimensions.${d.id}.name`)} · {Math.round(d.score)}
        </span>
      ))}
    </div>
  );

  const DimBars = () => (
    <div style={{ display: 'grid', gap: 8 }}>
      {dims.map((d) => (
        <div key={d.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: INK, fontFamily: SANS }}>
            <span style={{ fontWeight: 600 }}>{t(`dimensions.${d.id}.name`)}</span>
            <span style={{ fontFamily: MONO, color: deep }}>{Math.round(d.score)}</span>
          </div>
          <div style={{ height: 6, background: tint, borderRadius: 999, marginTop: 3 }}>
            <div style={{ width: `${d.score}%`, height: '100%', background: deep, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );

  const ProfileGlyph = ({ height = 40 }: { height?: number }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {dimensionOrder.map((id, i) => (
        <span
          key={id}
          style={{
            flex: 1,
            height: `${12 + (result.scores[i] / 100) * 88}%`,
            background: i % 3 === 1 ? deep : tintBorder,
            borderRadius: 2,
          }}
        />
      ))}
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

  /* format layouts -------------------------------------------------------- */

  const cardBase: React.CSSProperties = {
    width: spec.w,
    height: spec.h,
    background: CARD,
    border: `1px solid ${tintBorder}`,
    borderRadius: 18,
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

      <div className="overflow-x-auto rounded-2xl border border-line bg-void p-4">
        <div ref={cardRef} className="mx-auto" style={cardBase}>
          {format === 'square' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
                <Brand />
                <span style={{ fontSize: 9, color: GREY }}>{t('common.fictionalBadge')}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px' }}>
                <EmblemGlyph emblem={archetype.emblem} code={result.primary} size={168} title={result.primary} />
                <div style={{ minWidth: 0 }}>
                  <CodeChip />
                  <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, lineHeight: 1.15, marginTop: 10 }}>{name}</div>
                  <div style={{ fontSize: 13, color: GREY, marginTop: 8, lineHeight: 1.5 }}>{tagline}</div>
                </div>
              </div>
              <div style={{ padding: '0 20px 16px', display: 'grid', gap: 12 }}>
                <DimChips />
                <Footer />
              </div>
            </>
          )}

          {format === 'portrait' && (
            <>
              <div
                style={{
                  background: tint,
                  borderBottom: `1px solid ${tintBorder}`,
                  padding: '18px 22px 20px',
                  display: 'grid',
                  justifyItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ alignSelf: 'start', justifySelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Brand />
                  <span style={{ fontSize: 9, color: GREY }}>{t('common.fictionalBadge')}</span>
                </div>
                <EmblemGlyph emblem={archetype.emblem} code={result.primary} size={186} title={result.primary} />
                <CodeChip />
              </div>
              <div style={{ flex: 1, padding: '16px 26px', display: 'grid', gap: 12, alignContent: 'start' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, lineHeight: 1.15 }}>{name}</div>
                  <div style={{ fontSize: 13, color: GREY, marginTop: 6, lineHeight: 1.5 }}>{tagline}</div>
                </div>
                <DimBars />
              </div>
              <div style={{ padding: '0 22px 16px' }}>
                <Footer />
              </div>
            </>
          )}

          {format === 'wechat' && (
            <>
              <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Brand caption={false} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: GREY, letterSpacing: 2 }}>N = 1</span>
              </div>
              <div style={{ flex: 1, display: 'grid', justifyItems: 'center', alignContent: 'center', gap: 14, padding: '0 24px' }}>
                <EmblemGlyph emblem={archetype.emblem} code={result.primary} size={216} title={result.primary} />
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: deep, paddingLeft: 8 }}>
                  {result.primary}
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{name}</div>
                <div style={{ fontSize: 13, color: GREY, textAlign: 'center', lineHeight: 1.55, maxWidth: 300 }}>“{tagline}”</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                  {dims.map((d) => (
                    <span key={d.id} style={{ fontSize: 11, color: deep, fontWeight: 600 }}>
                      #{t(`dimensions.${d.id}.name`)}
                    </span>
                  ))}
                </div>
                <div style={{ alignSelf: 'stretch' }}>
                  <ProfileGlyph height={34} />
                </div>
              </div>
              <div style={{ padding: '10px 20px 16px' }}>
                <Footer compact />
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
                  <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{name}</div>
                </div>
                <div style={{ flex: 1, padding: '18px 22px', display: 'grid', gap: 12, alignContent: 'start', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Brand />
                    <span style={{ fontSize: 9, color: GREY }}>{t('common.fictionalBadge')}</span>
                  </div>
                  <div style={{ fontSize: 12, color: GREY, lineHeight: 1.5 }}>{tagline}</div>
                  <ProfileGlyph height={44} />
                  <div style={{ display: 'flex', gap: 16, fontFamily: MONO, fontSize: 11, color: INK }}>
                    <span>
                      {t('result.matchStrength')} <strong style={{ color: deep }}>{result.matchStrength}</strong>
                    </span>
                    <span>
                      {t('result.classificationMargin')} <strong style={{ color: deep }}>{result.classificationMargin.toFixed(2)}</strong>
                    </span>
                  </div>
                  <DimBars />
                </div>
              </div>
              <div style={{ padding: '0 20px 14px' }}>
                <Footer compact />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
