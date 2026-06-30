import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Layers, Users, Calendar, ArrowUpRight, ChevronRight,
  UserPlus, FolderPlus, FilePlus,
} from 'lucide-react';

/* ───────── mock data ───────── */

const revenueData = [
  { month: 'Jan', einnahmen: 0, ausgaben: 0 },
  { month: 'Feb', einnahmen: 0, ausgaben: 0 },
  { month: 'Mar', einnahmen: 0, ausgaben: 0 },
  { month: 'Apr', einnahmen: 0, ausgaben: 0 },
  { month: 'Mai', einnahmen: 0, ausgaben: 0 },
  { month: 'Jun', einnahmen: 0, ausgaben: 0 },
  { month: 'Jul', einnahmen: 0, ausgaben: 0 },
  { month: 'Aug', einnahmen: 0, ausgaben: 0 },
  { month: 'Sep', einnahmen: 0, ausgaben: 0 },
  { month: 'Okt', einnahmen: 0, ausgaben: 0 },
  { month: 'Nov', einnahmen: 0, ausgaben: 0 },
  { month: 'Dez', einnahmen: 0, ausgaben: 0 },
];

const appointments: { time: string; title: string; type: string }[] = [];

const projects: { name: string; client: string; progress: number; status: string; statusColor: string; statusBg: string; deadline: string }[] = [];

const customers: { name: string; type: string; typeColor: string; typeBg: string; timeAgo: string }[] = [];

/* ───────── animation variants ───────── */

const cardContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

const sectionItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const listItem = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.06, duration: 0.3 },
  }),
};

const rowItem = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.07, duration: 0.3 },
  }),
};

const customerItem = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.06, duration: 0.3 },
  }),
};

const buttonItem = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: 0.8 + i * 0.1, duration: 0.3 },
  }),
};

/* ───────── custom tooltip ───────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{ background: 'rgba(12,13,15,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className="text-text-secondary mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-mono">
          {entry.name === 'einnahmen' ? 'Einnahmen' : 'Ausgaben'}: €{entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ───────── KPI card component ───────── */

function KPICard({ icon: Icon, iconColor, iconBg, value, label, change, changeColor, children }: any) {
  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.12)' }}
      className="rounded-xl p-5 border transition-colors duration-200 cursor-default"
      style={{ background: '#0C0D0F', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${iconBg}`}>
            <Icon size={20} className={iconColor} />
          </div>
          <div>
            <p className="font-mono text-[32px] font-medium text-white leading-tight tracking-tight">
              {value}
            </p>
            <p className="text-xs text-text-secondary mt-0.5 tracking-wide">{label}</p>
          </div>
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-medium ${changeColor}`}>
          <ArrowUpRight size={14} />
          <span>{change}</span>
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </motion.div>
  );
}

/* ───────── main dashboard ───────── */

export default function Dashboard() {
  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-[28px] text-white leading-tight tracking-tight">
              Dashboard
            </h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-text-secondary mt-1"
            >
              Übersicht deines Business
            </motion.p>
          </div>
          <p className="text-sm text-text-secondary">Willkommen zurück, Max</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={cardContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        <KPICard
          icon={TrendingUp}
          iconColor="text-accent-orange"
          iconBg="bg-accent-orange/[0.12]"
          value="0 €"
          label="Gesamtumsatz 2026"
          change="0%"
          changeColor="text-text-muted"
        >
          {/* Mini sparkline */}
          <div className="h-[30px] w-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData.slice(-3)}>
                <defs>
                  <linearGradient id="miniSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8C5A" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FF8C5A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="einnahmen" stroke="#FF8C5A" strokeWidth={2} fill="url(#miniSpark)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </KPICard>

        <KPICard
          icon={Layers}
          iconColor="text-accent-purple"
          iconBg="bg-accent-purple/[0.12]"
          value="0"
          label="Aktive Projekte"
          change="0"
          changeColor="text-text-muted"
        >
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-bg-quaternary"
              />
            ))}
          </div>
        </KPICard>

        <KPICard
          icon={Users}
          iconColor="text-status-teal"
          iconBg="bg-status-teal/[0.12]"
          value="0"
          label="Gesamtkunden"
          change="0"
          changeColor="text-text-muted"
        >
          <div className="flex -space-x-2 mt-2">
            <div className="h-6 w-6 rounded-full bg-bg-quaternary border border-black flex items-center justify-center text-[10px] text-text-secondary font-medium">
              -
            </div>
          </div>
        </KPICard>

        <KPICard
          icon={Calendar}
          iconColor="text-accent-orange"
          iconBg="bg-accent-orange/[0.12]"
          value="0"
          label="Diese Woche"
          change="0"
          changeColor="text-text-muted"
        >
          <p className="text-[11px] text-text-muted mt-1">Keine Termine</p>
        </KPICard>
      </motion.div>

      {/* Row: Chart + Appointments */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Revenue Chart */}
        <motion.div
          variants={sectionItem}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="xl:col-span-2 rounded-xl p-6 border"
          style={{ background: '#0C0D0F', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-white">Umsatzentwicklung</h3>
            <select className="bg-bg-quaternary text-text-secondary text-xs rounded-lg px-3 py-1.5 border border-white/[0.06] outline-none cursor-pointer">
              <option>Letztes Jahr</option>
              <option>Letzter Monat</option>
              <option>Letztes Quartal</option>
              <option>Alles</option>
            </select>
          </div>
          {revenueData.every(d => d.einnahmen === 0 && d.ausgaben === 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[200px]"
            >
              <TrendingUp size={32} className="text-[#5E626A] mb-2" />
              <p className="text-xs text-[#5E626A]">Noch keine Umsatzdaten</p>
            </motion.div>
          )}
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradEinnahmen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8C5A" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF8C5A" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradAusgaben" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#5E626A' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#5E626A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `€${v / 1000}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="einnahmen"
                  name="einnahmen"
                  stroke="#FF8C5A"
                  strokeWidth={2}
                  fill="url(#gradEinnahmen)"
                  animationDuration={800}
                />
                <Area
                  type="monotone"
                  dataKey="ausgaben"
                  name="ausgaben"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#gradAusgaben)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Appointments */}
        <motion.div
          variants={sectionItem}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="rounded-xl p-6 border"
          style={{ background: '#0C0D0F', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-white">Nächste Termine</h3>
            <a href="/kalender" className="text-xs text-accent-purple hover:underline">Alle anzeigen &rarr;</a>
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-0"
          >
            {appointments.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10"
              >
                <Calendar size={24} className="text-[#5E626A] mb-2" />
                <p className="text-xs text-[#5E626A]">Keine Termine</p>
              </motion.div>
            )}
            {appointments.map((apt, i) => (
              <motion.div
                key={i}
                variants={listItem}
                custom={i}
                className="flex items-start gap-3 py-3 border-b last:border-b-0"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <span className="text-xs font-mono text-accent-orange whitespace-nowrap min-w-[52px]">
                  {apt.time}
                </span>
                <div className="w-px h-5 bg-white/[0.06] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[13px] text-white truncate font-medium">{apt.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{apt.type}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Row: Projects + Customers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* Active Projects */}
        <motion.div
          variants={sectionItem}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          className="rounded-xl p-6 border"
          style={{ background: '#0C0D0F', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-white">Aktive Projekte</h3>
            <div className="flex gap-1.5">
              {['Alle', 'In Bearbeitung', 'Review', 'Live'].map((filter) => (
                <button
                  key={filter}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-bg-quaternary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <motion.div initial="hidden" animate="visible" className="space-y-1">
            {projects.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10"
              >
                <Layers size={24} className="text-[#5E626A] mb-2" />
                <p className="text-xs text-[#5E626A]">Noch keine Projekte</p>
              </motion.div>
            )}
            {projects.map((project, i) => (
              <motion.div
                key={i}
                variants={rowItem}
                custom={i}
                whileHover={{ backgroundColor: 'rgba(20, 21, 24, 0.8)' }}
                className="flex items-center gap-3 py-3 px-3 rounded-lg transition-colors cursor-pointer"
              >
                {/* Thumbnail placeholder */}
                <div
                  className="h-9 w-12 rounded-md shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1B1D20, #2A2D32)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{project.name}</p>
                  <p className="text-xs text-text-secondary">{project.client}</p>
                </div>
                {/* Progress bar */}
                <div className="w-[120px] hidden sm:block">
                  <div className="h-1.5 rounded-full bg-bg-quaternary overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${project.progress}%`,
                        background: 'linear-gradient(135deg, #FF8C5A 0%, #FFB347 40%, #B98BFF 100%)',
                      }}
                    />
                  </div>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full ${project.statusBg} ${project.statusColor} font-medium whitespace-nowrap`}>
                  {project.status}
                </span>
                <span className="text-xs font-mono text-text-muted whitespace-nowrap">{project.deadline}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Recent Customers */}
        <motion.div
          variants={sectionItem}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.7 }}
          className="rounded-xl p-6 border"
          style={{ background: '#0C0D0F', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-white">Neueste Kunden</h3>
            <a href="/kunden" className="text-xs text-accent-purple hover:underline">Alle Kunden &rarr;</a>
          </div>
          <motion.div initial="hidden" animate="visible" className="space-y-1">
            {customers.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10"
              >
                <Users size={24} className="text-[#5E626A] mb-2" />
                <p className="text-xs text-[#5E626A]">Noch keine Kunden</p>
              </motion.div>
            )}
            {customers.map((customer, i) => (
              <motion.div
                key={i}
                variants={customerItem}
                custom={i}
                whileHover={{ x: 4, backgroundColor: 'rgba(20, 21, 24, 0.8)' }}
                className="flex items-center gap-3 py-3 px-3 rounded-lg transition-all cursor-pointer"
              >
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FF8C5A, #B98BFF)' }}
                >
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{customer.name}</p>
                  <p className="text-xs text-text-muted">{customer.timeAgo}</p>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full ${customer.typeBg} ${customer.typeColor} font-medium whitespace-nowrap`}>
                  {customer.type}
                </span>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-3"
      >
        <motion.button
          variants={buttonItem}
          custom={0}
          whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #FF8C5A 0%, #FFB347 40%, #B98BFF 100%)' }}
        >
          <UserPlus size={16} />
          Neuer Kunde
        </motion.button>
        <motion.button
          variants={buttonItem}
          custom={1}
          whileHover={{ backgroundColor: '#1B1D20', borderColor: 'rgba(255,255,255,0.12)' }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white border transition-all"
          style={{ background: '#0C0D0F', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <FolderPlus size={16} />
          Neues Projekt
        </motion.button>
        <motion.button
          variants={buttonItem}
          custom={2}
          whileHover={{ backgroundColor: '#1B1D20', borderColor: 'rgba(255,255,255,0.12)' }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white border transition-all"
          style={{ background: '#0C0D0F', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <FilePlus size={16} />
          Rechnung erstellen
        </motion.button>
      </motion.div>
    </div>
  );
}
