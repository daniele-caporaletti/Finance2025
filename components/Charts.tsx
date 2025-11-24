import React from 'react';
import { Transaction } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ChartsProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  
  // Prepare data for Category Pie Chart (Expenses only)
  const categoryData = React.useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      // Exclude Transfers (FALSE) and Work (WORK)
      if (t.analytics !== 'FALSE' && t.analytics !== 'WORK' && t.valueChf < 0) {
        const cat = t.category;
        const amount = Math.abs(t.valueChf);
        map.set(cat, (map.get(cat) || 0) + amount);
      }
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [transactions]);

  // Prepare data for Daily spending Bar Chart
  const dailyData = React.useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      // Net flow per day, excluding WORK and FALSE
      if (t.analytics !== 'FALSE' && t.analytics !== 'WORK') {
        const dateKey = new Date(t.date).getDate(); // Just day number for simplicity in monthly view
        map.set(String(dateKey), (map.get(String(dateKey)) || 0) + t.valueChf);
      }
    });

    return Array.from(map.entries())
      .map(([day, amount]) => ({ day: parseInt(day), amount }))
      .sort((a, b) => a.day - b.day);
  }, [transactions]);

  if (transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* Category Distribution */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Spese per Categoria (Excl. Lavoro)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
            {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length]}}></span>
                    {entry.name}
                </div>
            ))}
        </div>
      </div>

      {/* Daily Flow */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Flusso Giornaliero CHF (Excl. Lavoro)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip 
                formatter={(value: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value)}
                labelFormatter={(label) => `Giorno ${label}`}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};