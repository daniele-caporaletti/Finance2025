
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
import { Loader2, Plus, LayoutDashboard, LogOut, Calendar, Download, Home, PieChart, Settings, Wallet } from 'lucide-react';

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

type MobileTab = 'HOME' | 'ANALYTICS' | 'MANAGEMENT';

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
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('HOME');

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
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // =========================================
  // DATA LOADING & EFFECTS
  // =========================================

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

  // =========================================
  // HANDLERS
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
      setError("Errore durante l'eliminazione.");
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

  const monthOptions = MONTHS.map((m, idx) => ({ label: `${m}`, value: idx }));

  // =========================================
  // RENDER
  // =========================================

  if (!apiKey) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-28 md:pb-10">
      
      {/* --- HEADER GLASS --- */}
      {/* Increased z-index to 60 to sit above Filters (z-30) */}
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Left: Logo & Install */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
                  <LayoutDashboard className="w-6 h-6" />
               </div>
               <span className="font-bold text-xl tracking-tight hidden sm:block">Finance 2025</span>
            </div>
            {installPrompt && (
                <button 
                  onClick={handleInstallClick} 
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] sm:text-xs font-bold hover:bg-emerald-100 transition-colors animate-in fade-in zoom-in"
                >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" /> 
                    <span className="hidden sm:inline">Installa App</span>
                    <span className="sm:hidden">Installa</span>
                </button>
            )}
          </div>

          {/* Center: Period Selector (BIGGER) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
             <div className="flex p-1.5 bg-slate-100/80 rounded-2xl shadow-inner">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, periodType: 'MONTH' }))}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filters.periodType === 'MONTH' ? 'bg-white text-violet-700 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >Mese</button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, periodType: 'YEAR' }))}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filters.periodType === 'YEAR' ? 'bg-white text-violet-700 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >Anno</button>
             </div>
             <div className="w-40 hidden md:block relative z-[100]">
               <CustomSelect
                  value={filters.periodType === 'YEAR' ? "" : filters.selectedMonth}
                  onChange={(val) => setFilters(prev => ({ ...prev, selectedMonth: parseInt(val, 10) }))}
                  options={monthOptions}
                  disabled={filters.periodType === 'YEAR'}
                  placeholder="Tutto l'anno"
                  className="h-12 text-sm font-medium"
               />
             </div>
          </div>
          
          {/* Right: Actions & HERO BUTTON */}
          <div className="flex items-center gap-4">
            <button
                onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 active:translate-y-0 text-sm"
            >
                <Plus className="w-5 h-5" /> Nuovo Movimento
            </button>
            <button onClick={handleLogout} className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-colors" title="Esci">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Mobile Month Selector (Sub-header) */}
        {filters.periodType === 'MONTH' && (
            <div className="md:hidden px-4 pb-4 pt-2 bg-white/80 backdrop-blur-xl border-b border-slate-100 relative z-30">
                <CustomSelect
                  value={filters.selectedMonth}
                  onChange={(val) => setFilters(prev => ({ ...prev, selectedMonth: parseInt(val, 10) }))}
                  options={monthOptions}
                  icon={<Calendar className="w-5 h-5 text-violet-500"/>}
                  placeholder="Seleziona Mese"
                  className="h-12 text-sm font-bold"
               />
            </div>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-8">
        {loading && rawData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-violet-500" />
            <p className="text-base font-medium">Caricamento dati in corso...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-20 bg-white/80 backdrop-blur p-10 rounded-[2rem] border border-rose-100 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-rose-500" />
            </div>
            <p className="font-bold text-xl text-rose-600 mb-2">Accesso Negato</p>
            <p className="mb-8 text-slate-500">{error}</p>
            <button onClick={handleLogout} className="w-full px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Torna al Login</button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            
            {/* DESKTOP LAYOUT */}
            <div className="hidden xl:block">
               {/* Persistent Filters */}
               <Filters 
                   filters={filters} 
                   setFilters={setFilters} 
                   accounts={accounts}
                   categories={categories}
                   availableTags={availableTags}
               />

               {/* Content View: Detail OR Dashboard */}
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
                       <KPICards 
                           periodTransactions={filteredTransactions} 
                           balanceTransactions={balanceTransactions} 
                           activeView={activeView}
                           onCardClick={handleCardClick}
                           periodType={filters.periodType}
                       />
                       <div className="flex gap-8 mt-8">
                           {/* Left: Table (70%) */}
                           <div className="w-[70%] order-1">
                               <TransactionTable 
                                   transactions={filteredTransactions} 
                                   onDelete={handleDelete} 
                                   onEdit={handleEdit} 
                                   apiKey={apiKey} 
                               />
                           </div>
                           {/* Right: Widgets (30%) */}
                           <div className="w-[30%] order-2 flex flex-col gap-6">
                               <div className="sticky top-24 flex flex-col gap-6">
                                   <CategoryStats transactions={filteredTransactions} />
                                   <ManagementPanel 
                                       accounts={accounts} setAccounts={setAccounts}
                                       categories={categories} setCategories={setCategories}
                                       allTransactions={rawData} onDataChange={() => loadData(apiKey)} apiKey={apiKey}
                                   />
                               </div>
                           </div>
                       </div>
                   </>
               )}
            </div>

            {/* MOBILE LAYOUT (TAB BASED) */}
            <div className="xl:hidden">
               {/* Detail View takes precedence on mobile if active */}
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
                       {mobileTab === 'HOME' && (
                           <div className="space-y-6">
                               {/* KPI Scrollable Row */}
                               <div className="-mx-4 px-4">
                                   <KPICards 
                                       periodTransactions={filteredTransactions} 
                                       balanceTransactions={balanceTransactions} 
                                       activeView={activeView}
                                       onCardClick={handleCardClick}
                                       periodType={filters.periodType}
                                   />
                               </div>
                               <TransactionTable 
                                   transactions={filteredTransactions} 
                                   onDelete={handleDelete} 
                                   onEdit={handleEdit} 
                                   apiKey={apiKey} 
                               />
                           </div>
                       )}

                       {mobileTab === 'ANALYTICS' && (
                           <div className="space-y-6 pb-20">
                               <Filters 
                                   filters={filters} setFilters={setFilters} 
                                   accounts={accounts} categories={categories} availableTags={availableTags}
                               />
                               <CategoryStats transactions={filteredTransactions} />
                           </div>
                       )}

                       {mobileTab === 'MANAGEMENT' && (
                           <div className="pb-20">
                               <ManagementPanel 
                                   accounts={accounts} setAccounts={setAccounts}
                                   categories={categories} setCategories={setCategories}
                                   allTransactions={rawData} onDataChange={() => loadData(apiKey)} apiKey={apiKey}
                               />
                           </div>
                       )}
                   </>
               )}
            </div>

          </div>
        )}
      </main>

      {/* --- MOBILE BOTTOM NAV (GRID LAYOUT) --- */}
      {!activeView && (
      <nav className="xl:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-safe z-50 px-4 py-2 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] h-20">
          <div className="grid grid-cols-5 h-full items-center">
              {/* 1. Home */}
              <button 
                onClick={() => setMobileTab('HOME')}
                className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'HOME' ? 'text-violet-600' : 'text-slate-400'}`}
              >
                 <Home className={`w-6 h-6 ${mobileTab === 'HOME' ? 'fill-violet-100' : ''}`} />
                 <span className="text-[10px] font-bold">Home</span>
              </button>

              {/* 2. Analytics */}
              <button 
                onClick={() => setMobileTab('ANALYTICS')}
                className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'ANALYTICS' ? 'text-violet-600' : 'text-slate-400'}`}
              >
                 <PieChart className={`w-6 h-6 ${mobileTab === 'ANALYTICS' ? 'fill-violet-100' : ''}`} />
                 <span className="text-[10px] font-bold">Analisi</span>
              </button>

              {/* 3. FAB (Centered in Grid) */}
              <div className="flex items-center justify-center -mt-1">
                 <button
                    onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
                    className="w-14 h-14 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center text-white active:scale-95 transition-transform border-4 border-white"
                 >
                    <Plus className="w-7 h-7" />
                 </button>
              </div>

              {/* 4. Management */}
              <button 
                onClick={() => setMobileTab('MANAGEMENT')}
                className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'MANAGEMENT' ? 'text-violet-600' : 'text-slate-400'}`}
              >
                 <Wallet className={`w-6 h-6 ${mobileTab === 'MANAGEMENT' ? 'fill-violet-100' : ''}`} />
                 <span className="text-[10px] font-bold">Gestione</span>
              </button>

              {/* 5. Logout */}
              <button 
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 text-slate-300 hover:text-rose-500 transition-colors"
              >
                 <Settings className="w-6 h-6" />
                 <span className="text-[10px] font-bold">Logout</span>
              </button>
          </div>
      </nav>
      )}

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={() => loadData(apiKey!)}
        accounts={accounts}
        categories={categories}
        initialData={editingTransaction}
        apiKey={apiKey}
      />
    </div>
  );
};

export default App;
