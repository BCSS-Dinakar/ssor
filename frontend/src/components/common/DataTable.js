import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

function DataTable({
  data = [],
  columns = [],
  filters = [],
  searchPlaceholder = "Search...",
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = "No data found",
  emptyMessage = "There are no records to display.",
  minHeight = "min-h-[400px]"
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeFilters, setActiveFilters] = useState({});
  const hasActiveFilters = Object.values(activeFilters).some(val => val !== '');

  // Filter data based on search term (simple global string match)
  const filteredData = useMemo(() => {
    let result = data;
    
    if (hasActiveFilters) {
      result = result.filter(row => {
        return Object.entries(activeFilters).every(([key, value]) => {
          if (!value) return true;
          return String(row[key]) === value;
        });
      });
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(val => 
          String(val).toLowerCase().includes(lowerSearch)
        );
      });
    }

    return result;
  }, [data, searchTerm, activeFilters, hasActiveFilters]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset to first page when search or page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, activeFilters]);

  return (
    <div className="card overflow-hidden flex flex-col bg-white">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-base w-full pl-11"
              aria-label={searchPlaceholder}
            />
          </div>
          
          {filters.map(filter => (
            <select
              key={filter.key}
              value={activeFilters[filter.key] || ''}
              onChange={(e) => setActiveFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
              className="input-base w-auto min-w-[10rem] cursor-pointer pr-10 shadow-sm"
              aria-label={filter.label}
            >
              <option value="">{filter.label} (All)</option>
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}

          {hasActiveFilters && (
            <button 
              onClick={() => setActiveFilters({})}
              className="text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors underline underline-offset-2"
            >
              Clear Filters
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-2 py-1 bg-white focus:outline-none focus:border-secondary pr-8 text-base"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      {/* Table Container with fixed minHeight */}
      <div className={`overflow-x-auto ${minHeight} flex flex-col`}>
        <table className="w-full h-full whitespace-nowrap text-left text-base">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
            <tr className="text-body-sm font-bold tracking-wide text-muted">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  scope="col"
                  className={`px-5 py-3.5 font-semibold sm:px-6 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted">
                  <EmptyIcon className="mx-auto mb-3 h-12 w-12 text-slate-300" aria-hidden="true" />
                  <p className="text-base font-semibold text-slate-700">{emptyTitle}</p>
                  <p className="mt-1 text-base">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="group transition-colors hover:bg-slate-50/80">
                  {columns.map((col, colIndex) => (
                    <td key={col.key || colIndex} className={`px-5 py-4 sm:px-6 ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}

            {paginatedData.length > 0 && paginatedData.length < pageSize && (
              <tr className="flex-1">
                <td colSpan={columns.length} className="border-0 p-0"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 text-sm mt-auto">
        <div className="text-slate-600 font-medium">
          Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Simple page numbers */}
          <div className="flex items-center gap-1 px-2">
            {[...Array(totalPages)].map((_, idx) => {
              const page = idx + 1;
              // Show max 5 pages logic (simplistic)
              if (
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-white border border-primary'
                        : 'border border-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                (page === currentPage - 2 && currentPage > 3) ||
                (page === currentPage + 2 && currentPage < totalPages - 2)
              ) {
                return <span key={page} className="text-slate-400 px-1">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
