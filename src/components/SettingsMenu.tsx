import { useState } from 'react';
import { useAppStore } from '@/app/store';
import { useI18n } from '@/i18n/I18nProvider';

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-parchment/85">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-lumina-400' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-void transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-ghost px-3 py-2"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">⚙</span>
        <span className="sr-only sm:not-sr-only">{t('common.settings')}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" aria-hidden="true" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-72 panel p-4" role="menu">
            <p className="kicker mb-2">{t('common.settings')}</p>
            <Toggle
              label={t('common.reducedMotion')}
              checked={settings.reducedMotion === true}
              onChange={(v) => updateSettings({ reducedMotion: v })}
            />
            <Toggle
              label={t('common.reducedCompute')}
              checked={settings.reducedCompute}
              onChange={(v) => updateSettings({ reducedCompute: v })}
            />
            <Toggle
              label={t('common.hideSynthetic')}
              checked={settings.hideSynthetic}
              onChange={(v) => updateSettings({ hideSynthetic: v })}
            />
          </div>
        </>
      )}
    </div>
  );
}
