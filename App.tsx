import React, { useEffect, useState, useMemo } from 'react';
import { fetchTransactions, deleteTransaction } from './services/api';
import { Transaction, FilterState, INITIAL_ACCOUNTS, INITIAL_CATEGORIES, AccountTuple } from './types';

// Components
import { Filters } from './components/Filters';
import { KPICards } from './components/KPICards';
import { TransactionTable } from './components/TransactionTable';
import { CategoryStats } from './components/CategoryStats';
import { ManagementPanel } from './components/ManagementPanel';
import { AddTransactionModal } from './components/AddTransactionModal';
import { KPIDetailView, DetailType } from './components/KPIDetailView';
import { LoginScreen } from './components/LoginScreen';
import { CustomSelect } from './components/CustomSelect';

// Icons & Utils
import { Loader2, Plus, LayoutDashboard, LogOut, SlidersHorizontal, ChevronDown, ChevronUp, Calendar, Download } from 'lucide-react';

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const App: React.FC = () => {
  // =========================================
  // STATE MANAGEMENT
  // =========================================
  
  // Auth & Data
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('finance_apikey'));
  const [rawData, setRawData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings (Accounts/Categories)
  const [accounts, setAccounts] = useState<AccountTuple[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Record<string, string[]>>(INITIAL_CATEGORIES);

  // UI State (Modals, Views)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<DetailType | null>(null);
  const [selectedTagDetail, setSelectedTagDetail] = useState<string | null>(null);
  const [showWidgetsMobile, setShowWidgetsMobile] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    periodType: 'MONTH',
    selectedMonth: new Date().getMonth(),
    selectedYear: 2025,
    accountId: 'ALL',
    category: 'ALL',
    analyticsType: 'ALL',
    eventTag: 'ALL'
  });

  // =========================================
  // PWA INSTALL LOGIC
  // =========================================
  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // =========================================
  // DATA LOADING & EFFECTS
  // =========================================

  const loadData = async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactions(key);
      // Filter primarily by year 2025 as per app scope
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

  // =========================================
  // MEMOIZED CALCULATIONS
  // =========================================

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    rawData.forEach(t => {
      if (t.flag && t.flag.trim() !== '') tags.add(t.flag.trim());
    });
    return Array.from(tags).sort();
  }, [rawData]);

  // Data for Balance KPI (Yearly view usually)
  const balanceTransactions = useMemo(() => {
    return rawData.filter(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() !== filters.selectedYear) return false;
      if (filters.accountId !== 'ALL' && t.account !== filters.accountId) return false;
      return true;
    });
  }, [rawData, filters.selectedYear, filters.accountId]);

  // Main Filtered Data for Table/Graphs
  const filteredTransactions = useMemo(() => {
    return rawData.filter(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() !== filters.selectedYear) return false;
      if (filters.periodType === 'MONTH') {
        if (tDate.getMonth() !== filters.selectedMonth) return false;
      }
      // Standard Filters
      if (filters.accountId !== 'ALL' && t.account !== filters.accountId) return false;
      if (filters.category !== 'ALL' && t.category !== filters.category) return false;
      if (filters.eventTag !== 'ALL' && t.flag !== filters.eventTag) return false;
      
      // Analytics Type Filter
      if (filters.analyticsType === 'NO_TRANSFER' && t.analytics === 'FALSE') return false;
      if (filters.analyticsType === 'WORK_ONLY' && t.analytics !== 'WORK') return false;
      if (filters.analyticsType === 'TRANSFERS_ONLY' && t.analytics !== 'FALSE') return false;
      
      return true;
    });
  }, [rawData, filters]);

  // Data passed to Detail Views (respects most filters except Analytics Type)
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

  // =========================================
  // EVENT HANDLERS
  // =========================================

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
      if (type === 'TAGS_SUMMARY') setSelectedTagDetail(null);
  };

  const handleTagClick = (tagName: string) => {
      if (tagName === '') {
          setActiveView('TAGS_SUMMARY');
          setSelectedTagDetail(null);
      } else {
          setActiveView('TAG');
          setSelectedTagDetail(tagName);
      }
  };

  // Month Options for Select
  const monthOptions = MONTHS.map((m, idx) => ({ 
    label: `${m} ${filters.selectedYear}`, 
    value: idx 
  }));

  // =========================================
  // RENDER
  // =========================================

  if (!apiKey) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-20 bg-[#fdfbff]">
      
      {/* Header Bar */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-auto min-h-[80px] py-4 sm:py-0 sm:h-20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-violet-600 p-2 rounded-xl text-white shadow-lg shadow-violet-200">
               <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">Finance 2025</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider hidden sm:block">Dashboard</p>
            </div>
          </div>

          {/* Period Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto order-3 sm:order-2 justify-center flex-1">
             <div className="bg-slate-100 p-1.5 rounded-full inline-flex shadow-inner shrink-0">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, periodType: 'MONTH' }))}
                  className={`px-6 py-2.5 sm:px-5 sm:py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                    filters.periodType === 'MONTH' ? 'bg-white text-violet-700 shadow-md' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Mese
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, periodType: 'YEAR' }))}
                  className={`px-6 py-2.5 sm:px-5 sm:py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                    filters.periodType === 'YEAR' ? 'bg-white text-violet-700 shadow-md' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Anno
                </button>
             </div>

             <div className="w-full sm:w-48 transition-opacity duration-200">
               <CustomSelect
                  value={filters.periodType === 'YEAR' ? "" : filters.selectedMonth}
                  onChange={(val) => setFilters(prev => ({ ...prev, selectedMonth: parseInt(val, 10) }))}
                  options={monthOptions}
                  icon={<Calendar className="w-4 h-4"/>}
                  className="h-12 sm:h-10" // Taller on mobile
                  disabled={filters.periodType === 'YEAR'}
                  placeholder={filters.periodType === 'YEAR' ? "Tutto l'anno" : "Seleziona Mese"}
               />
             </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3 order-2 sm:order-3 shrink-0">
            {installPrompt && (
                <button
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all text-xs sm:text-sm"
                    title="Installa App"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Installa</span>
                </button>
            )}

            <button
                onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
                className="hidden md:flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-full font-bold shadow-md shadow-violet-200 hover:bg-violet-700 hover:shadow-lg transition-all active:scale-95 text-sm"
            >
                <Plus className="w-4 h-4" />
                <span>Nuovo Movimento</span>
            </button>

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

      {/* Main Content Area */}
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
            
            {/* Conditional View: Detail vs Dashboard */}
            {activeView ? (
               <KPIDetailView 
                  type={activeView}
                  transactions={detailViewTransactions}
                  year={filters.selectedYear}
                  tagName={selectedTagDetail}
                  onClose={() => { setActiveView(null); setSelectedTagDetail(null); }}
                  onTagSelect={handleTagClick}
                  periodType={filters.periodType}
                  selectedMonth={filters.selectedMonth}
               />
            ) : (
               <>
                 {/* Mobile Widget Toggle */}
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

                 <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Sidebar: Widgets (Management, Stats) */}
                    <div className={`w-full xl:w-1/4 xl:order-2 ${showWidgetsMobile ? 'block' : 'hidden xl:block'}`}>
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
                        </div>
                    </div>

                    {/* Main Content: Transactions Table */}
                    <div className="w-full xl:w-3/4 xl:order-1">
                        <TransactionTable 
                          transactions={filteredTransactions} 
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          apiKey={apiKey}
                        />
                    </div>

                 </div>
               </>
            )}
          </>
        )}
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-2xl shadow-xl shadow-violet-300 flex items-center justify-center z-50 active:scale-95 transition-transform hover:bg-violet-700"
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