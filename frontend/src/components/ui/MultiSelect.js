import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Filter } from 'lucide-react';

export default function MultiSelect({
  label = 'Select options',
  options = [],
  value = [],
  onChange,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onChange(newValue);
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
    setIsOpen(false);
  };

  // Render the display text based on selection
  const renderDisplay = () => {
    if (value.length === 0) {
      return <span className="text-slate-700">{label} (All)</span>;
    }
    
    if (value.length === 1) {
      const selectedOpt = options.find(o => o.value === value[0]);
      return <span className="text-slate-800 font-bold truncate">{selectedOpt ? selectedOpt.label : value[0]}</span>;
    }

    return (
      <div className="flex items-center gap-1.5">
        <span className="text-slate-800 font-bold">{label}</span>
        <span className="bg-secondary/10 text-secondary text-xs font-black px-2 py-0.5 rounded-full">
          {value.length}
        </span>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-3 text-left focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 shadow-sm transition-all flex items-center justify-between group relative"
      >
        <div className="truncate pr-2 w-full text-slate-700 font-bold">
          {renderDisplay()}
        </div>
        
        <div className="flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2">
          {value.length > 0 && (
            <div 
              onClick={clearAll}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 w-full min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => toggleOption(opt.value)}
                  className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                    isSelected 
                      ? 'bg-secondary border-secondary text-white' 
                      : 'border-slate-300 bg-white group-hover:border-secondary'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-sm ${isSelected ? 'font-bold text-slate-800' : 'font-semibold text-slate-600 group-hover:text-slate-800'}`}>
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
