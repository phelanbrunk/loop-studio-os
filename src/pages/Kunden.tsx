import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, Mail, Phone, Globe, Building2, MapPin,
  Pencil, Trash2, StickyNote, Filter, Users,
} from 'lucide-react';
import type { Customer } from '@/types';

/* ═════════ MOCK DATA ═════════ */

const mockCustomers: Customer[] = [];

/* ═════════ STATUS CONFIG ═════════ */

const statusFilters = [
  { key: 'all', label: 'Alle' },
  { key: 'active', label: 'Aktiv' },
  { key: 'inactive', label: 'Inaktiv' },
  { key: 'prospect', label: 'Prospect' },
  { key: 'churned', label: 'Abgebrochen' },
] as const;

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: '#36CFC9', bg: 'rgba(54,207,201,0.12)', label: 'Aktiv' },
  inactive: { color: '#5E626A', bg: 'rgba(94,98,106,0.12)', label: 'Inaktiv' },
  prospect: { color: '#FF8C5A', bg: 'rgba(255,140,90,0.12)', label: 'Prospect' },
  churned: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Abgebrochen' },
};

/* ═════════ GRADIENTS for avatars ═════════ */

const avatarGradients = [
  'linear-gradient(135deg, #FF8C5A, #FFB347)',
  'linear-gradient(135deg, #B98BFF, #7B68EE)',
  'linear-gradient(135deg, #36CFC9, #20B2AA)',
  'linear-gradient(135deg, #F5C542, #FF8C5A)',
  'linear-gradient(135deg, #EF4444, #FF6B6B)',
  'linear-gradient(135deg, #3B82F6, #60A5FA)',
];

function getGradient(id: string) {
  return avatarGradients[parseInt(id) % avatarGradients.length];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/* ═════════ ANIMATION ═════════ */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ═════════ STATUS BADGE ═════════ */

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.inactive;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

/* ═════════ MAIN COMPONENT ═════════ */

export default function Kunden() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const [formData, setFormData] = useState<Partial<Customer>>({
    company_name: '', contact_person: '', email: '', phone: '', address: '', website: '', status: 'active', industry: '',
  });

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch =
        !search ||
        c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(search.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: customers.length };
    customers.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [customers]);

  function openAdd() {
    setFormData({ company_name: '', contact_person: '', email: '', phone: '', address: '', website: '', status: 'active', industry: '' });
    setEditCustomer(null);
    setShowAdd(true);
  }

  function openEdit(c: Customer) {
    setFormData({ ...c });
    setEditCustomer(c);
    setShowAdd(true);
    setSelectedCustomer(null);
  }

  function saveCustomer() {
    if (!formData.company_name) return;
    if (editCustomer) {
      setCustomers(prev => prev.map(c => c.id === editCustomer.id ? { ...c, ...formData } as Customer : c));
    } else {
      const newCustomer: Customer = {
        ...formData as Customer,
        id: String(Date.now()),
        created_at: new Date().toISOString().slice(0, 10),
      };
      setCustomers(prev => [newCustomer, ...prev]);
    }
    setShowAdd(false);
  }

  function deleteCustomer(id: string) {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSelectedCustomer(null);
  }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center h-10 rounded-xl px-3 gap-2 w-full sm:w-72"
            style={{ background: 'rgba(27,29,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Search size={16} className="text-[#5E626A] shrink-0" />
            <input
              type="text" placeholder="Kunden suchen..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-[#5E626A] outline-none w-full"
            />
            {search && <button onClick={() => setSearch('')}><X size={14} className="text-[#5E626A]" /></button>}
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-medium shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
        >
          <Plus size={16} /> Kunde hinzufuegen
        </button>
      </div>

      {/* ── Status Filters ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter size={14} className="text-[#5E626A] mr-1" />
        {statusFilters.map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
              statusFilter === s.key
                ? 'text-[#FF8C5A]'
                : 'text-[#A1A4AA] hover:text-white'
            }`}
            style={statusFilter === s.key ? { background: 'rgba(255,140,90,0.12)' } : { background: 'transparent' }}
          >
            {s.label} ({statusCounts[s.key] || 0})
          </button>
        ))}
      </div>

      {/* ── Results count ── */}
      <p className="text-xs text-[#5E626A] mb-4">{filtered.length} Kunden gefunden</p>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="h-16 w-16 rounded-full bg-bg-quaternary flex items-center justify-center mb-4">
            <Users size={32} className="text-[#5E626A]" />
          </div>
          <p className="text-white font-display font-bold text-lg mb-1">Noch keine Kunden vorhanden</p>
          <p className="text-text-secondary text-sm mb-6">Fuege deinen ersten Kunden hinzu</p>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
          >
            <Plus size={16} /> Kunde hinzufuegen
          </button>
        </motion.div>
      )}

      {/* ── Customer Grid ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence>
          {filtered.map(customer => (
            <motion.div
              key={customer.id}
              variants={cardVariants}
              layout
              whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.12)' }}
              onClick={() => setSelectedCustomer(customer)}
              className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl p-5 cursor-pointer transition-all duration-200 group"
              style={{ minHeight: 220 }}
            >
              {/* Avatar + Company */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: getGradient(customer.id) }}
                >
                  {getInitials(customer.contact_person || customer.company_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-display font-bold text-sm truncate group-hover:text-[#FF8C5A] transition-colors">
                    {customer.company_name}
                  </h3>
                  <p className="text-[#A1A4AA] text-xs truncate">{customer.contact_person}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); openEdit(customer); }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[#141518] transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <Pencil size={13} className="text-[#A1A4AA]" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {customer.email && (
                  <div className="flex items-center gap-2 text-xs text-[#A1A4AA]">
                    <Mail size={12} className="text-[#5E626A] shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-xs text-[#A1A4AA]">
                    <Phone size={12} className="text-[#5E626A] shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.industry && (
                  <div className="flex items-center gap-2 text-xs text-[#A1A4AA]">
                    <Building2 size={12} className="text-[#5E626A] shrink-0" />
                    <span>{customer.industry}</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <StatusBadge status={customer.status} />
                <span className="text-[10px] text-[#5E626A]">
                  Seit {new Date(customer.created_at).toLocaleDateString('de-DE')}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[640px] rounded-2xl overflow-hidden"
              style={{ background: '#0C0D0F', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Header */}
              <div className="h-32 relative" style={{ background: getGradient(selectedCustomer.id) }}>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
                <div className="absolute -bottom-10 left-6">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-xl font-bold border-4"
                    style={{ background: getGradient(selectedCustomer.id), borderColor: '#0C0D0F' }}
                  >
                    {getInitials(selectedCustomer.contact_person || selectedCustomer.company_name)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="pt-12 px-6 pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">{selectedCustomer.company_name}</h2>
                    <p className="text-sm text-[#A1A4AA]">{selectedCustomer.contact_person}</p>
                  </div>
                  <StatusBadge status={selectedCustomer.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141518]">
                      <Mail size={16} className="text-[#FF8C5A]" />
                      <div>
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">E-Mail</p>
                        <p className="text-xs text-white">{selectedCustomer.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141518]">
                      <Phone size={16} className="text-[#36CFC9]" />
                      <div>
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Telefon</p>
                        <p className="text-xs text-white">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141518]">
                      <MapPin size={16} className="text-[#B98BFF]" />
                      <div>
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Adresse</p>
                        <p className="text-xs text-white">{selectedCustomer.address}</p>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.website && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141518]">
                      <Globe size={16} className="text-[#FFB347]" />
                      <div>
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Website</p>
                        <p className="text-xs text-white">{selectedCustomer.website}</p>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.industry && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141518]">
                      <Building2 size={16} className="text-[#FF8C5A]" />
                      <div>
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Branche</p>
                        <p className="text-xs text-white">{selectedCustomer.industry}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141518]">
                    <StickyNote size={16} className="text-[#A1A4AA]" />
                    <div>
                      <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Kunde seit</p>
                      <p className="text-xs text-white">{new Date(selectedCustomer.created_at).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div className="p-4 rounded-xl bg-[#141518] mb-6">
                    <p className="text-[10px] text-[#5E626A] uppercase tracking-wider mb-2">Notizen</p>
                    <p className="text-sm text-[#A1A4AA] leading-relaxed">{selectedCustomer.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEdit(selectedCustomer)}
                    className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-medium bg-[#1B1D20] hover:bg-[#141518] transition-colors"
                  >
                    <Pencil size={14} /> Bearbeiten
                  </button>
                  <button
                    onClick={() => deleteCustomer(selectedCustomer.id)}
                    className="flex items-center gap-2 h-10 px-4 rounded-xl text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} /> Loeschen
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add/Edit Modal ── */}
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
              className="w-full max-w-[520px] rounded-2xl p-6"
              style={{ background: '#0C0D0F', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="text-lg font-display font-bold text-white mb-5">
                {editCustomer ? 'Kunde bearbeiten' : 'Neuer Kunde'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Firmenname *</label>
                  <input
                    value={formData.company_name || ''} onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Ansprechpartner</label>
                  <input
                    value={formData.contact_person || ''} onChange={e => setFormData(p => ({ ...p, contact_person: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">E-Mail</label>
                    <input
                      value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Telefon</label>
                    <input
                      value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Adresse</label>
                  <input
                    value={formData.address || ''} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Website</label>
                    <input
                      value={formData.website || ''} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Branche</label>
                    <input
                      value={formData.industry || ''} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value as Customer['status'] }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="prospect">Prospect</option>
                    <option value="churned">Abgebrochen</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Notizen</label>
                  <textarea
                    value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAdd(false)}
                  className="h-10 px-4 rounded-xl text-sm text-[#A1A4AA] hover:text-white hover:bg-[#141518] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveCustomer}
                  className="h-10 px-6 rounded-xl text-white text-sm font-medium"
                  style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
                >
                  {editCustomer ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
