import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../../lib/utils';

const Label = React.forwardRef(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('field-label inline-flex items-center gap-1', className)}
    {...props}
  >
    {children}
    {required && <span className="text-danger" aria-hidden="true">*</span>}
  </LabelPrimitive.Root>
));
Label.displayName = 'Label';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    className={cn('input-base', className)}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn('input-base min-h-[7rem] resize-y py-3', className)}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

function Field({ id, label, required, hint, error, children, className }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children
        ? React.cloneElement(children, {
            id,
            'aria-invalid': error ? 'true' : undefined,
            'aria-describedby': describedBy,
          })
        : null}
      {hint && !error && (
        <span id={`${id}-hint`} className="text-body-sm text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-body-sm font-medium text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

export { Label, Input, Textarea, Field };
