import * as React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const alertVariants = cva(
  'flex items-start gap-3 rounded-xl border px-4 py-3.5 text-base',
  {
    variants: {
      variant: {
        info: 'border-info/25 bg-info-50 text-info-700',
        success: 'border-success/25 bg-success-50 text-success-800',
        warning: 'border-warning/30 bg-warning-50 text-warning-700',
        danger: 'border-danger/25 bg-danger-50 text-danger-800',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

function Alert({ className, variant = 'info', title, children, ...props }) {
  const Icon = icons[variant] || Info;
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <div className="font-bold leading-tight">{title}</div>}
        {children && <div className={cn(title && 'mt-1', 'leading-normal')}>{children}</div>}
      </div>
    </div>
  );
}

export { Alert };
