import type { ReactNode } from 'react';

export function PageHeader({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 animate-fade-up">
      {kicker && <p className="kicker mb-2">{kicker}</p>}
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-2xl text-haze">{subtitle}</p>}
      {children}
    </header>
  );
}
