function PageHeader({ crumb, title, subtitle, actions }) {
  return (
    <div className="mb-6">
      {crumb && <div className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-1 font-heading">{crumb}</div>}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-primary font-heading tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
