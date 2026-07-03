import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { useI18n } from '@/i18n/I18nProvider';
import { EmblemGlyph } from '@/components/Emblem';
import { archetypeByCode, dimensionOrder } from '@/data/content';
import { canonicalUrl, BASE_URL } from '@/lib/basePath';
import type { ScoreResult } from '@/features/scoring/types';

type Format = 'square' | 'portrait' | 'wechat' | 'landscape';
const FORMATS: { id: Format; w: number; h: number }[] = [
  { id: 'square', w: 540, h: 540 },
  { id: 'portrait', w: 480, h: 640 },
  { id: 'wechat', w: 420, h: 748 },
  { id: 'landscape', w: 680, h: 400 },
];

export function ShareCard({ result }: { result: ScoreResult }) {
  const { t } = useI18n();
  const [format, setFormat] = useState<Format>('portrait');
  const [qr, setQr] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const archetype = archetypeByCode.get(result.primary)!;
  const url = useMemo(
    () => canonicalUrl(typeof window !== 'undefined' ? window.location.origin : 'https://example.github.io', BASE_URL),
    [],
  );

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 120, color: { dark: '#0c1119', light: '#e8e2d1' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [url]);

  const dims = useMemo(() => {
    return result.dimensionScores
      .map((d, i) => ({ id: d.id, dev: Math.abs(result.scores[i] - 50), score: result.scores[i] }))
      .sort((a, b) => b.dev - a.dev)
      .slice(0, 3);
  }, [result]);

  const spec = FORMATS.find((f) => f.id === format)!;

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#070a0f',
      });
      const link = document.createElement('a');
      link.download = `lbti-${result.primary}-${format}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            className={`rounded-lg px-3 py-1.5 text-xs ${format === f.id ? 'bg-lumina-400 text-void' : 'btn-ghost'}`}
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

      <div className="overflow-x-auto">
        <div
          ref={cardRef}
          className="relative mx-auto flex flex-col overflow-hidden"
          style={{
            width: spec.w,
            height: spec.h,
            background: 'radial-gradient(120% 90% at 20% 0%, #12324a 0%, #0a0e15 60%), #070a0f',
            fontFamily: 'Inter, "PingFang SC", "Noto Sans SC", "Noto Sans TC", system-ui, sans-serif',
          }}
        >
          <div className="flex items-center justify-between px-6 pt-5">
            <span style={{ color: '#5fdcf7', fontSize: 13, letterSpacing: 2, fontWeight: 600 }}>
              LBTI
            </span>
            <span style={{ color: '#8ea3c4', fontSize: 11 }}>{t('common.fictionalBadge')}</span>
          </div>

          <div className={`flex flex-1 gap-4 px-6 ${format === 'landscape' ? 'flex-row items-center' : 'flex-col items-center justify-center text-center'}`}>
            <EmblemGlyph emblem={archetype.emblem} size={format === 'landscape' ? 150 : 140} title={result.primary} />
            <div className={format === 'landscape' ? 'text-left' : 'text-center'}>
              <div style={{ color: '#f2b054', fontFamily: 'monospace', fontSize: 15, letterSpacing: 3 }}>{result.primary}</div>
              <div style={{ color: '#e8e2d1', fontSize: 30, fontWeight: 700, lineHeight: 1.1, marginTop: 6 }}>
                {t(`archetypes.${result.primary}.name`)}
              </div>
              <div style={{ color: '#8ea3c4', fontSize: 14, marginTop: 8, maxWidth: 300 }}>
                {t(`archetypes.${result.primary}.tagline`)}
              </div>
            </div>
          </div>

          <div className="px-6">
            <div className="flex justify-center gap-2" style={{ flexWrap: 'wrap' }}>
              {dims.map((d) => (
                <span
                  key={d.id}
                  style={{
                    background: 'rgba(95,220,247,0.1)',
                    border: '1px solid rgba(95,220,247,0.25)',
                    color: '#c9f5ff',
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 8,
                  }}
                >
                  {t(`dimensions.${d.id}.name`)} · {Math.round(d.score)}
                </span>
              ))}
            </div>
          </div>

          {/* mini profile glyph: 15 bars */}
          <div className="flex items-end justify-center gap-1 px-6 pt-4" style={{ height: 44 }}>
            {dimensionOrder.map((id, i) => (
              <span
                key={id}
                style={{
                  width: 8,
                  height: `${8 + (result.scores[i] / 100) * 32}px`,
                  background: 'linear-gradient(180deg,#5fdcf7,#116586)',
                  borderRadius: 2,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between px-6 pb-5 pt-4">
            <div style={{ maxWidth: spec.w - 150 }}>
              <div style={{ color: '#8ea3c4', fontSize: 10, wordBreak: 'break-all' }}>{url}</div>
              <div style={{ color: '#5c6a7d', fontSize: 9, marginTop: 4 }}>{t('common.entertainmentDisclaimer')}</div>
            </div>
            {qr && <img src={qr} alt="QR code" width={56} height={56} style={{ borderRadius: 6 }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
