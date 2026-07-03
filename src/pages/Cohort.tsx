import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';
import { CohortMap } from '@/features/visualisations/CohortMap';
import {
  fetchCohortRecords,
  insertCohortRecords,
  isSupabaseConfigured,
  mapRecordToInsert,
} from '@/features/cohort/cohortDb';
import {
  hasMigratedLegacyRecords,
  legacyLocalRecords,
  loadCohortCache,
  markLegacyRecordsMigrated,
  saveCohortCache,
  type CohortRecord,
} from '@/features/cohort/cohortStorage';

type Status = 'loading' | 'ready' | 'error' | 'unconfigured';

export function Cohort() {
  const { t } = useI18n();
  const [records, setRecords] = useState<CohortRecord[]>(() => loadCohortCache());
  const [fromCache, setFromCache] = useState<boolean>(() => loadCohortCache().length > 0);
  const [status, setStatus] = useState<Status>(isSupabaseConfigured ? 'loading' : 'unconfigured');
  const [errorMessage, setErrorMessage] = useState('');
  const [migratable, setMigratable] = useState<CohortRecord[]>([]);
  const [migrateMessage, setMigrateMessage] = useState('');
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStatus('unconfigured');
      return;
    }
    if (inFlight.current) return; // avoid overlapping refreshes / double clicks
    inFlight.current = true;
    setStatus('loading');
    setErrorMessage('');
    try {
      const rows = await fetchCohortRecords();
      setRecords(rows);
      setFromCache(false);
      saveCohortCache(rows);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // one-time migration offer for records saved before the shared map existed
    if (isSupabaseConfigured && !hasMigratedLegacyRecords()) {
      const legacy = legacyLocalRecords();
      if (legacy.length > 0) setMigratable(legacy);
    }
    void load();
  }, [load]);

  const runMigration = async () => {
    if (inFlight.current || migratable.length === 0) return;
    inFlight.current = true;
    try {
      await insertCohortRecords(migratable.map(mapRecordToInsert));
      markLegacyRecordsMigrated();
      setMigrateMessage(t('cohort.migrateDone', { count: migratable.length }));
      setMigratable([]);
      inFlight.current = false;
      await load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus('error');
      inFlight.current = false;
    }
  };

  const skipMigration = () => {
    markLegacyRecordsMigrated();
    setMigratable([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader kicker={t('common.fictionalBadge')} title={t('cohort.title')} subtitle={t('cohort.subtitle')} />

      <section className="panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{t('cohort.databaseTitle')}</h2>
            <p className="mt-1 max-w-3xl text-sm text-haze">{t('cohort.databaseBody')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/result" className="btn-primary">
              {t('cohort.addFromResult')}
            </Link>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => void load()}
              disabled={status === 'loading' || status === 'unconfigured'}
            >
              {t('cohort.refresh')}
            </button>
          </div>
        </div>

        {status === 'loading' && (
          <p className="mt-3 text-sm text-haze animate-pulse" role="status">
            {t('cohort.loading')}
          </p>
        )}
        {status === 'error' && (
          <div className="mt-3" role="alert">
            <p className="text-sm text-signal-pos">
              {t('cohort.error')} — {t('cohort.errorBody', { message: errorMessage })}
            </p>
            <button type="button" className="btn-ghost mt-2" onClick={() => void load()}>
              {t('common.retry')}
            </button>
          </div>
        )}
        {fromCache && status !== 'ready' && (
          <p className="mt-3 text-xs text-haze">{t('cohort.cachedNote')}</p>
        )}
        {migrateMessage && (
          <p className="mt-3 text-sm text-lumina-200" role="status">
            {migrateMessage}
          </p>
        )}
      </section>

      {status === 'unconfigured' ? (
        <section className="panel border-amber-glow/30 p-5">
          <h2 className="text-base font-semibold text-amber-glow">{t('cohort.unconfiguredTitle')}</h2>
          <p className="mt-1 max-w-3xl text-sm text-haze">{t('cohort.unconfiguredBody')}</p>
        </section>
      ) : (
        <>
          {migratable.length > 0 && (
            <section className="panel border-lumina-400/30 p-5" role="dialog" aria-label={t('cohort.migrateTitle')}>
              <h2 className="text-base font-semibold text-lumina-200">{t('cohort.migrateTitle')}</h2>
              <p className="mt-1 max-w-3xl text-sm text-haze">
                {t('cohort.migrateBody', { count: migratable.length })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={() => void runMigration()}>
                  {t('cohort.migrateConfirm', { count: migratable.length })}
                </button>
                <button type="button" className="btn-ghost" onClick={skipMigration}>
                  {t('cohort.migrateSkip')}
                </button>
              </div>
            </section>
          )}

          <CohortMap records={records} />

          {records.length > 0 && (
            <section className="panel overflow-x-auto p-5">
              <h2 className="text-base font-semibold">{t('cohort.recordsTitle')}</h2>
              <table className="mt-3 w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="text-haze">
                    <th className="py-2 pr-3">{t('cohort.table.cell')}</th>
                    <th className="py-2 pr-3">{t('common.primary')}</th>
                    <th className="py-2 pr-3">{t('common.secondary')}</th>
                    <th className="py-2">{t('cohort.table.recorded')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 50).map((record, i) => (
                    <tr key={record.id} className="border-t border-line/60">
                      <td className="py-2 pr-3 font-mono text-haze">{i + 1}</td>
                      <td className="py-2 pr-3">
                        <span className="font-mono text-haze">{record.primary}</span>{' '}
                        {t(`archetypes.${record.primary}.name`)}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="font-mono text-haze">{record.secondary}</span>{' '}
                        {t(`archetypes.${record.secondary}.name`)}
                      </td>
                      <td className="py-2 text-haze">{new Date(record.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
