import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-body-sm font-semibold',
  {
    variants: {
      variant: {
        default: 'border-slate-200 bg-slate-100 text-slate-800',
        primary: 'border-primary/20 bg-primary/10 text-primary',
        secondary: 'border-secondary/20 bg-secondary/10 text-secondary',
        success: 'border-success/20 bg-success-50 text-success-800',
        warning: 'border-warning/25 bg-warning-50 text-warning-700',
        danger: 'border-danger/20 bg-danger-50 text-danger-800',
        info: 'border-info/20 bg-info-50 text-info-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

function StatusBadge({ status, className }) {
  const map = {
    pending: { variant: 'warning', label: 'Pending' },
    verifying: { variant: 'info', label: 'In progress' },
    cleared: { variant: 'success', label: 'Cleared' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'danger', label: 'Rejected' },
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
  };
  const entry = map[status] || { variant: 'default', label: status ? String(status) : 'Unknown' };
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };
