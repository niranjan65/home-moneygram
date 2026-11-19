import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export default function ComboBox({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  getOptionLabel = (opt) => opt?.label || opt?.code || String(opt || ''),
  getOptionValue = (opt) => opt?.value || opt?.code || opt,
  filterOption,
  renderOption,
  disabled = false,
  className = '',
  containerClassName = '',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return (
      options.find(
        (opt) =>
          getOptionValue(opt) ===
          (typeof value === 'object' ? getOptionValue(value) : value)
      ) || null
    );
  }, [options, value, getOptionValue]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;

    if (filterOption) {
      return options.filter((opt) => filterOption(opt, q));
    }

    return options.filter((opt) => {
      const label = String(getOptionLabel(opt) || '').toLowerCase();
      const val = String(getOptionValue(opt) || '').toLowerCase();
      const country = String(opt?.country || '').toLowerCase();
      return label.includes(q) || val.includes(q) || country.includes(q);
    });
  }, [options, query, filterOption, getOptionLabel, getOptionValue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange?.(option);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(null);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // What is displayed in the input field
  const displayValue = isOpen
    ? query
    : selectedOption
    ? getOptionLabel(selectedOption)
    : '';

  return (
    <div ref={containerRef} className={`relative w-full ${containerClassName}`}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          autoComplete="off"
          disabled={disabled}
          placeholder={
            selectedOption ? getOptionLabel(selectedOption) : placeholder
          }
          value={displayValue}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setHighlightedIndex(0);
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={className}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-400">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-gray-600 rounded cursor-pointer"
              tabIndex={-1}
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (disabled) return;
              if (isOpen) {
                setIsOpen(false);
                setQuery('');
              } else {
                setIsOpen(true);
                setHighlightedIndex(0);
                inputRef.current?.focus();
              }
            }}
            className="cursor-pointer p-0.5 flex items-center"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-gray-600' : 'text-gray-400'
              }`}
            />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-50 animate-in fade-in duration-100"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3.5 py-4 text-caption text-gray-500 text-center">
              No matching options found
            </div>
          ) : (
            filteredOptions.map((option, idx) => {
              const isSelected =
                selectedOption &&
                getOptionValue(selectedOption) === getOptionValue(option);
              const isHighlighted = highlightedIndex === idx;

              return (
                <div
                  key={getOptionValue(option) || idx}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3.5 py-2.5 cursor-pointer text-body-value transition-colors flex items-center justify-between ${
                    isHighlighted
                      ? 'bg-red-50 text-[#E00000]'
                      : isSelected
                      ? 'bg-gray-50 font-semibold text-gray-900'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    {renderOption ? (
                      renderOption(option, isSelected, isHighlighted)
                    ) : (
                      <span>{getOptionLabel(option)}</span>
                    )}
                  </div>
                  {isSelected && (
                    <Check
                      size={14}
                      className="text-[#E00000] shrink-0 ml-1.5"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
