import { useId, useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

interface ChartFrameProps {
  title: string;
  description?: string;
  /** Plain-language text alternative read by screen readers and shown on demand. */
  summary: string;
  /** Optional accessible data table (already localised). */
  table?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standard wrapper for every visualisation. Guarantees a heading, a
 * plain-language summary (never hover-only), optional interactive controls, and
 * an optional accessible data-table alternative for complex charts.
 */
export function ChartFrame({
  title,
  description,
  summary,
  table,
  controls,
  children,
  className,
}: ChartFrameProps) {
  const { t } = useI18n();
  const [showTable, setShowTable] = useState(false);
  const summaryId = useId();

  return (
    <figure className={`panel overflow-hidden p-0 ${className ?? ''}`} aria-describedby={summaryId}>
      <figcaption className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-slate850/35 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-haze">LBTI / visual assay</p>
          <h3 className="mt-1 text-base font-semibold text-parchment">{title}</h3>
          {description && <p className="mt-1 text-sm text-haze">{description}</p>}
        </div>
        {controls && <div className="flex flex-wrap items-center gap-2">{controls}</div>}
      </figcaption>

      <div className="relative px-3 pt-4 sm:px-4">
        <div className="absolute left-4 top-4 h-8 w-8 border-l border-t border-line" aria-hidden="true" />
        <div className="absolute bottom-0 right-4 h-8 w-8 border-b border-r border-line" aria-hidden="true" />
        {children}
      </div>

      <p id={summaryId} className="px-4 pb-3 pt-2 text-sm leading-relaxed text-parchment/70 sm:px-5">
        {summary}
      </p>

      {table && (
        <div className="border-t border-line px-4 pb-4 sm:px-5">
          <button
            type="button"
            className="btn-quiet px-2 py-1 text-xs"
            aria-expanded={showTable}
            onClick={() => setShowTable((v) => !v)}
          >
            {showTable ? t('common.hideTable') : t('common.viewTable')}
          </button>
          {showTable && <div className="mt-2 overflow-x-auto text-sm">{table}</div>}
        </div>
      )}
    </figure>
  );
}
