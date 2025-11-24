import React from 'react';
import { FilterState, AccountTuple } from '../types';
import { Layers, Tag, Filter as FilterIcon, Wallet } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  accounts: AccountTuple[];
  categories: Record<string, string[]>;
  availableTags: string[];
}

export const Filters: React.FC<FiltersProps> = ({ filters, setFilters, accounts, categories, availableTags }) => {
  
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