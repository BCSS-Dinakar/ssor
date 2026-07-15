import * as React from 'react';
import { cn } from '../../lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200 bg-white shadow-panel', className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1 border-b border-slate-100 px-4 py-3 sm:px-5', className)} {...props} />;
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('font-heading text-base font-bold text-primary', className)} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted', className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn('px-4 py-4 sm:px-5', className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center gap-3 border-t border-slate-100 px-4 py-3 sm:px-5', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
