import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox, Filter, Loader2, ChevronDown } from 'lucide-react';
import MultiSelect from '../ui/MultiSelect';

function DataTable({
  data = [],
  columns = [],
  filters = [],
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = "No results found",
  emptyMessage = "There are no records to display.",
  minHeight = "min-h-[400px]",
  totalRows = 0,
  page = 1,
  pageSize = 10,
  loading = false,
  onPageChange,
  onPageSizeChange,
  onApplyFilters,
  initialFilters = {},
  initialSearch = '',
}) {
  const [internalSearchTerm, setInternalSearchTerm] = useState(initialSearch);
  const [internalFilters, setInternalFilters] = useState(initialFilters);

  const hasActiveFilters = Object.values(internalFilters).some(val => {
    if (Array.isArray(val)) return val.length > 0;
    return val !== '' && val != null;
  });

  const handleSearchChange = (e) => {
    setInternalSearchTerm(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && onApplyFilters) {
      onApplyFilters({ search: internalSearchTerm, filters: internalFilters });
    }
  };

  const handleSearchClick = () => {
    if (onApplyFilters) {
      onApplyFilters({ search: internalSearchTerm, filters: internalFilters });
    }
  };

  const handleFilterChange = (key, value) => {
    setInternalFilters({ ...internalFilters, [key]: value });
  };

  const clearFilters = () => {
    setInternalFilters({});
    if (onApplyFilters) {
      onApplyFilters({ search: internalSearchTerm, filters: {} });
    }
  };

  const handlePageChange = (newPage) => {
    if (onPageChange) onPageChange(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    if (onPageSizeChange) onPageSizeChange(newSize);
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const totalEntries = totalRows;
  const startEntry = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalEntries);

  return (
    <div className="card overflow-hidden flex flex-col bg-white border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col xl:flex-row gap-4 items-start xl:items-center">
        <div className="relative w-full xl:w-72 shrink-0">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={columns.length > 0 ? "Search..." : "Search"}
            value={internalSearchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex gap-3 w-full flex-grow flex-wrap items-center justify-start xl:justify-end">
          {filters.map(filter => (
            filter.multiple ? (
              <MultiSelect
                key={filter.key}
                label={filter.label}
                options={filter.options}
                value={internalFilters[filter.key] || []}
                onChange={(val) => handleFilterChange(filter.key, val)}
                className="w-full md:w-44"
              />
            ) : (
              <div key={filter.key} className="relative flex-grow md:flex-grow-0">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <select
                  value={internalFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full md:w-44 bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-3 appearance-none focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 font-bold text-slate-700 shadow-sm cursor-pointer transition-all"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold transition-colors whitespace-nowrap"
            >
              Clear
            </button>
          )}

          <button
            onClick={handleSearchClick}
            className="bg-primary hover:bg-secondary text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      <div className={`overflow-x-auto ${minHeight} flex flex-col relative bg-white`}>


        <table className="w-full h-full whitespace-nowrap text-left text-base border-collapse">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
            <tr className="text-sm uppercase font-bold text-slate-400 tracking-wider">
              {columns.map((col, idx) => (
                <th key={col.key || idx} scope="col" className={`px-3 py-3.5 ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-100 ${loading && data.length > 0 ? 'opacity-50 pointer-events-none transition-opacity duration-300' : ''}`}>
            {loading && data.length === 0 ? (
              Array.from({ length: 8 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="animate-pulse">
                  {columns.map((col, colIndex) => (
                    <td key={`skel-col-${colIndex}`} className="px-3 py-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 && !loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  <EmptyIcon className="mx-auto mb-3 h-12 w-12 text-slate-300" aria-hidden="true" />
                  <p className="text-base font-semibold text-slate-700">{emptyTitle}</p>
                  <p className="mt-1 text-base">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="group hover:bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 font-semibold relative z-10 hover:z-20">
                  {columns.map((col, colIndex) => (
                    <td key={col.key || colIndex} className={`px-3 py-3 align-middle ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4 text-sm mt-auto">
        <div className="text-slate-500 font-bold tracking-wide">
          Showing <span className="font-bold text-slate-800">{startEntry}</span> to <span className="font-bold text-slate-800">{endEntry}</span> of <span className="font-bold text-slate-800">{totalEntries.toLocaleString()}</span> entries
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold shrink-0">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-slate-200 rounded-xl px-2 py-1 bg-white focus:outline-none focus:border-secondary pr-8 text-base font-bold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-2">
              {[...Array(totalPages)].map((_, idx) => {
                const p = idx + 1;
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${page === p
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'border border-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                        }`}
                    >
                      {p}
                    </button>
                  );
                } else if ((p === page - 2 && page > 3) || (p === page + 2 && page < totalPages - 2)) {
                  return <span key={p} className="text-slate-400 px-1 font-bold">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
