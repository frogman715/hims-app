import Link from 'next/link';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-gray-600 hover:text-gray-900">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-gray-900' : 'text-gray-600'}>{item.label}</span>
              )}
              {!isLast ? <span className="text-gray-400">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
