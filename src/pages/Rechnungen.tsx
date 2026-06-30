import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, FileText, ChevronLeft, ChevronRight, ArrowUpDown,
  Send, CheckCircle2, AlertTriangle, Clock, Ban,
  Eye,
} from 'lucide-react';

/* ═════════ TYPES ═════════ */

interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  total: number;
  lines: InvoiceLine[];
  notes?: string;
}

/* ═════════ MOCK DATA ═════════ */

const mockInvoices: Invoice[] = [];

/* ═════════ STATUS CONFIG ═════════ */

const statusFilters = [
  { key: 'all', label: 'Alle' },
  { key: 'draft', label: 'Entwurf' },
  { key: 'sent', label: 'Gesendet' },
  { key: 'paid', label: 'Bezahlt' },
  { key: 'overdue', label: 'Ueberfaellig' },
  { key: 'cancelled', label: 'Storniert' },
] as const;

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof CheckCircle2 }> = {
  draft: { color: '#5E626A', bg: 'rgba(94,98,106,0.12)', label: 'Entwurf', icon: FileText },
  sent: { color: '#F5C542', bg: 'rgba(245,197,66,0.12)', label: 'Gesendet', icon: Send },
  paid: { color: '#36CFC9', bg: 'rgba(54,207,201,0.12)', label: 'Bezahlt', icon: CheckCircle2 },
  overdue: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Ueberfaellig', icon: AlertTriangle },
  cancelled: { color: '#5E626A', bg: 'rgba(94,98,106,0.08)', label: 'Storniert', icon: Ban },
};

/* ═════════ ANIMATION ═════════ */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ═════════ MAIN COMPONENT ═════════ */

export default function Rechnungen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('issue_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

  const [formData, setFormData] = useState<Partial<Invoice>>({
    customer: '', issue_date: '', due_date: '', status: 'draft', total: 0, notes: '',
  });
  const [formLines, setFormLines] = useState<InvoiceLine[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const perPage = 5;

  const summary = useMemo(() => {
    const total = invoices.reduce((s, inv) => s + inv.total, 0);
    const paid = invoices.filter(i => i.status === 'paid').reduce((s, inv) => s + inv.total, 0);
    const openAmt = invoices.filter(i => i.status === 'sent' || i.status === 'draft').reduce((s, inv) => s + inv.total, 0);
    const overdueAmt = invoices.filter(i => i.status === 'overdue').reduce((s, inv) => s + inv.total, 0);
    return { total, paid, openAmt, overdueAmt };
  }, [invoices]);

  const filtered = useMemo(() => {
    let data = invoices.filter(inv => {
      const matchesSearch =
        !search ||
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    data = [...data].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'total') return (a.total - b.total) * dir;
      if (sortField === 'issue_date') return a.issue_date.localeCompare(b.issue_date) * dir;
      if (sortField === 'customer') return a.customer.localeCompare(b.customer) * dir;
      return 0;
    });
    return data;
  }, [invoices, search, statusFilter, sortField, sortDir]);

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function addLine() {
    setFormLines(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  }

  function updateLine(index: number, field: keyof InvoiceLine, value: string | number) {
    setFormLines(prev => prev.map((line, i) => {
      if (i !== index) return line;
      const updated = { ...line, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice;
      }
      return updated;
    }));
  }

  function removeLine(index: number) {
    setFormLines(prev => prev.filter((_, i) => i !== index));
  }

  function saveInvoice() {
    if (!formData.customer || !formData.issue_date) return;
    const total = formLines.reduce((s, l) => s + l.total, 0);
    const newInvoice: Invoice = {
      id: String(Date.now()),
      invoice_number: `R-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      customer: formData.customer || '',
      issue_date: formData.issue_date || new Date().toISOString().slice(0, 10),
      due_date: formData.due_date || new Date().toISOString().slice(0, 10),
      status: formData.status as Invoice['status'] || 'draft',
      total,
      lines: formLines.filter(l => l.description),
      notes: formData.notes,
    };
    setInvoices(prev => [newInvoice, ...prev]);
    setShowAdd(false);
    setFormLines([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  }

  return (
    <div>
      {/* ── Summary Cards ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          { title: 'Gesamtbetrag', value: `${summary.total.toLocaleString('de-DE')} \u20AC`, icon: FileText, color: '#FF8C5A' },
          { title: 'Bezahlt', value: `${summary.paid.toLocaleString('de-DE')} \u20AC`, icon: CheckCircle2, color: '#36CFC9' },
          { title: 'Offen', value: `${summary.openAmt.toLocaleString('de-DE')} \u20AC`, icon: Clock, color: '#F5C542' },
          { title: 'Ueberfaellig', value: `${summary.overdueAmt.toLocaleString('de-DE')} \u20AC`, icon: AlertTriangle, color: '#EF4444' },
        ].map(card => (
          <motion.div
            key={card.title}
            variants={itemVariants}
            whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.12)' }}
            className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl p-5 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}1F` }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <span className="text-xs text-[#A1A4AA]">{card.title}</span>
            </div>
            <p className="text-[24px] font-mono font-medium text-white">{card.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center h-10 rounded-xl px-3 gap-2 w-full sm:w-72"
            style={{ background: 'rgba(27,29,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Search size={16} className="text-[#5E626A] shrink-0" />
            <input
              type="text" placeholder="Rechnungen suchen..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="bg-transparent text-sm text-white placeholder-[#5E626A] outline-none w-full"
            />
            {search && <button onClick={() => setSearch('')}><X size={14} className="text-[#5E626A]" /></button>}
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-medium shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
        >
          <Plus size={16} /> Rechnung erstellen
        </button>
      </div>

      {/* ── Status Filters ── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statusFilters.map(s => (
          <button
            key={s.key}
            onClick={() => { setStatusFilter(s.key); setPage(0); }}
            className={`h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
              statusFilter === s.key ? 'text-[#FF8C5A]' : 'text-[#A1A4AA] hover:text-white'
            }`}
            style={statusFilter === s.key ? { background: 'rgba(255,140,90,0.12)' } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="h-16 w-16 rounded-full bg-[#141518] flex items-center justify-center mb-4">
            <FileText size={32} className="text-[#5E626A]" />
          </div>
          <p className="text-white font-display font-bold text-lg mb-1">Noch keine Rechnungen</p>
          <p className="text-[#A1A4AA] text-sm mb-6">Erstelle deine erste Rechnung</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
          >
            <Plus size={16} /> Rechnung erstellen
          </button>
        </motion.div>
      )}

      {/* ── Table ── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#141518]">
                {[
                  { key: 'invoice_number', label: 'Rechnung #' },
                  { key: 'customer', label: 'Kunde' },
                  { key: 'issue_date', label: 'Datum' },
                  { key: 'due_date', label: 'Faellig' },
                  { key: 'total', label: 'Betrag' },
                  { key: 'status', label: 'Status' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-left h-10 px-4 text-[11px] font-medium text-[#5E626A] uppercase tracking-wider cursor-pointer hover:text-[#A1A4AA] transition-colors select-none"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown size={10} className={sortField === col.key ? 'text-[#FF8C5A]' : ''} />
                    </span>
                  </th>
                ))}
                <th className="h-10 px-4 text-[11px] font-medium text-[#5E626A] uppercase tracking-wider text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginated.map((inv, i) => {
                  const cfg = statusConfig[inv.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="h-[52px] border-b border-white/[0.04] hover:bg-[#141518] transition-colors cursor-pointer"
                      style={{ background: i % 2 === 0 ? '#0C0D0F' : '#000000' }}
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="px-4 text-sm font-mono text-white">{inv.invoice_number}</td>
                      <td className="px-4 text-sm text-white">{inv.customer}</td>
                      <td className="px-4 text-xs text-[#A1A4AA]">{new Date(inv.issue_date).toLocaleDateString('de-DE')}</td>
                      <td className="px-4 text-xs text-[#A1A4AA]">{new Date(inv.due_date).toLocaleDateString('de-DE')}</td>
                      <td className="px-4 text-sm font-mono text-white">{inv.total.toLocaleString('de-DE')} &euro;</td>
                      <td className="px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                          <StatusIcon size={10} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedInvoice(inv); }}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-[#141518] transition-colors"
                        >
                          <Eye size={14} className="text-[#A1A4AA]" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <span className="text-xs text-[#5E626A]">Seite {page + 1} von {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#141518] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} className="text-[#A1A4AA]" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#141518] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} className="text-[#A1A4AA]" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedInvoice(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[600px] rounded-2xl overflow-hidden"
              style={{ background: '#0C0D0F', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,140,90,0.12)' }}>
                      <FileText size={22} className="text-[#FF8C5A]" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-white text-lg">{selectedInvoice.invoice_number}</h2>
                      <p className="text-xs text-[#A1A4AA]">{selectedInvoice.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: statusConfig[selectedInvoice.status].bg, color: statusConfig[selectedInvoice.status].color }}>
                      {(() => { const I = statusConfig[selectedInvoice.status].icon; return <I size={12} />; })()}
                      {statusConfig[selectedInvoice.status].label}
                    </span>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#141518] transition-colors"
                    >
                      <X size={16} className="text-[#A1A4AA]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-[#141518]">
                    <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Ausstellungsdatum</p>
                    <p className="text-sm text-white mt-1">{new Date(selectedInvoice.issue_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141518]">
                    <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Faellig am</p>
                    <p className="text-sm text-white mt-1">{new Date(selectedInvoice.due_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141518]">
                    <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Gesamtbetrag</p>
                    <p className="text-sm font-mono font-bold text-[#FF8C5A] mt-1">{selectedInvoice.total.toLocaleString('de-DE')} &euro;</p>
                  </div>
                </div>

                {/* Lines */}
                <p className="text-[10px] text-[#5E626A] uppercase tracking-wider mb-3">Rechnungspositionen</p>
                <div className="rounded-xl bg-[#141518] overflow-hidden mb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-4 py-2 text-[10px] font-medium text-[#5E626A] uppercase tracking-wider">Beschreibung</th>
                        <th className="text-right px-4 py-2 text-[10px] font-medium text-[#5E626A] uppercase tracking-wider">Menge</th>
                        <th className="text-right px-4 py-2 text-[10px] font-medium text-[#5E626A] uppercase tracking-wider">Einzelpreis</th>
                        <th className="text-right px-4 py-2 text-[10px] font-medium text-[#5E626A] uppercase tracking-wider">Gesamt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.lines.map((line, i) => (
                        <tr key={i} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-4 py-2.5 text-xs text-white">{line.description}</td>
                          <td className="px-4 py-2.5 text-xs text-[#A1A4AA] text-right">{line.quantity}</td>
                          <td className="px-4 py-2.5 text-xs text-[#A1A4AA] text-right">{line.unitPrice.toFixed(2)} &euro;</td>
                          <td className="px-4 py-2.5 text-xs font-mono text-white text-right">{line.total.toFixed(2)} &euro;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#141518]">
                  <span className="text-sm text-[#A1A4AA]">Gesamtsumme</span>
                  <span className="text-lg font-mono font-bold text-white">{selectedInvoice.total.toLocaleString('de-DE')} &euro;</span>
                </div>

                {selectedInvoice.notes && (
                  <div className="mt-4 p-3 rounded-xl bg-[#141518]">
                    <p className="text-[10px] text-[#5E626A] uppercase tracking-wider mb-1">Notizen</p>
                    <p className="text-xs text-[#A1A4AA]">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[600px] rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
              style={{ background: '#0C0D0F', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="text-lg font-display font-bold text-white mb-5">Rechnung erstellen</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Kunde *</label>
                  <input
                    value={formData.customer || ''} onChange={e => setFormData(p => ({ ...p, customer: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Ausstellungsdatum</label>
                    <input
                      type="date"
                      value={formData.issue_date || ''} onChange={e => setFormData(p => ({ ...p, issue_date: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Faellig am</label>
                    <input
                      type="date"
                      value={formData.due_date || ''} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-[#A1A4AA]">Positionen</label>
                    <button onClick={addLine} className="text-xs text-[#FF8C5A] hover:text-[#FFB347] transition-colors flex items-center gap-1">
                      <Plus size={12} /> Position hinzufuegen
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formLines.map((line, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <input
                            placeholder="Beschreibung"
                            value={line.description}
                            onChange={e => updateLine(i, 'description', e.target.value)}
                            className="w-full h-9 rounded-lg px-2 text-xs text-white outline-none"
                            style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Menge"
                            value={line.quantity || ''}
                            onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                            className="w-full h-9 rounded-lg px-2 text-xs text-white outline-none text-center"
                            style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Preis"
                            value={line.unitPrice || ''}
                            onChange={e => updateLine(i, 'unitPrice', Number(e.target.value))}
                            className="w-full h-9 rounded-lg px-2 text-xs text-white outline-none text-right"
                            style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <span className="text-xs font-mono text-[#A1A4AA]">{line.total.toFixed(0)}</span>
                        </div>
                        <div className="col-span-1">
                          <button onClick={() => removeLine(i)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors">
                            <X size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                    <span className="text-xs text-[#A1A4AA]">Gesamtsumme</span>
                    <span className="text-lg font-mono font-bold text-[#FF8C5A]">
                      {formLines.reduce((s, l) => s + l.total, 0).toLocaleString('de-DE')} &euro;
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Notizen</label>
                  <textarea
                    value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="h-10 px-4 rounded-xl text-sm text-[#A1A4AA] hover:text-white hover:bg-[#141518] transition-colors">Abbrechen</button>
                <button onClick={saveInvoice} className="h-10 px-6 rounded-xl text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}>Erstellen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
