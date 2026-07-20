import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  className = "",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`w-full bg-slate-50 border rounded-xl px-3 py-2 h-10 text-sm cursor-pointer flex items-center justify-between transition-all duration-300 ${
          disabled ? 'opacity-50 cursor-not-allowed border-slate-200' : 
          isOpen ? 'border-secondary bg-white ring-4 ring-secondary/10' : 
          value ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900' : 
          'border-slate-300 hover:border-slate-400 text-slate-900'
        } ${className}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Search className="h-4 w-4 text-slate-400 ml-2" />
            <input
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 text-base py-1.5 outline-none placeholder:text-slate-400"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className={`px-4 py-2.5 text-base cursor-pointer rounded-lg flex items-center justify-between transition-colors ${
                    value === opt 
                      ? 'bg-secondary/10 text-secondary font-bold' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {opt}
                  {value === opt && <Check className="h-4 w-4 text-secondary" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-base text-slate-500 text-center">
                No results found for "{search}"
                <button 
                  className="block mt-2 mx-auto text-sm font-bold text-primary hover:underline"
                  onClick={() => {
                    onChange(search); // Allow using the typed search as value
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  Use "{search}" anyway
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
