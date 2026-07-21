/**
 * @param {{ crumb?: string, crumbs?: Array<{label: string, to?: string}>, title: string, subtitle?: string, actions?: React.ReactNode }} props
 */
function PageHeader({ title, subtitle, actions }) {

  return (
    <div className="mb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 max-w-3xl text-sm text-muted leading-relaxed">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
