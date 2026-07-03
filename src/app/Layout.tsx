import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SettingsMenu } from '@/components/SettingsMenu';

const NAV = [
  { to: '/', key: 'home', end: true },
  { to: '/test', key: 'test' },
  { to: '/result', key: 'result' },
  { to: '/ml-lab', key: 'mllab' },
  { to: '/atlas', key: 'atlas' },
  { to: '/cohort', key: 'cohort' },
  { to: '/methodology', key: 'methodology' },
  { to: '/about', key: 'about' },
] as const;

export function Layout() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only-focusable btn-primary fixed left-3 top-3 z-50">
        {t('common.skip')}
      </a>

      <header className="sticky top-0 z-20 border-b border-line bg-void/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-lg font-semibold tracking-tight text-parchment">
              LUMINA <span className="text-lumina-300">LabType</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={'end' in item ? item.end : undefined}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-white/[0.06] text-parchment' : 'text-haze hover:text-parchment'
                  }`
                }
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <SettingsMenu />
            <button
              type="button"
              className="btn-ghost px-3 py-2 lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t('common.closeMenu') : t('common.openMenu')}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-line px-4 py-2 lg:hidden" aria-label="Mobile">
            <div className="grid grid-cols-2 gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={'end' in item ? item.end : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-sm ${
                      isActive ? 'bg-white/[0.06] text-parchment' : 'text-haze'
                    }`
                  }
                >
                  {t(`nav.${item.key}`)}
                </NavLink>
              ))}
            </div>
            <div className="mt-2 sm:hidden">
              <LanguageSwitcher />
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-void/60">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-haze">
          <p className="max-w-2xl">{t('common.entertainmentDisclaimer')}</p>
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
            <Link to="/methodology" className="hover:text-parchment">{t('nav.methodology')}</Link>
            <Link to="/privacy" className="hover:text-parchment">{t('nav.privacy')}</Link>
            <Link to="/disclaimer" className="hover:text-parchment">{t('nav.disclaimer')}</Link>
            <Link to="/about" className="hover:text-parchment">{t('nav.about')}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5fdcf7" />
          <stop offset="100%" stopColor="#116586" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="17" fill="none" stroke="url(#logo-grad)" strokeWidth="1.4" opacity="0.6" />
      <circle cx="20" cy="20" r="3.4" fill="url(#logo-grad)" />
      <circle cx="30" cy="14" r="2.2" fill="#5fdcf7" opacity="0.9" />
      <circle cx="12" cy="27" r="2.2" fill="#f2b64c" opacity="0.85" />
      <line x1="20" y1="20" x2="30" y2="14" stroke="#5fdcf7" strokeWidth="0.8" opacity="0.55" />
      <line x1="20" y1="20" x2="12" y2="27" stroke="#f2b64c" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}
