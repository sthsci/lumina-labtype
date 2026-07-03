import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';
import { CohortMap } from '@/features/visualisations/CohortMap';
import { clearCohortRecords, loadCohortRecords, removeCohortRecord, type CohortRecord } from '@/features/cohort/cohortStorage';

export function Cohort() {
  const { t } = useI18n();
  const [records, setRecords] = useState<CohortRecord[]>(() => loadCohortRecords());
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    setRecords(loadCohortRecords());
  }, []);

  const deleteRecord = (id: string) => {
    setRecords(removeCohortRecord(id));
    setCleared(false);
  };

  const clearRecords = () => {
    if (window.confirm(t('cohort.clearConfirm'))) {
      clearCohortRecords();
      setRecords([]);
      setCleared(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader kicker={t('common.fictionalBadge')} title={t('cohort.title')} subtitle={t('cohort.subtitle')} />

      <section className="panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">{t('cohort.databaseTitle')}</h2>
            <p className="mt-1 max-w-3xl text-sm text-haze">{t('cohort.databaseBody')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/result" className="btn-primary">
              {t('cohort.addFromResult')}
            </Link>
            <button type="button" className="btn-ghost" onClick={clearRecords} disabled={records.length === 0}>
              {t('cohort.clearAll')}
            </button>
          </div>
        </div>
        {cleared && (
          <p className="mt-3 text-sm text-lumina-200" role="status">
            {t('cohort.cleared')}
          </p>
        )}
      </section>

      <CohortMap records={records} />

      {records.length > 0 && (
        <section className="panel overflow-x-auto p-5">
          <h2 className="text-base font-semibold">{t('cohort.recordsTitle')}</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-haze">
                <th className="py-2 pr-3">{t('cohort.table.cell')}</th>
                <th className="py-2 pr-3">{t('common.primary')}</th>
                <th className="py-2 pr-3">{t('common.secondary')}</th>
                <th className="py-2 pr-3">{t('cohort.table.recorded')}</th>
                <th className="py-2">{t('cohort.table.action')}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, i) => (
                <tr key={record.id} className="border-t border-line/60">
                  <td className="py-2 pr-3 font-mono text-haze">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <span className="font-mono text-haze">{record.primary}</span> {t(`archetypes.${record.primary}.name`)}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="font-mono text-haze">{record.secondary}</span> {t(`archetypes.${record.secondary}.name`)}
                  </td>
                  <td className="py-2 pr-3 text-haze">{new Date(record.createdAt).toLocaleString()}</td>
                  <td className="py-2">
                    <button type="button" className="btn-quiet px-2 py-1 text-xs text-signal-pos" onClick={() => deleteRecord(record.id)}>
                      {t('cohort.deleteRecord')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
