import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';

export function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-6xl text-lumina-300">404</p>
      <p className="mt-4 text-haze">{t('common.appName')}</p>
      <Link to="/" className="btn-primary mt-6">
        {t('nav.home')}
      </Link>
    </div>
  );
}
