import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * @param {{ items: Array<{ label: string, to?: string }>, className?: string }} props
 */
function Breadcrumb({ items = [], className }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className={cn('mb-2', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-body-sm text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="font-medium text-secondary hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary rounded"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn('font-medium', isLast ? 'text-slate-700' : '')} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumb };
