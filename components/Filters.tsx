import React from 'react';
import { FilterState, AccountTuple } from '../types';
import { Calendar, Layers, Tag, Filter as FilterIcon, Wallet } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  accounts: AccountTuple[];
  categories: Record<string, string[]>;
  availableTags: string[];
}

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

export const Filters: React.FC<FiltersProps> = ({ filters, setFilters, accounts, categories, availableTags }) => {
  
  const handlePeriodTypeChange = (type: 'MONTH' | 'YEAR') => {
    setFilters(prev => ({ ...prev, periodType: type }));
  };

  const handleMonthChange = (val: string) => {
    setFilters(prev => ({ ...prev, selectedMonth: parseInt(val, 10) }));
  };

  const handleAccountChange = (val: string) => {
    setFilters(prev => ({ ...prev, accountId: val }));
  };

  const handleCategoryChange = (val: string) => {
    setFilters(prev => ({ ...prev, category: val }));
  };

  const handleAnalyticsChange = (val: string) => {
    setFilters(prev => ({ ...prev, analyticsType: val as any }));
  };

  const handleTagChange = (val: string) => {
    setFilters(prev => ({ ...prev, eventTag: val }));
  };

  // Option Mappers
  const monthOptions = MONTHS.map((m, idx) => ({ 
    label: `${m} ${filters.selectedYear}`, 
    value: idx 
  }));

  const accountOptions = [
    { label: "Tutti i Conti", value: "ALL" },
    ...accounts.map(([name, curr]) => ({ label: `${name} (${curr})`, value: name }))
  ];

  const categoryOptions = [
    { label: "Tutte le Categorie", value: "ALL" },
    ...Object.keys(categories).map(cat => ({ label: cat, value: cat }))
  ];

  const tagOptions = [
    { label: "Tutti gli Eventi", value: "ALL" },
    ...availableTags.map(tag => ({ label: tag, value: tag }))
  ];

  const analyticsOptions = [
    { label: "Tutti i movimenti", value: "ALL" },
    { label: "Solo Spese/Entrate", value: "NO_TRANSFER" },
    { label: "Solo Lavoro", value: "WORK_ONLY" },
    { label: "Solo Trasferimenti", value: "TRANSFERS_ONLY" }
  ];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm mb-8 border border-slate-100">
      
      {/* Row 1: Period Selection */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
        
        {/* Segmented Button for Period */}
        <div className="bg-slate-100 p-1.5 rounded-full inline-flex shadow-inner">
          <button
            onClick={() => handlePeriodTypeChange('MONTH')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
              filters.periodType === 'MONTH' 
                ? 'bg-white text-violet-700 shadow-md' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Mese
          </button>
          <button
            onClick={() => handlePeriodTypeChange('YEAR')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
              filters.periodType === 'YEAR' 
                ? 'bg-white text-violet-700 shadow-md' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Anno {filters.selectedYear}
          </button>
        </div>

        {/* Month Selector (Only visible if Month selected) */}
        {filters.periodType === 'MONTH' && (
          <div className="w-full md:w-64">
            <CustomSelect
              value={filters.selectedMonth}
              onChange={handleMonthChange}
              options={monthOptions}
              icon={<Calendar className="w-5 h-5"/>}
            />
          </div>
        )}
      </div>

      {/* Row 2: Detail Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Account */}
        <CustomSelect
          value={filters.accountId}
          onChange={handleAccountChange}
          options={accountOptions}
          icon={<Wallet className="h-4 w-4" />}
          placeholder="Seleziona Conto"
        />

        {/* Category */}
        <CustomSelect
          value={filters.category}
          onChange={handleCategoryChange}
          options={categoryOptions}
          icon={<Layers className="h-4 w-4" />}
          placeholder="Seleziona Categoria"
        />

        {/* Tags */}
        <CustomSelect
          value={filters.eventTag}
          onChange={handleTagChange}
          options={tagOptions}
          icon={<Tag className="h-4 w-4" />}
          placeholder="Filtra per Tag"
        />

        {/* Type/Analytics */}
        <CustomSelect
          value={filters.analyticsType}
          onChange={handleAnalyticsChange}
          options={analyticsOptions}
          icon={<FilterIcon className="h-4 w-4" />}
          placeholder="Tipo Movimento"
        />

      </div>
    </div>
  );
};
