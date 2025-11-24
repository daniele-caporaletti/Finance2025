
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
  // Mappers...
  const accountOptions = [{ label: "Tutti i Conti", value: "ALL" }, ...accounts.map(([n, c]) => ({ label: n, value: n }))];
  const categoryOptions = [{ label: "Tutte le Categorie", value: "ALL" }, ...Object.keys(categories).map(c => ({ label: c, value: c }))];
  const tagOptions = [{ label: "Tutti gli Eventi", value: "ALL" }, ...availableTags.map(t => ({ label: t, value: t }))];
  const analyticsOptions = [{ label: "Tutti", value: "ALL" }, { label: "Solo Spese/Entrate", value: "NO_TRANSFER" }, { label: "Solo Lavoro", value: "WORK_ONLY" }];

  return (
    <div className="bg-white/70 backdrop-blur-xl p-4 rounded-[2rem] shadow-sm border border-white/20 mb-6 relative z-30">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CustomSelect value={filters.accountId} onChange={v => setFilters(p => ({...p, accountId: v}))} options={accountOptions} icon={<Wallet className="w-4 h-4"/>} className="h-10 text-xs" />
        <CustomSelect value={filters.category} onChange={v => setFilters(p => ({...p, category: v}))} options={categoryOptions} icon={<Layers className="w-4 h-4"/>} className="h-10 text-xs" />
        <CustomSelect value={filters.eventTag} onChange={v => setFilters(p => ({...p, eventTag: v}))} options={tagOptions} icon={<Tag className="w-4 h-4"/>} className="h-10 text-xs" />
        <CustomSelect value={filters.analyticsType} onChange={v => setFilters(p => ({...p, analyticsType: v as any}))} options={analyticsOptions} icon={<FilterIcon className="w-4 h-4"/>} className="h-10 text-xs" />
      </div>
    </div>
  );
};
