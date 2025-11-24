import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string | number;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  icon, 
  placeholder,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string | number) => {
    onChange(String(val));
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled}
        className={`w-full text-left flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-200 group focus:outline-none 
        ${disabled 
            ? 'bg-slate-100 text-slate-400' 
            : `hover:border-violet-300 hover:bg-white focus:ring-2 focus:ring-violet-200 ${isOpen ? 'ring-2 ring-violet-200 border-violet-300 bg-white' : ''}`
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {icon && (
            <div className={`text-slate-400 transition-colors ${!disabled && 'group-hover:text-violet-500'} ${isOpen ? 'text-violet-500' : ''}`}>
              {icon}
            </div>
          )}
          <span className={`text-sm font-medium truncate ${selectedOption && !disabled ? 'text-slate-700' : 'text-slate-400'}`}>
            {selectedOption && !disabled ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-violet-500' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 p-1.5">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-colors text-left mb-0.5 ${
                  isSelected 
                    ? 'bg-violet-50 text-violet-700 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-violet-600" />}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-2.5 text-xs text-slate-400 text-center italic">
              Nessuna opzione
            </div>
          )}
        </div>
      )}
    </div>
  );
};