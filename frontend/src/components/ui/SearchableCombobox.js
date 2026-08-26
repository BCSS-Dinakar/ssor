import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const SearchableCombobox = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  defaultLabel = 'ALL - All Items',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) => 
      opt.label.toLowerCase().includes(lowerQuery) || 
      (opt.description && opt.description.toLowerCase().includes(lowerQuery))
    );
  }, [options, searchQuery]);

  const selectedOption = value === 'ALL' 
    ? { label: defaultLabel, value: 'ALL' } 
    : options.find(opt => opt.value === value);

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-secondary focus:outline-none"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-slate-500 ml-2 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-[1000] mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center border-b border-slate-100 p-2">
            <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              className="w-full text-xs outline-none focus:ring-0 placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            <div
              className={`flex items-center px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 ${value === 'ALL' ? 'bg-secondary/10 text-secondary font-semibold' : 'text-slate-700'}`}
              onClick={() => {
                onChange('ALL');
                setIsOpen(false);
              }}
            >
              <div className="w-5 shrink-0 flex items-center">
                {value === 'ALL' && <Check className="h-3 w-3" />}
              </div>
              <span className="truncate">{defaultLabel}</span>
            </div>
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 text-center">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`flex items-center px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 ${value === opt.value ? 'bg-secondary/10 text-secondary font-semibold' : 'text-slate-700'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <div className="w-5 shrink-0 flex items-center">
                    {value === opt.value && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="truncate text-[10px] text-slate-500 font-normal">{opt.description}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableCombobox;
