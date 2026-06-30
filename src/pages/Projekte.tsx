import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor,
  PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Search, Plus, X, GripVertical, Calendar, Pencil,
  CheckSquare, StickyNote, Timer,
} from 'lucide-react';

/* ═════════ TYPES ═════════ */

interface KanbanProject {
  id: string;
  name: string;
  customer: string;
  column: 'planned' | 'in_progress' | 'review' | 'live';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  deadline: string;
  tags: string[];
  description?: string;
  tasks: { id: string; text: string; done: boolean }[];
  notes: string;
  timeEntries: { id: string; description: string; minutes: number; date: string }[];
}

/* ═════════ MOCK DATA ═════════ */

const mockProjects: KanbanProject[] = [];

/* ═════════ COLUMN CONFIG ═════════ */

const columns: { key: 'planned' | 'in_progress' | 'review' | 'live'; label: string; color: string; borderColor: string; bgTint: string }[] = [
  { key: 'planned', label: 'Geplant', color: '#B98BFF', borderColor: 'rgba(185,139,255,0.3)', bgTint: 'rgba(185,139,255,0.03)' },
  { key: 'in_progress', label: 'In Bearbeitung', color: '#FF8C5A', borderColor: 'rgba(255,140,90,0.3)', bgTint: 'rgba(255,140,90,0.03)' },
  { key: 'review', label: 'Review', color: '#F5C542', borderColor: 'rgba(245,197,66,0.3)', bgTint: 'rgba(245,197,66,0.03)' },
  { key: 'live', label: 'Live', color: '#36CFC9', borderColor: 'rgba(54,207,201,0.3)', bgTint: 'rgba(54,207,201,0.03)' },
];

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: '!! Dringend', color: '#EF4444' },
  high: { label: '! Hoch', color: '#FF8C5A' },
  medium: { label: 'Mittel', color: '#F5C542' },
  low: { label: 'Niedrig', color: '#5E626A' },
};

/* ═════════ SORTABLE CARD ═════════ */

function SortableCard({ project, onClick }: { project: KanbanProject; onClick: () => void }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const pCfg = priorityConfig[project.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:border-white/[0.12] transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            {...attributes} {...listeners}
            onClick={e => e.stopPropagation()}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#141518] transition-colors shrink-0 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={14} className="text-[#5E626A]" />
          </button>
          <h4 className="text-sm font-medium text-white truncate group-hover:text-[#FF8C5A] transition-colors">
            {project.name}
          </h4>
        </div>
      </div>

      <p className="text-xs text-[#A1A4AA] mb-3 truncate ml-8">{project.customer}</p>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-3 ml-8">
        <div className="flex-1 h-1.5 rounded-full bg-[#141518] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%`, background: project.progress === 100 ? '#36CFC9' : '#FF8C5A' }}
          />
        </div>
        <span className="text-[10px] font-mono text-[#5E626A]">{project.progress}%</span>
      </div>

      {/* Tags + Deadline */}
      <div className="flex items-center justify-between ml-8">
        <div className="flex items-center gap-1.5 flex-wrap">
          {project.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-[#141518] text-[#5E626A]">{tag}</span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium" style={{ color: pCfg.color }}>{pCfg.label}</span>
          <span className="text-[10px] text-[#5E626A] flex items-center gap-0.5">
            <Calendar size={9} /> {new Date(project.deadline).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═════════ DRAG CARD (Overlay) ═════════ */

function DragCard({ project }: { project: KanbanProject }) {
  const pCfg = priorityConfig[project.priority];
  return (
    <div
      className="bg-[#0C0D0F] border border-white/[0.12] rounded-xl p-4 shadow-2xl"
      style={{ width: 280, transform: 'scale(1.03)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
    >
      <h4 className="text-sm font-medium text-white mb-1">{project.name}</h4>
      <p className="text-xs text-[#A1A4AA] mb-2">{project.customer}</p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium" style={{ color: pCfg.color }}>{pCfg.label}</span>
        <span className="text-[10px] text-[#5E626A]">{project.progress}%</span>
      </div>
    </div>
  );
}

/* ═════════ MAIN COMPONENT ═════════ */

export default function Projekte() {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [projects, setProjects] = useState<KanbanProject[]>(mockProjects);
  const [selectedProject, setSelectedProject] = useState<KanbanProject | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'tasks' | 'notes' | 'time'>('details');
  const [showAdd, setShowAdd] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', customer: '', priority: 'medium' as KanbanProject['priority'], deadline: '', tags: '', description: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const customers = useMemo(() => {
    const set = new Set(projects.map(p => p.customer));
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.customer.toLowerCase().includes(search.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;
      const matchesCustomer = customerFilter === 'all' || p.customer === customerFilter;
      return matchesSearch && matchesPriority && matchesCustomer;
    });
  }, [projects, search, priorityFilter, customerFilter]);

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const overId = String(over.id);
    const activeId = String(active.id);

    // Check if dropped on a column
    const targetColumn = columns.find(c => c.key === overId);
    if (targetColumn) {
      setProjects(prev => prev.map(p => p.id === activeId ? { ...p, column: targetColumn.key } : p));
      return;
    }

    // Check if dropped on another card (find its column)
    const overProject = projects.find(p => p.id === overId);
    if (overProject) {
      setProjects(prev => prev.map(p => p.id === activeId ? { ...p, column: overProject.column } : p));
    }
  }

  const activeProject = activeDragId ? projects.find(p => p.id === activeDragId) : null;

  function toggleTask(projectId: string, taskId: string) {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const tasks = p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
      const doneCount = tasks.filter(t => t.done).length;
      const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : p.progress;
      return { ...p, tasks, progress };
    }));
    setSelectedProject(prev => prev ? { ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) } : null);
  }

  function saveProject() {
    if (!formData.name || !formData.customer) return;
    const newProject: KanbanProject = {
      id: String(Date.now()),
      name: formData.name,
      customer: formData.customer,
      priority: formData.priority,
      deadline: formData.deadline || new Date().toISOString().slice(0, 10),
      column: 'planned',
      progress: 0,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: formData.description,
      tasks: [],
      notes: '',
      timeEntries: [],
    };
    setProjects(prev => [newProject, ...prev]);
    setShowAdd(false);
  }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <div className="flex items-center h-10 rounded-xl px-3 gap-2 w-full sm:w-64"
            style={{ background: 'rgba(27,29,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Search size={16} className="text-[#5E626A] shrink-0" />
            <input
              type="text" placeholder="Projekte suchen..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-[#5E626A] outline-none w-full"
            />
            {search && <button onClick={() => setSearch('')}><X size={14} className="text-[#5E626A]" /></button>}
          </div>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="h-10 rounded-xl px-3 text-xs text-white outline-none"
            style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <option value="all">Alle Prioritaeten</option>
            <option value="urgent">Dringend</option>
            <option value="high">Hoch</option>
            <option value="medium">Mittel</option>
            <option value="low">Niedrig</option>
          </select>
          <select
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value)}
            className="h-10 rounded-xl px-3 text-xs text-white outline-none"
            style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <option value="all">Alle Kunden</option>
            {customers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-medium shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
        >
          <Plus size={16} /> Projekt hinzufuegen
        </button>
      </div>

      {/* ── Empty State ── */}
      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="h-16 w-16 rounded-full bg-[#141518] flex items-center justify-center mb-4">
            <GripVertical size={32} className="text-[#5E626A]" />
          </div>
          <p className="text-white font-display font-bold text-lg mb-1">Noch keine Projekte</p>
          <p className="text-[#A1A4AA] text-sm mb-6">Erstelle dein erstes Projekt</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
          >
            <Plus size={16} /> Projekt hinzufuegen
          </button>
        </motion.div>
      )}

      {/* ── Kanban Board ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map(col => {
            const colProjects = filteredProjects.filter(p => p.column === col.key);
            return (
              <div
                key={col.key}
                className="rounded-xl flex flex-col min-h-[500px]"
                style={{
                  background: col.bgTint,
                  borderTop: `3px solid ${col.borderColor}`,
                  border: `1px solid rgba(255,255,255,0.06)`,
                  borderTopWidth: 3,
                  borderTopColor: col.borderColor,
                }}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-medium text-white">{col.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${col.color}20`, color: col.color }}>
                    {colProjects.length}
                  </span>
                </div>

                {/* Cards */}
                <SortableContext items={colProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 p-3 space-y-3">
                    <AnimatePresence>
                      {colProjects.map(project => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.25 }}
                        >
                          <SortableCard
                            project={project}
                            onClick={() => setSelectedProject(project)}
                          />
                        </motion.div>
                      ))}
                      {colProjects.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center py-10"
                        >
                          <Plus size={20} className="text-[#5E626A]/40" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeProject ? <DragCard project={activeProject} /> : null}
        </DragOverlay>
      </DndContext>

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
              className="w-full max-w-[600px] rounded-2xl overflow-hidden max-h-[80vh] flex flex-col"
              style={{ background: '#0C0D0F', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display font-bold text-white text-lg">{selectedProject.name}</h2>
                    <p className="text-xs text-[#A1A4AA] mt-0.5">{selectedProject.customer}</p>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#141518] transition-colors">
                    <X size={16} className="text-[#A1A4AA]" />
                  </button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 rounded-full bg-[#141518] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${selectedProject.progress}%`, background: selectedProject.progress === 100 ? '#36CFC9' : '#FF8C5A' }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[#A1A4AA]">{selectedProject.progress}%</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: priorityConfig[selectedProject.priority].color + '20', color: priorityConfig[selectedProject.priority].color }}>
                    {priorityConfig[selectedProject.priority].label}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 mt-3">
                  {selectedProject.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] bg-[#141518] text-[#A1A4AA]">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-6 border-b border-white/[0.06] shrink-0">
                {([
                  { key: 'details' as const, label: 'Details', icon: Pencil },
                  { key: 'tasks' as const, label: 'Aufgaben', icon: CheckSquare },
                  { key: 'notes' as const, label: 'Notizen', icon: StickyNote },
                  { key: 'time' as const, label: 'Zeiterfassung', icon: Timer },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={`flex items-center gap-1.5 h-9 px-3 text-xs font-medium border-b-2 transition-all duration-200 ${
                      detailTab === tab.key ? 'text-[#FF8C5A] border-[#FF8C5A]' : 'text-[#A1A4AA] border-transparent hover:text-white'
                    }`}
                  >
                    <tab.icon size={13} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {detailTab === 'details' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[#141518]">
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Status</p>
                        <p className="text-sm text-white mt-1">{columns.find(c => c.key === selectedProject.column)?.label}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141518]">
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Deadline</p>
                        <p className="text-sm text-white mt-1 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(selectedProject.deadline).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141518]">
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Prioritaet</p>
                        <p className="text-sm mt-1" style={{ color: priorityConfig[selectedProject.priority].color }}>
                          {priorityConfig[selectedProject.priority].label}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141518]">
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Fortschritt</p>
                        <p className="text-sm font-mono text-white mt-1">{selectedProject.progress}%</p>
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

                {detailTab === 'tasks' && (
                  <div className="space-y-2">
                    {selectedProject.tasks.length === 0 && <p className="text-sm text-[#5E626A]">Keine Aufgaben vorhanden.</p>}
                    {selectedProject.tasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(selectedProject.id, task.id)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#141518] cursor-pointer hover:bg-[#1B1D20] transition-colors"
                      >
                        <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          task.done ? 'bg-[#36CFC9] border-[#36CFC9]' : 'border-[#5E626A]'
                        }`}>
                          {task.done && <CheckSquare size={12} className="text-black" />}
                        </div>
                        <span className={`text-sm ${task.done ? 'text-[#5E626A] line-through' : 'text-white'}`}>{task.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {detailTab === 'notes' && (
                  <div>
                    <textarea
                      value={selectedProject.notes}
                      onChange={e => {
                        setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, notes: e.target.value } : p));
                        setSelectedProject(prev => prev ? { ...prev, notes: e.target.value } : null);
                      }}
                      rows={10}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none leading-relaxed"
                      style={{ background: '#141518', border: '1px solid rgba(255,255,255,0.06)' }}
                      placeholder="Notizen hier eingeben..."
                    />
                  </div>
                )}

                {detailTab === 'time' && (
                  <div className="space-y-3">
                    {selectedProject.timeEntries.length === 0 && <p className="text-sm text-[#5E626A]">Keine Zeiterfassungen.</p>}
                    {selectedProject.timeEntries.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-4 rounded-xl bg-[#141518]">
                        <div>
                          <p className="text-sm text-white">{entry.description}</p>
                          <p className="text-xs text-[#5E626A] mt-0.5">{new Date(entry.date).toLocaleDateString('de-DE')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-[#FF8C5A]">{Math.floor(entry.minutes / 60)}h {entry.minutes % 60}m</p>
                        </div>
                      </div>
                    ))}
                    {selectedProject.timeEntries.length > 0 && (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-[#141518] border border-[#FF8C5A]/20 mt-4">
                        <span className="text-sm text-[#A1A4AA]">Gesamt</span>
                        <span className="text-lg font-mono font-bold text-[#FF8C5A]">
                          {Math.floor(selectedProject.timeEntries.reduce((s, e) => s + e.minutes, 0) / 60)}h {selectedProject.timeEntries.reduce((s, e) => s + e.minutes, 0) % 60}m
                        </span>
                      </div>
                    )}
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
              className="w-full max-w-[480px] rounded-2xl p-6"
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
                    value={formData.customer} onChange={e => setFormData(p => ({ ...p, customer: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Prioritaet</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData(p => ({ ...p, priority: e.target.value as KanbanProject['priority'] }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <option value="urgent">Dringend</option>
                      <option value="high">Hoch</option>
                      <option value="medium">Mittel</option>
                      <option value="low">Niedrig</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Deadline</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Tags (kommasepariert)</label>
                  <input
                    value={formData.tags} onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                    placeholder="z.B. Website, Design, SEO"
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none placeholder-[#5E626A]"
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
