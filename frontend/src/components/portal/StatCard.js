import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

function StatCard({
  label,
  value,
  meta,
  icon: Icon,
  accent = 'bg-info-50 text-secondary',
  valueClass = 'text-primary',
  metaClass = 'text-muted',
  to,
  className,
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-muted">{label}</div>
          <div className={cn('mt-1.5 font-heading text-2xl font-bold leading-none', valueClass)}>{value}</div>
          {meta && <div className={cn('mt-1.5 text-sm font-medium', metaClass)}>{meta}</div>}
        </div>
        {Icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accent)} aria-hidden="true">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
      {to && (
        <span className="mt-2 inline-block text-sm font-semibold text-secondary">
          View details →
        </span>
      )}
    </>
  );

  const classes = cn(
    'card relative block p-4 transition-shadow',
    to && 'hover:shadow-elevated focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary',
    className
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={`${label}: ${value}. View details`}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}

export default StatCard;
