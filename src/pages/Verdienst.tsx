import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Line, ComposedChart,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Wallet, Receipt, Percent,
  TrendingUp,
} from 'lucide-react';

/* ═════════ MOCK DATA — 12 Months ═════════ */

const monthlyData = [
  { month: 'Jan', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Feb', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Mar', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Apr', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Mai', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Jun', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Jul', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Aug', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Sep', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Okt', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Nov', revenue: 0, expenses: 0, profit: 0, margin: 0 },
  { month: 'Dez', revenue: 0, expenses: 0, profit: 0, margin: 0 },
];

const expenseCategories: { name: string; value: number; color: string }[] = [];

const recentTransactions: { id: number; description: string; amount: number; type: 'income' | 'expense'; date: string; category: string }[] = [];

/* ═════════ ANIMATION ═════════ */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ═════════ KPI CARD ═════════ */

function KpiCard({ title, value, change, changeType, icon: Icon, accent }: {
  title: string; value: string; change: string; changeType: 'up' | 'down'; icon: typeof TrendingUp; accent: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.12)' }}
      className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl p-5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}1F` }}>
          <Icon size={20} style={{ color: accent }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${changeType === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          {changeType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <p className="text-[28px] font-mono font-medium text-white leading-tight">{value}</p>
      <p className="text-xs text-[#A1A4AA] mt-1">{title}</p>
    </motion.div>
  );
}

/* ═════════ CUSTOM TOOLTIP ═════════ */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(12,13,15,0.95)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
      <p className="text-white font-medium mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#A1A4AA]">{p.name}:</span>
          <span className="text-white font-mono">{typeof p.value === 'number' ? p.value.toLocaleString('de-DE') : p.value} &euro;</span>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(12,13,15,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: p.payload.color }} />
        <span className="text-[#A1A4AA]">{p.name}:</span>
        <span className="text-white font-mono">{p.value.toLocaleString('de-DE')} &euro;</span>
      </div>
    </div>
  );
}

/* ═════════ MAIN COMPONENT ═════════ */

export default function Verdienst() {
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const totals = useMemo(() => {
    const revenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
    const expenses = monthlyData.reduce((s, d) => s + d.expenses, 0);
    const profit = revenue - expenses;
    const margin = (profit / revenue) * 100;
    const currentMonth = monthlyData[monthlyData.length - 1];
    return { revenue, expenses, profit, margin, currentMonth };
  }, []);

  const quarterlyData = useMemo(() => {
    const quarters = [
      { name: 'Q1', months: [0, 1, 2] },
      { name: 'Q2', months: [3, 4, 5] },
      { name: 'Q3', months: [6, 7, 8] },
      { name: 'Q4', months: [9, 10, 11] },
    ];
    return quarters.map(q => ({
      month: q.name,
      revenue: q.months.reduce((s, i) => s + monthlyData[i].revenue, 0),
      expenses: q.months.reduce((s, i) => s + monthlyData[i].expenses, 0),
      profit: q.months.reduce((s, i) => s + monthlyData[i].profit, 0),
      margin: parseFloat(((q.months.reduce((s, i) => s + monthlyData[i].profit, 0) / q.months.reduce((s, i) => s + monthlyData[i].revenue, 0)) * 100).toFixed(1)),
    }));
  }, []);

  const displayData = viewMode === 'monthly' ? monthlyData : quarterlyData;

  return (
    <div>
      {/* ── KPI Cards ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard title="Gesamtumsatz YTD" value={`${totals.revenue.toLocaleString('de-DE')} \u20AC`} change="+12.5%" changeType="up" icon={Wallet} accent="#FF8C5A" />
        <KpiCard title="Monatlicher Umsatz" value={`${totals.currentMonth.revenue.toLocaleString('de-DE')} \u20AC`} change="+8.2%" changeType="up" icon={TrendingUp} accent="#36CFC9" />
        <KpiCard title="Ausgaben YTD" value={`${totals.expenses.toLocaleString('de-DE')} \u20AC`} change="+5.1%" changeType="down" icon={Receipt} accent="#EF4444" />
        <KpiCard title="Gewinnmarge" value={`${totals.margin.toFixed(1)}%`} change="+3.2%" changeType="up" icon={Percent} accent="#B98BFF" />
      </motion.div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Bar + Line Chart */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="lg:col-span-2 bg-[#0C0D0F] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-display font-bold text-white text-sm">Einnahmen vs. Ausgaben</h3>
              <div className="flex items-center rounded-lg overflow-hidden" style={{ background: '#141518', border: '1px solid rgba(255,255,255,0.06)' }}>
                {(['monthly', 'quarterly'] as const).map(v => (
                  <button key={v} onClick={() => setViewMode(v)}
                    className={`h-7 px-3 text-[10px] font-medium transition-all ${viewMode === v ? 'text-[#FF8C5A] bg-[#FF8C5A]/10' : 'text-[#5E626A] hover:text-[#A1A4AA]'}`}>
                    {v === 'monthly' ? 'Monatlich' : 'Quartal'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#FF8C5A' }} />
                <span className="text-[#A1A4AA]">Umsatz</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#EF4444' }} />
                <span className="text-[#A1A4AA]">Ausgaben</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#36CFC9' }} />
                <span className="text-[#A1A4AA]">Gewinn</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#5E626A', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5E626A', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Umsatz" fill="#FF8C5A" radius={[4, 4, 0, 0]} barSize={viewMode === 'monthly' ? 24 : 40} />
              <Bar dataKey="expenses" name="Ausgaben" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={viewMode === 'monthly' ? 24 : 40} />
              <Line type="monotone" dataKey="profit" name="Gewinn" stroke="#36CFC9" strokeWidth={2.5} dot={{ fill: '#36CFC9', r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Donut Chart */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl p-5">
          <h3 className="font-display font-bold text-white text-sm mb-4">Ausgaben nach Kategorie</h3>
          {expenseCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[220px]">
              <Receipt size={32} className="text-[#5E626A] mb-2" />
              <p className="text-xs text-[#5E626A]">Noch keine Ausgabendaten</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                    {expenseCategories.map((entry, index) => (
                      <Cell key={index} fill={entry.color} opacity={selectedCategory === null || selectedCategory === entry.name ? 1 : 0.3} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {expenseCategories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(prev => prev === cat.name ? null : cat.name)}
                    className="w-full flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-[#141518] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                      <span className={`transition-opacity ${selectedCategory && selectedCategory !== cat.name ? 'text-[#5E626A]' : 'text-[#A1A4AA]'}`}>{cat.name}</span>
                    </span>
                    <span className="text-white font-mono">{cat.value.toLocaleString('de-DE')} &euro;</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Monthly/Quarterly Table ── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl overflow-hidden mb-8"
      >
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-display font-bold text-white text-sm">{viewMode === 'monthly' ? 'Monatliche' : 'Quartals'} Uebersicht</h3>
          <span className="text-xs text-[#5E626A]">2026</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#141518]">
                {['Periode', 'Umsatz', 'Ausgaben', 'Gewinn', 'Marge'].map(h => (
                  <th key={h} className="text-left h-10 px-4 text-[11px] font-medium text-[#5E626A] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={row.month} className="h-[52px] border-b border-white/[0.04] hover:bg-[#141518] transition-colors" style={{ background: i % 2 === 0 ? '#0C0D0F' : '#000000' }}>
                  <td className="px-4 text-sm text-white font-medium">{row.month}</td>
                  <td className="px-4 text-sm font-mono" style={{ color: '#FF8C5A' }}>{row.revenue.toLocaleString('de-DE')} &euro;</td>
                  <td className="px-4 text-sm font-mono" style={{ color: '#EF4444' }}>{row.expenses.toLocaleString('de-DE')} &euro;</td>
                  <td className="px-4 text-sm font-mono text-white">{row.profit.toLocaleString('de-DE')} &euro;</td>
                  <td className="px-4">
                    <span className="text-sm font-mono" style={{ color: row.margin >= 55 ? '#36CFC9' : row.margin >= 50 ? '#F5C542' : '#A1A4AA' }}>{row.margin.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="h-12" style={{ background: '#141518' }}>
                <td className="px-4 text-sm font-display font-bold text-white">Gesamt</td>
                <td className="px-4 text-sm font-mono font-bold" style={{ color: '#FF8C5A' }}>{totals.revenue.toLocaleString('de-DE')} &euro;</td>
                <td className="px-4 text-sm font-mono font-bold" style={{ color: '#EF4444' }}>{totals.expenses.toLocaleString('de-DE')} &euro;</td>
                <td className="px-4 text-sm font-mono font-bold text-white">{totals.profit.toLocaleString('de-DE')} &euro;</td>
                <td className="px-4 text-sm font-mono font-bold" style={{ color: '#36CFC9' }}>{totals.margin.toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* ── Recent Transactions ── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-display font-bold text-white text-sm">Letzte Transaktionen</h3>
          <span className="text-xs text-[#5E626A]">{recentTransactions.length} Eintraege</span>
        </div>
        {recentTransactions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <Receipt size={32} className="text-[#5E626A] mb-2" />
            <p className="text-xs text-[#5E626A]">Noch keine Transaktionen</p>
          </motion.div>
        )}
        <div className="divide-y divide-white/[0.04]">
          {recentTransactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-[#141518] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {tx.type === 'income' ? <ArrowUpRight size={14} className="text-green-400" /> : <ArrowDownRight size={14} className="text-red-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{tx.description}</p>
                  <p className="text-[10px] text-[#5E626A]">{tx.category} &middot; {new Date(tx.date).toLocaleDateString('de-DE')}</p>
                </div>
              </div>
              <span className={`text-sm font-mono font-medium shrink-0 ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'income' ? '+' : ''}{tx.amount.toLocaleString('de-DE')} &euro;
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
