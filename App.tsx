import React, { useEffect, useState, useMemo } from 'react';
import { fetchTransactions, deleteTransaction } from './services/api';
import { Transaction, FilterState, INITIAL_ACCOUNTS, INITIAL_CATEGORIES, AccountTuple } from './types';
import { Filters } from './components/Filters';
import { KPICards } from './components/KPICards';
import { TransactionTable } from './components/TransactionTable';
import { CategoryStats } from './components/CategoryStats';
import { ManagementPanel } from './components/ManagementPanel';
import { AddTransactionModal } from './components/AddTransactionModal';
import { KPIDetailView, DetailType } from './components/KPIDetailView';
import { TagStats } from './components/TagStats';
import { Loader2, Plus, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [activeView, setActiveView] = useState<DetailType | null>(null);
  const [selectedTagDetail, setSelectedTagDetail] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<AccountTuple[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Record<string, string[]>>(INITIAL_CATEGORIES);

  const [filters, setFilters] = useState<FilterState>({
    periodType: 'MONTH',
    selectedMonth: new Date().getMonth(),
    selectedYear: 2025,
    accountId: 'ALL',
    category: 'ALL',
    analyticsType: 'ALL',
    eventTag: 'ALL'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions();
      const data2025 = data.filter(t => new Date(t.date).getFullYear() === 2025);
      setRawData(data2025);
      setError(null);
    } catch (err) {
      setError("Impossibile caricare i dati. L'API potrebbe essere offline. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await deleteTransaction(id);
      await loadData();
    } catch (err) {
      setError("Errore durante l'eliminazione del movimento.");
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingTransaction(null), 300);
  };

  const handleCardClick = (type: DetailType) => {
      if (activeView === type) {
          setActiveView(null);
          setSelectedTagDetail(null);
      } else {
          setActiveView(type);
          setSelectedTagDetail(null);
      }
  };

  const handleTagClick = (tagName: string) => {
      setActiveView('TAG');
      setSelectedTagDetail(tagName);
  };

  const handleCloseDetail = () => {
      setActiveView(null);
      setSelectedTagDetail(null);
  };
  
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    rawData.forEach(t => {
      if (t.flag && t.flag.trim() !== '') tags.add(t.flag.trim());
    });
    return Array.from(tags).sort();
  }, [rawData]);

  const balanceTransactions = useMemo(() => {
    return rawData.filter(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() !== filters.selectedYear) return false;
      if (filters.accountId !== 'ALL' && t.account !== filters.accountId) return false;
      return true;
    });
  }, [rawData, filters.selectedYear, filters.accountId]);

  const filteredTransactions = useMemo(() => {
    return rawData.filter(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() !== filters.selectedYear) return false;
      if (filters.periodType === 'MONTH') {
        if (tDate.getMonth() !== filters.selectedMonth) return false;
      }
      if (filters.accountId !== 'ALL' && t.account !== filters.accountId) return false;
      if (filters.category !== 'ALL' && t.category !== filters.category) return false;
      if (filters.eventTag !== 'ALL' && t.flag !== filters.eventTag) return false;
      if (filters.analyticsType === 'NO_TRANSFER' && t.analytics === 'FALSE') return false;
      if (filters.analyticsType === 'WORK_ONLY' && t.analytics !== 'WORK') return false;
      if (filters.analyticsType === 'TRANSFERS_ONLY' && t.analytics !== 'FALSE') return false;
      return true;
    });
  }, [rawData, filters]);

  return (
    <div className="min-h-screen pb-20">
      
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600 p-2 rounded-xl text-white shadow-lg shadow-violet-200">
               <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Finance 2025</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Dashboard Finanziaria</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
              className="hidden md:flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Aggiungi Movimento
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-8">
        
        {loading && rawData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-violet-500" />
            <p className="text-lg font-medium text-slate-500">Sto caricando i tuoi dati...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-20 bg-rose-50 text-rose-800 p-6 rounded-3xl border border-rose-100 text-center">
            <p className="font-bold mb-2">Ops, qualcosa è andato storto!</p>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <Filters 
              filters={filters} 
              setFilters={setFilters} 
              accounts={accounts}
              categories={categories}
              availableTags={availableTags}
            />
            <KPICards 
              periodTransactions={filteredTransactions} 
              balanceTransactions={balanceTransactions} 
              activeView={activeView}
              onCardClick={handleCardClick}
            />
            {activeView ? (
               <KPIDetailView 
                  type={activeView}
                  transactions={balanceTransactions}
                  year={filters.selectedYear}
                  tagName={selectedTagDetail}
                  onClose={handleCloseDetail}
               />
            ) : (
               <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-full xl:w-3/4 order-2 xl:order-1">
                      <TransactionTable 
                        transactions={filteredTransactions} 
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                  </div>
                  <div className="w-full xl:w-1/4 order-1 xl:order-2">
                      <div className="sticky top-24 flex flex-col gap-6">
                          <div className="h-[500px]">
                              <ManagementPanel 
                                  accounts={accounts}
                                  setAccounts={setAccounts}
                                  categories={categories}
                                  setCategories={setCategories}
                                  allTransactions={rawData}
                                  onDataChange={loadData}
                              />
                          </div>
                          <CategoryStats transactions={filteredTransactions} />
                          <TagStats 
                              transactions={filteredTransactions}
                              onTagClick={handleTagClick}
                          />
                      </div>
                  </div>
               </div>
            )}
          </>
        )}
      </main>

      <button
        onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-2xl shadow-xl shadow-violet-300 flex items-center justify-center z-50 active:scale-95 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={loadData}
        accounts={accounts}
        categories={categories}
        initialData={editingTransaction}
      />
    </div>
  );
};

export default App;