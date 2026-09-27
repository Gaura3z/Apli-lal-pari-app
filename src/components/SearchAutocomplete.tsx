import React, { useState, useRef, useEffect } from 'react';
import { SearchSuggestion, Stop } from '../types';
import { getSearchSuggestions } from '../services/searchEngine';
import { MapPin, Building2, Landmark, X } from 'lucide-react';

interface SearchAutocompleteProps {
  label: string;
  value: string;
  placeholder: string;
  allStops: Stop[];
  onChange: (val: string) => void;
  onSelectSuggestion?: (suggestion: SearchSuggestion) => void;
  leadingIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  required?: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  label,
  value,
  placeholder,
  allStops,
  onChange,
  onSelectSuggestion,
  leadingIcon,
  rightAction
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && value.trim().length > 0) {
      const results = getSearchSuggestions(value, allStops);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [value, allStops]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (s: SearchSuggestion) => {
    onChange(s.primaryText);
    onSelectSuggestion?.(s);
    setIsOpen(false);
  };

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'CITY':
        return <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'LANDMARK':
        return <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
        {label}
      </label>

      <div className="relative flex items-center">
        {leadingIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none">
            {leadingIcon}
          </div>
        )}

        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (value.trim().length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition ${
            leadingIcon ? 'pl-10' : 'pl-4'
          } ${rightAction ? 'pr-24' : value ? 'pr-9' : 'pr-4'}`}
        />

        {value && !rightAction && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="absolute right-3 w-5 h-5 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-xs"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {rightAction && (
          <div className="absolute right-2 flex items-center">
            {rightAction}
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-40 overflow-hidden divide-y divide-slate-800/80 animate-in fade-in-50 duration-150">
          <div className="px-3 py-1.5 bg-slate-950/70 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Matching Stops & Corridors ({suggestions.length})
          </div>
          {suggestions.map((s) => (
            <div
              key={s.id}
              onClick={() => handleSelect(s)}
              className="p-2.5 sm:p-3 hover:bg-slate-800/90 cursor-pointer transition flex items-center justify-between gap-2 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-slate-700">
                  {getIcon(s.type)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs truncate group-hover:text-red-400 transition">
                    {s.primaryText}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {s.secondaryText}
                  </div>
                </div>
              </div>

              {s.marathiText && (
                <span className="text-[10px] font-medium text-amber-400/80 shrink-0 font-sans hidden sm:block">
                  {s.marathiText}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
