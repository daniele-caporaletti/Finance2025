import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO, 
  isValid 
} from 'date-fns';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  className?: string;
}

const MONTHS_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const WEEKDAYS_IT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  value, 
  onChange,
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Current view of the calendar (defaults to selected date or today)
  const [viewDate, setViewDate] = useState(() => {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : new Date();
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update view when value changes externally
  useEffect(() => {
    const parsed = parseISO(value);
    if (isValid(parsed)) {
      setViewDate(parsed);
    }
  }, [value]);

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  const handleDayClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  // Generate days
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Format Display Value (e.g., "15 Gennaio 2025")
  const displayValue = isValid(parseISO(value)) 
    ? `${parseISO(value).getDate()} ${MONTHS_IT[parseISO(value).getMonth()]} ${parseISO(value).getFullYear()}`
    : "Seleziona Data";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 hover:border-violet-300 hover:bg-white rounded-2xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-violet-200 ${isOpen ? 'ring-2 ring-violet-200 border-violet-300 bg-white' : ''}`}
      >
        <CalendarIcon className={`w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors ${isOpen ? 'text-violet-500' : ''}`} />
        <span className={`text-sm font-medium ${value ? 'text-slate-700' : 'text-slate-400'}`}>
          {displayValue}
        </span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white border border-slate-100 rounded-3xl shadow-xl w-[320px] animate-in fade-in zoom-in-95 duration-200 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-violet-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-700">
              {MONTHS_IT[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button 
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-violet-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS_IT.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isSelected = value && isSameDay(day, parseISO(value));
              const isCurrentMonth = isSameMonth(day, viewDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`
                    h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium transition-all
                    ${isSelected 
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200 font-bold' 
                      : isCurrentMonth 
                        ? 'text-slate-700 hover:bg-violet-50 hover:text-violet-600' 
                        : 'text-slate-300'
                    }
                    ${isToday && !isSelected ? 'border border-violet-200 text-violet-600 font-bold' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};