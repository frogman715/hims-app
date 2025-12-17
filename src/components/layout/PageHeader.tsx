import type { ReactNode } from 'react';

export type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 border-b border-gray-200 pb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
