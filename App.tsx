import React, { useEffect, useState, useMemo } from 'react';
import { fetchTransactions, deleteTransaction } from './services/api';
import { Transaction, FilterState, INITIAL_ACCOUNTS, INITIAL_CATEGORIES, AccountTuple, User } from './types';
import { Filters } from './components/Filters';
import { KPICards } from './components/KPICards';
import { TransactionTable } from './components/TransactionTable';
import { CategoryStats } from './components/CategoryStats';
import { ManagementPanel } from './components/ManagementPanel';
import { AddTransactionModal } from './components/AddTransactionModal';
import { KPIDetailView, DetailType } from './components/KPIDetailView';
import { TagStats } from './components/TagStats';
import { LoginScreen } from './components/LoginScreen';
import { Loader2, Plus, LayoutDashboard, LogOut } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);

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

  const loadData = async (accessToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactions(accessToken);
      const data2025 = data.filter(t => new Date(t.date).getFullYear() === 2025);
      setRawData(data2025);
    } catch (err) {
      console.error(err);
      setError("Impossibile caricare i dati. Verifica la connessione e che il tuo account Google abbia accesso allo script.");
      // If loading fails, maybe the token is expired, log out
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
        loadData(token);
      } catch (e) {
        console.error("Invalid token", e);
        handleLogout();
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLoginSuccess = (response: any) => {
    const new_token = response.credential;
    localStorage.setItem('authToken', new_token);
    setToken(new_token);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setRawData([]);
    // @ts-ignore
    if(window.google) window.google.accounts.id.disableAutoSelect();
  };

  const handleDelete = async (id: number) => {
    if(!token) return;
    try {
      await deleteTransaction(id, token);
      // Optimistic update can be done here, or just reload
      await loadData(token);
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

  if (!token || !user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

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
            <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-slate-700">{user.name}</p>
               <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
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
                  transactions={detailViewTransactions}
                  year={filters.selectedYear}
                  tagName={selectedTagDetail}
                  onClose={handleCloseDetail}
                  periodType={filters.periodType}
                  selectedMonth={filters.selectedMonth}
               />
            ) : (
               <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-full xl:w-3/4 order-2 xl:order-1">
                      <TransactionTable 
                        transactions={filteredTransactions} 
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        token={token}
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
                                  onDataChange={() => loadData(token)}
                                  token={token}
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-2xl shadow-xl shadow-violet-300 flex items-center justify-center z-50 active:scale-95 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={() => loadData(token)}
        accounts={accounts}
        categories={categories}
        initialData={editingTransaction}
        token={token}
      />
    </div>
  );
};

export default App;