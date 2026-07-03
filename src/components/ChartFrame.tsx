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
    <figure className={`panel p-4 sm:p-5 ${className ?? ''}`} aria-describedby={summaryId}>
      <figcaption className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-parchment">{title}</h3>
          {description && <p className="mt-1 text-sm text-haze">{description}</p>}
        </div>
        {controls && <div className="flex flex-wrap items-center gap-2">{controls}</div>}
      </figcaption>

      <div className="relative">{children}</div>

      <p id={summaryId} className="mt-3 text-sm leading-relaxed text-parchment/70">
        {summary}
      </p>

      {table && (
        <div className="mt-2">
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
