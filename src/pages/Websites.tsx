import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, Globe, ExternalLink, CheckCircle2,
  PauseCircle, Layers, PenTool, Code2, Eye, Trash2,
} from 'lucide-react';
import type { Project } from '@/types';

/* ═════════ MOCK DATA ═════════ */

const mockProjects: (Project & { customer_name: string })[] = [];

/* ═════════ STATUS CONFIG ═════════ */

const statusFilters = [
  { key: 'all', label: 'Alle' },
  { key: 'planning', label: 'Planung' },
  { key: 'design', label: 'Design' },
  { key: 'development', label: 'Entwicklung' },
  { key: 'review', label: 'Review' },
  { key: 'live', label: 'Live' },
  { key: 'paused', label: 'Pausiert' },
] as const;

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof CheckCircle2 }> = {
  planning: { color: '#B98BFF', bg: 'rgba(185,139,255,0.12)', label: 'Planung', icon: Layers },
  design: { color: '#F5C542', bg: 'rgba(245,197,66,0.12)', label: 'Design', icon: PenTool },
  development: { color: '#FF8C5A', bg: 'rgba(255,140,90,0.12)', label: 'Entwicklung', icon: Code2 },
  review: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Review', icon: Eye },
  live: { color: '#36CFC9', bg: 'rgba(54,207,201,0.12)', label: 'Live', icon: CheckCircle2 },
  paused: { color: '#5E626A', bg: 'rgba(94,98,106,0.12)', label: 'Pausiert', icon: PauseCircle },
};

const typeLabels: Record<string, string> = {
  website: 'Website', webapp: 'Web App', ecommerce: 'Shop', redesign: 'Redesign',
  maintenance: 'Wartung', seo: 'SEO', branding: 'Branding', other: 'Sonstige', landingpage: 'Landingpage',
};

/* ═════════ GRADIENT PREVIEWS ═════════ */

const previewGradients = [
  'linear-gradient(135deg, #FF8C5A 0%, #FFB347 50%, #B98BFF 100%)',
  'linear-gradient(135deg, #36CFC9 0%, #20B2AA 50%, #3B82F6 100%)',
  'linear-gradient(135deg, #B98BFF 0%, #7B68EE 50%, #FF8C5A 100%)',
  'linear-gradient(135deg, #F5C542 0%, #FF8C5A 50%, #EF4444 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #36CFC9 50%, #B98BFF 100%)',
  'linear-gradient(135deg, #EF4444 0%, #FF6B6B 50%, #FFB347 100%)',
  'linear-gradient(135deg, #20B2AA 0%, #36CFC9 50%, #3B82F6 100%)',
  'linear-gradient(135deg, #7B68EE 0%, #B98BFF 50%, #FF8C5A 100%)',
];

/* ═════════ ANIMATION ═════════ */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ═════════ MAIN COMPONENT ═════════ */

export default function Websites() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<typeof mockProjects[0] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [projects, setProjects] = useState(mockProjects);
  const [detailTab, setDetailTab] = useState<'overview' | 'details' | 'notes'>('overview');

  const [formData, setFormData] = useState({
    name: '', customer_name: '', project_type: 'website' as Project['project_type'],
    status: 'planning' as Project['status'], priority: 'medium' as Project['priority'],
    domain: '', description: '',
  });

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (p.domain && p.domain.includes(search));
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  function openAdd() {
    setFormData({ name: '', customer_name: '', project_type: 'website', status: 'planning', priority: 'medium', domain: '', description: '' });
    setShowAdd(true);
  }

  function saveProject() {
    if (!formData.name) return;
    const newProject: typeof mockProjects[0] = {
      ...formData,
      id: String(Date.now()),
      user_id: 'u1',
      created_at: new Date().toISOString().slice(0, 10),
      start_date: new Date().toISOString().slice(0, 10),
    };
    setProjects(prev => [newProject, ...prev]);
    setShowAdd(false);
  }

  function deleteProject(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id));
    setSelectedProject(null);
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
              type="text" placeholder="Projekte suchen..."
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
          <Plus size={16} /> Neues Projekt
        </button>
      </div>

      {/* ── Status Filters ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {statusFilters.map(s => {
          const Icon = s.key === 'all' ? Layers : (statusConfig[s.key]?.icon || Layers);
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                statusFilter === s.key ? 'text-[#FF8C5A]' : 'text-[#A1A4AA] hover:text-white'
              }`}
              style={statusFilter === s.key ? { background: 'rgba(255,140,90,0.12)' } : {}}
            >
              <Icon size={13} /> {s.label}
            </button>
          );
        })}
      </div>

      {/* ── Results count ── */}
      <p className="text-xs text-[#5E626A] mb-4">{filtered.length} Projekte</p>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="h-16 w-16 rounded-full bg-bg-quaternary flex items-center justify-center mb-4">
            <Globe size={32} className="text-[#5E626A]" />
          </div>
          <p className="text-white font-display font-bold text-lg mb-1">Noch keine Website-Projekte</p>
          <p className="text-text-secondary text-sm mb-6">Erstelle dein erstes Projekt</p>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
          >
            <Plus size={16} /> Neues Projekt
          </button>
        </motion.div>
      )}

      {/* ── Project Grid ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence>
          {filtered.map(project => {
            const cfg = statusConfig[project.status] || statusConfig.planning;
            const TypeIcon = cfg.icon;
            return (
              <motion.div
                key={project.id}
                variants={cardVariants}
                layout
                whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.12)' }}
                onClick={() => setSelectedProject(project)}
                className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group"
              >
                {/* 16:9 Preview */}
                <div
                  className="aspect-video relative flex items-center justify-center"
                  style={{ background: previewGradients[parseInt(project.id) % previewGradients.length] }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <Globe size={36} className="text-white/40" />
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <TypeIcon size={10} /> {cfg.label}
                    </span>
                  </div>
                  {project.domain && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/70 text-[10px]">
                      <Globe size={10} /> {project.domain}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="text-white font-display font-bold text-sm mb-1 group-hover:text-[#FF8C5A] transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#A1A4AA]">{project.customer_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#141518] text-[#A1A4AA]">
                      {typeLabels[project.project_type] || project.project_type}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedProject(null)}
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
              <div
                className="aspect-video relative flex items-center justify-center"
                style={{ background: previewGradients[parseInt(selectedProject.id) % previewGradients.length] }}
              >
                <div className="absolute inset-0 bg-black/30" />
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
                <div className="relative z-10 text-center">
                  <Globe size={48} className="text-white/50 mx-auto mb-2" />
                  <h2 className="text-2xl font-display font-bold text-white">{selectedProject.name}</h2>
                  <p className="text-sm text-white/70">{selectedProject.customer_name}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-6 mt-4 border-b border-white/[0.06]">
                {(['overview', 'details', 'notes'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`h-9 px-4 text-xs font-medium border-b-2 transition-all duration-200 capitalize ${
                      detailTab === tab
                        ? 'text-[#FF8C5A] border-[#FF8C5A]'
                        : 'text-[#A1A4AA] border-transparent hover:text-white'
                    }`}
                  >
                    {tab === 'overview' ? 'Uebersicht' : tab === 'details' ? 'Details' : 'Notizen'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {detailTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[#141518]">
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Status</p>
                        <span className="flex items-center gap-1.5 text-sm font-medium mt-1" style={{ color: statusConfig[selectedProject.status]?.color }}>
                          {(() => { const I = statusConfig[selectedProject.status]?.icon || Layers; return <I size={14} />; })()}
                          {statusConfig[selectedProject.status]?.label}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141518]">
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Typ</p>
                        <p className="text-sm text-white mt-1">{typeLabels[selectedProject.project_type] || selectedProject.project_type}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141518]">
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Prioritaet</p>
                        <p className="text-sm mt-1" style={{ color: selectedProject.priority === 'urgent' ? '#EF4444' : selectedProject.priority === 'high' ? '#FF8C5A' : '#A1A4AA' }}>
                          {selectedProject.priority === 'urgent' ? 'Dringend' : selectedProject.priority === 'high' ? 'Hoch' : selectedProject.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141518]">
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Domain</p>
                        <p className="text-sm text-white mt-1 flex items-center gap-1">
                          <Globe size={12} /> {selectedProject.domain || '-'}
                        </p>
                      </div>
                    </div>
                    {selectedProject.description && (
                      <div className="p-4 rounded-xl bg-[#141518]">
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider mb-2">Beschreibung</p>
                        <p className="text-sm text-[#A1A4AA] leading-relaxed">{selectedProject.description}</p>
                      </div>
                    )}
                  </div>
                )}
                {detailTab === 'details' && (
                  <div className="space-y-3">
                    {[
                      { label: 'Projektname', value: selectedProject.name },
                      { label: 'Kunde', value: selectedProject.customer_name },
                      { label: 'Projekttyp', value: typeLabels[selectedProject.project_type] || selectedProject.project_type },
                      { label: 'Status', value: statusConfig[selectedProject.status]?.label },
                      { label: 'Prioritaet', value: selectedProject.priority },
                      { label: 'Domain', value: selectedProject.domain || '-' },
                      { label: 'Startdatum', value: selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString('de-DE') : '-' },
                      { label: 'Deadline', value: selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString('de-DE') : '-' },
                      { label: 'Erstellt am', value: new Date(selectedProject.created_at).toLocaleDateString('de-DE') },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                        <span className="text-xs text-[#5E626A]">{item.label}</span>
                        <span className="text-sm text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {detailTab === 'notes' && (
                  <div className="p-4 rounded-xl bg-[#141518] min-h-[160px]">
                    <p className="text-sm text-[#A1A4AA]">
                      {selectedProject.description || 'Keine Notizen vorhanden.'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => deleteProject(selectedProject.id)}
                    className="flex items-center gap-2 h-10 px-4 rounded-xl text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} /> Loeschen
                  </button>
                  {selectedProject.domain && (
                    <a
                      href={`https://${selectedProject.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 h-10 px-4 rounded-xl text-[#B98BFF] text-sm font-medium hover:bg-[#B98BFF]/10 transition-colors ml-auto"
                    >
                      <ExternalLink size={14} /> Besuchen
                    </a>
                  )}
                </div>
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
              className="w-full max-w-[520px] rounded-2xl p-6"
              style={{ background: '#0C0D0F', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="text-lg font-display font-bold text-white mb-5">Neues Projekt</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Projektname *</label>
                  <input
                    value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Kunde *</label>
                  <input
                    value={formData.customer_name} onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Typ</label>
                    <select
                      value={formData.project_type}
                      onChange={e => setFormData(p => ({ ...p, project_type: e.target.value as Project['project_type'] }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value as Project['status'] }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Domain</label>
                  <input
                    value={formData.domain} onChange={e => setFormData(p => ({ ...p, domain: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Beschreibung</label>
                  <textarea
                    value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="h-10 px-4 rounded-xl text-sm text-[#A1A4AA] hover:text-white hover:bg-[#141518] transition-colors">Abbrechen</button>
                <button onClick={saveProject} className="h-10 px-6 rounded-xl text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}>Erstellen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
