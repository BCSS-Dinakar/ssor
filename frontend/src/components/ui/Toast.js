import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastProviderRoot = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-4 right-4 z-[100] flex max-h-screen w-[calc(100%-2rem)] max-w-md flex-col gap-2 outline-none sm:bottom-6 sm:right-6',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const variantStyles = {
  default: 'border-slate-200 bg-white text-slate-900',
  success: 'border-success/30 bg-success-50 text-success-800',
  error: 'border-danger/30 bg-danger-50 text-danger-800',
  warning: 'border-warning/40 bg-warning-50 text-warning-700',
  info: 'border-info/30 bg-info-50 text-info-700',
};

const variantIcons = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const Toast = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-elevated data-[state=open]:animate-toast-in data-[state=closed]:animate-toast-out',
      variantStyles[variant] || variantStyles.default,
      className
    )}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-base font-bold leading-tight', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('mt-1 text-body-sm leading-normal opacity-95', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-lg opacity-70 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary',
      className
    )}
    aria-label="Dismiss notification"
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastContext = React.createContext(null);

let toastId = 0;

function ToastProvider({ children, duration = 5000 }) {
  const [toasts, setToasts] = React.useState([]);

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((options) => {
    const id = ++toastId;
    const entry = {
      id,
      title: options.title || '',
      description: options.description || '',
      variant: options.variant || 'default',
      duration: options.duration ?? duration,
    };
    setToasts((prev) => [...prev.slice(-4), entry]);
    return id;
  }, [duration]);

  const api = React.useMemo(() => ({
    toast,
    success: (title, description) => toast({ title, description, variant: 'success' }),
    error: (title, description) => toast({ title, description, variant: 'error' }),
    warning: (title, description) => toast({ title, description, variant: 'warning' }),
    info: (title, description) => toast({ title, description, variant: 'info' }),
    dismiss,
  }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      <ToastProviderRoot duration={duration} swipeDirection="right">
        {children}
        {toasts.map((t) => {
          const Icon = variantIcons[t.variant] || Info;
          return (
            <Toast
              key={t.id}
              variant={t.variant}
              duration={t.duration}
              onOpenChange={(open) => {
                if (!open) dismiss(t.id);
              }}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1 pr-8">
                {t.title && <ToastTitle>{t.title}</ToastTitle>}
                {t.description && <ToastDescription>{t.description}</ToastDescription>}
              </div>
              <ToastClose />
            </Toast>
          );
        })}
        <ToastViewport />
      </ToastProviderRoot>
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

export {
  ToastProvider,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
  ToastProviderRoot,
};
