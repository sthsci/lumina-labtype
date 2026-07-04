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
          <Link to="/" className="flex min-w-0 items-center gap-2.5" title={t('common.appFullName')}>
            <LogoMark />
            <span className="min-w-0 leading-none">
              <span className="block font-display text-lg font-bold tracking-tight text-parchment">LBTI</span>
              <span className="hidden truncate text-[9px] uppercase tracking-[0.18em] text-haze md:block">
                {t('common.appFullName')}
              </span>
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
                    isActive ? 'bg-slate850/70 text-parchment' : 'text-haze hover:text-parchment'
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
                      isActive ? 'bg-slate850/70 text-parchment' : 'text-haze'
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

/**
 * LBTI gate-badge mark: a flow-cytometry-style scatter with one cluster caught
 * inside a gate — literally "classifying lab behaviour into a type".
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="1.5" y="1.5" width="37" height="37" rx="9" fill="#fdfcf8" stroke="#22262c" strokeWidth="2" />
      {/* axes */}
      <path d="M8 7 L8 32 L33 32" fill="none" stroke="#9aa0a8" strokeWidth="1.4" />
      {/* off-type events */}
      <g fill="#b8874a">
        <circle cx="27" cy="27" r="1.5" />
        <circle cx="30.5" cy="24" r="1.3" />
        <circle cx="25" cy="30" r="1.1" />
      </g>
      {/* the typed cluster */}
      <g fill="#0e7490">
        <circle cx="17" cy="14" r="2" />
        <circle cx="21.5" cy="12" r="1.7" />
        <circle cx="20" cy="17.5" r="1.7" />
        <circle cx="15" cy="18.5" r="1.4" />
      </g>
      {/* the gate */}
      <path
        d="M11.5 11 L25.5 8 L27 18 L18 23 L11 19.5 Z"
        fill="none"
        stroke="#22262c"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeDasharray="3.2 2.2"
      />
    </svg>
  );
}
