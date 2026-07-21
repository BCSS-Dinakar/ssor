import { cn } from '../../lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/80', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

function PageSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading content">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function PoliceDashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading dashboard">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <Skeleton className="h-10 w-full" /> {/* Security Banner */}

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>

      {/* Map Component */}
      <Skeleton className="h-[600px] w-full" />

      {/* 2 Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[500px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>

      {/* 2 Bottom Lists */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[500px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  );
}

function OrgDashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading organization dashboard">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-48" /> {/* Action Button */}
      </div>

      <Skeleton className="h-10 w-full" /> {/* Security Banner */}

      <div className="space-y-6">
        {/* 4 Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>

        {/* Trends Area Chart */}
        <Skeleton className="h-[480px] w-full" />

        {/* 2 Charts */}
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-[480px] w-full" />
          <Skeleton className="h-[480px] w-full" />
        </div>

        {/* 2 Bottom Lists (2/3 and 1/3) */}
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-[580px] w-full xl:col-span-2" />
          <Skeleton className="h-[580px] w-full xl:col-span-1" />
        </div>

        {/* Profile & Actions */}
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-[250px] w-full" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
  </div>
  );
}

function ListSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading list">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-48" /> {/* Export Button */}
      </div>

      {/* Filters/Tabs */}
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Data */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-4">
           {/* Table headers */}
           <Skeleton className="h-4 w-1/4" />
           <Skeleton className="h-4 w-1/4" />
           <Skeleton className="h-4 w-1/4" />
           <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-16 flex items-center px-6 gap-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading details">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
           <Skeleton className="h-10 w-24" />
           <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Left Form/Details Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
           <Skeleton className="h-6 w-48 mb-4" />
           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <Skeleton className="h-3 w-24" />
               <Skeleton className="h-5 w-full" />
             </div>
             <div className="space-y-2">
               <Skeleton className="h-3 w-24" />
               <Skeleton className="h-5 w-full" />
             </div>
             <div className="space-y-2 col-span-2">
               <Skeleton className="h-3 w-32" />
               <Skeleton className="h-20 w-full" />
             </div>
           </div>
        </div>
        
        {/* Right Info/History Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
           <Skeleton className="h-6 w-48 mb-4" />
           <div className="space-y-6 mt-6">
             {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

export { Skeleton, PageSkeleton, PoliceDashboardSkeleton, OrgDashboardSkeleton, ListSkeleton, DetailSkeleton };
