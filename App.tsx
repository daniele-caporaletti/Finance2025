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
import { LoginScreen } from './components/LoginScreen';
import { Loader2, Plus, LayoutDashboard, LogOut, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

const App: React.FC = () => {
  // Store API Key instead of JWT token
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('finance_apikey'));

  const [rawData, setRawData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [activeView, setActiveView] = useState<DetailType | null>(null);
  const [selectedTagDetail, setSelectedTagDetail] = useState<string | null>(null);

  // Mobile state for widget visibility
  const [showWidgetsMobile, setShowWidgetsMobile] = useState(false);

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

  const loadData = async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactions(key);
      const data2025 = data.filter(t => new Date(t.date).getFullYear() === 2025);
      setRawData(data2025);
    } catch (err) {
      console.error(err);
      setError("Chiave non valida o errore di connessione.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      loadData(apiKey);
    }
  }, [apiKey]);

  const handleLogin = (key: string) => {
    localStorage.setItem('finance_apikey', key);
    setApiKey(key);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('finance_apikey');
    setApiKey(null);
    setRawData([]);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    if(!apiKey) return;
    try {
      await deleteTransaction(id, apiKey);
      await loadData(apiKey);
    } catch (err) {
      setError("Errore durante l'eliminazione del movimento.");
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
      setActiveView(activeView === type ? null : type);
      setSelectedTagDetail(null);
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

  const detailViewTransactions = useMemo(() => {
    return rawData.filter(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() !== filters.selectedYear) return false;
      if (filters.periodType === 'MONTH') {
        if (tDate.getMonth() !== filters.selectedMonth) return false;
      }
      if (filters.accountId !== 'ALL' && t.account !== filters.accountId) return false;
      if (filters.category !== 'ALL' && t.category !== filters.category) return false;
      if (filters.eventTag !== 'ALL' && t.flag !== filters.eventTag) return false;
      return true;
    });
  }, [rawData, filters]);

  if (!apiKey) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-20 bg-[#fdfbff]">
      
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600 p-2 rounded-xl text-white shadow-lg shadow-violet-200">
               <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">Finance 2025</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider hidden sm:block">Dashboard Finanziaria</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700 rounded-full transition-colors text-xs sm:text-sm font-bold"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Esci</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        
        {loading && rawData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-violet-500" />
            <p className="text-lg font-medium text-slate-500">Sto caricando i tuoi dati...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-20 bg-rose-50 text-rose-800 p-8 rounded-3xl border border-rose-100 text-center shadow-sm">
            <p className="font-bold text-lg mb-2">Accesso Negato</p>
            <p className="mb-6 opacity-80">{error}</p>
            <button onClick={handleLogout} className="px-6 py-2 bg-white text-rose-600 font-bold rounded-xl shadow-sm hover:bg-rose-50">Riprova Login</button>
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
              periodType={filters.periodType}
            />
            {activeView ? (
               <KPIDetailView 
                  type={activeView}
                  transactions={detailViewTransactions}
                  year={filters.selectedYear}
                  tagName={selectedTagDetail}
                  onClose={handleCloseDetail}
                  periodType={filters.periodType}
                  selectedMonth={filters.selectedMonth}
               />
            ) : (
               <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Main Content: Table (Priority on Mobile) */}
                  <div className="w-full xl:w-3/4">
                      {/* Mobile Toggle for Widgets */}
                      <div className="xl:hidden mb-4">
                        <button 
                          onClick={() => setShowWidgetsMobile(!showWidgetsMobile)}
                          className="w-full flex items-center justify-between px-5 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-700 font-bold active:scale-[0.99] transition-transform"
                        >
                          <div className="flex items-center gap-3">
                            <SlidersHorizontal className="w-5 h-5 text-violet-600" />
                            <span>{showWidgetsMobile ? 'Nascondi' : 'Mostra'} Analisi e Gestione</span>
                          </div>
                          {showWidgetsMobile ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                      </div>

                      <TransactionTable 
                        transactions={filteredTransactions} 
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        apiKey={apiKey}
                      />
                  </div>

                  {/* Sidebar: Widgets (Sticky on Desktop, Collapsible on Mobile) */}
                  <div className={`w-full xl:w-1/4 ${showWidgetsMobile ? 'block' : 'hidden xl:block'}`}>
                      <div className="sticky top-24 flex flex-col gap-6">
                          <div className="h-[500px]">
                              <ManagementPanel 
                                  accounts={accounts}
                                  setAccounts={setAccounts}
                                  categories={categories}
                                  setCategories={setCategories}
                                  allTransactions={rawData}
                                  onDataChange={() => loadData(apiKey)}
                                  apiKey={apiKey}
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-2xl shadow-xl shadow-violet-300 flex items-center justify-center z-50 active:scale-95 transition-transform hover:bg-violet-700"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={() => loadData(apiKey)}
        accounts={accounts}
        categories={categories}
        initialData={editingTransaction}
        apiKey={apiKey}
      />
    </div>
  );
};

export default App;