import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppStore } from '@/app/store';

const FIELDS = ['experimental', 'computational', 'theory', 'clinical', 'fieldwork', 'engineering', 'social', 'other'];
const STAGES = ['undergrad', 'masters', 'phd', 'postdoc', 'staff', 'pi', 'industry', 'independent'];

function OptionGrid({
  legend,
  options,
  prefix,
  value,
  onSelect,
}: {
  legend: string;
  options: string[];
  prefix: string;
  value: string | null;
  onSelect: (v: string) => void;
}) {
  const { t } = useI18n();
  return (
    <fieldset className="panel p-5">
      <legend className="px-1 text-sm font-semibold text-parchment">{legend}</legend>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            aria-pressed={value === opt}
            onClick={() => onSelect(opt)}
            className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
              value === opt
                ? 'border-lumina-400 bg-lumina-400/15 text-parchment'
                : 'border-line bg-white/[0.02] text-haze hover:border-lumina-400/40 hover:text-parchment'
            }`}
          >
            {t(`${prefix}.${opt}`)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Context() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const storedContext = useAppStore((s) => s.context);
  const setContext = useAppStore((s) => s.setContext);
  const [field, setField] = useState<string | null>(storedContext?.field ?? null);
  const [stage, setStage] = useState<string | null>(storedContext?.stage ?? null);

  const start = () => {
    if (field && stage) setContext({ field, stage });
    navigate('/test');
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={t('context.title')} subtitle={t('context.subtitle')} />
      <div className="space-y-4">
        <OptionGrid
          legend={t('context.fieldLabel')}
          options={FIELDS}
          prefix="context.fields"
          value={field}
          onSelect={setField}
        />
        <OptionGrid
          legend={t('context.stageLabel')}
          options={STAGES}
          prefix="context.stages"
          value={stage}
          onSelect={setStage}
        />
      </div>
      <p className="mt-4 text-xs text-haze">{t('context.note')}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn-primary px-6 text-base" onClick={start} disabled={!field || !stage}>
          {t('context.cta')}
        </button>
        <button type="button" className="btn-quiet" onClick={() => navigate('/test')}>
          {t('context.skipContext')}
        </button>
      </div>
    </div>
  );
}
