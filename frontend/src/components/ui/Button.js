import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-10',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-700 focus-visible:outline-secondary shadow-panel',
        secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-secondary shadow-sm',
        accent: 'bg-accent text-primary hover:bg-accent-600 focus-visible:outline-accent shadow-panel',
        danger: 'bg-danger text-white hover:bg-danger-800 focus-visible:outline-danger shadow-panel',
        success: 'bg-success text-white hover:bg-success-800 focus-visible:outline-success shadow-panel',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-secondary',
        link: 'min-h-0 bg-transparent p-0 text-secondary underline-offset-4 hover:underline focus-visible:outline-secondary',
      },
      size: {
        default: 'px-4 py-2',
        sm: 'min-h-9 px-3 py-1.5 text-sm',
        lg: 'min-h-11 px-5 py-2.5 text-base',
        icon: 'h-9 w-9 shrink-0 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
