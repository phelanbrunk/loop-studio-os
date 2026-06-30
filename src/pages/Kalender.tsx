import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, MapPin, Users, Clock, CalendarDays,
  LayoutList, Presentation, Phone, AlertCircle,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths,
  addDays, isSameMonth, isSameDay, isToday, eachDayOfInterval,
  addWeeks, subWeeks, startOfDay, isBefore, isAfter,
} from 'date-fns';
import { de } from 'date-fns/locale';

/* ═════════ TYPES ═════════ */

type CalendarView = 'month' | 'week' | 'agenda';
type EventType = 'meeting' | 'call' | 'deadline' | 'reminder' | 'presentation' | 'other';

interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  start_time: string;
  end_time: string;
  location?: string;
  customer?: string;
  description?: string;
}

/* ═════════ MOCK DATA ═════════ */

const now = new Date();

const mockEvents: CalendarEvent[] = [];

/* ═════════ CONFIG ═════════ */

const typeConfig: Record<EventType, { color: string; bg: string; icon: typeof Users; label: string }> = {
  meeting: { color: '#FF8C5A', bg: 'rgba(255,140,90,0.12)', icon: Users, label: 'Meeting' },
  call: { color: '#36CFC9', bg: 'rgba(54,207,201,0.12)', icon: Phone, label: 'Anruf' },
  deadline: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: AlertCircle, label: 'Deadline' },
  reminder: { color: '#B98BFF', bg: 'rgba(185,139,255,0.12)', icon: Clock, label: 'Erinnerung' },
  presentation: { color: '#F5C542', bg: 'rgba(245,197,66,0.12)', icon: Presentation, label: 'Praesentation' },
  other: { color: '#5E626A', bg: 'rgba(94,98,106,0.12)', icon: CalendarDays, label: 'Sonstiges' },
};

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const timeSlots = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

/* ═════════ HELPERS ═════════ */

function getEventsForDay(events: CalendarEvent[], day: Date) {
  return events.filter(e => isSameDay(new Date(e.start_time), day));
}

function getEventHeight(e: CalendarEvent) {
  const start = new Date(e.start_time);
  const end = new Date(e.end_time);
  const mins = (end.getTime() - start.getTime()) / 60000;
  return Math.max(24, (mins / 60) * 48);
}

/* ═════════ MAIN COMPONENT ═════════ */

export default function Kalender() {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(now);
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '', type: 'meeting', start_time: '', end_time: '', location: '', customer: '', description: '',
  });

  /* ── Calendar Grid (Month) ── */
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  /* ── Week Grid ── */
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays_arr = eachDayOfInterval({ start: weekStart, end: weekEnd });

  /* ── Upcoming sidebar events ── */
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(now);
    return [...events]
      .filter(e => !isBefore(new Date(e.start_time), today) || isSameDay(new Date(e.start_time), today))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5);
  }, [events]);

  function prev() {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
  }

  function next() {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
  }

  function saveEvent() {
    if (!formData.title || !formData.start_time) return;
    const newEvent: CalendarEvent = {
      id: String(Date.now()),
      title: formData.title || '',
      type: (formData.type as EventType) || 'meeting',
      start_time: formData.start_time || '',
      end_time: formData.end_time || formData.start_time || '',
      location: formData.location,
      customer: formData.customer,
      description: formData.description,
    };
    setEvents(prev => [...prev, newEvent]);
    setShowAdd(false);
  }

  function deleteEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
    setSelectedEvent(null);
  }

  return (
    <div className="flex gap-6">
      {/* ── Main Calendar ── */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={prev} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-[#141518] transition-colors">
              <ChevronLeft size={18} className="text-[#A1A4AA]" />
            </button>
            <h2 className="text-lg font-display font-bold text-white min-w-[180px] text-center">
              {view === 'month' ? format(currentDate, 'MMMM yyyy', { locale: de }) : format(weekStart, 'dd.') + ' - ' + format(weekEnd, 'dd. MMM yyyy', { locale: de })}
            </h2>
            <button onClick={next} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-[#141518] transition-colors">
              <ChevronRight size={18} className="text-[#A1A4AA]" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="h-9 px-3 rounded-xl text-xs font-medium text-[#A1A4AA] hover:text-white hover:bg-[#141518] transition-colors ml-2"
            >
              Heute
            </button>
          </div>
          <div className="flex items-center gap-2">
            {(['month', 'week', 'agenda'] as const).map(v => {
              const Icon = v === 'month' ? CalendarDays : v === 'week' ? LayoutList : Clock;
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                    view === v ? 'text-[#FF8C5A]' : 'text-[#A1A4AA] hover:text-white'
                  }`}
                  style={view === v ? { background: 'rgba(255,140,90,0.12)' } : {}}
                >
                  <Icon size={14} /> {v === 'month' ? 'Monat' : v === 'week' ? 'Woche' : 'Agenda'}
                </button>
              );
            })}
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-white text-xs font-medium ml-2"
              style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
            >
              <Plus size={14} /> Termin
            </button>
          </div>
        </div>

        {/* ── MONTH VIEW ── */}
        <AnimatePresence mode="wait">
          {view === 'month' && (
            <motion.div
              key="month"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map(d => (
                  <div key={d} className="text-center text-[11px] font-medium text-[#5E626A] uppercase tracking-wider h-8 flex items-center justify-center">
                    {d}
                  </div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {calendarDays.map((day, i) => {
                  const dayEvents = getEventsForDay(events, day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  return (
                    <motion.div
                      key={day.toISOString()}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.005, duration: 0.2 }}
                      className={`min-h-[100px] p-2 cursor-pointer transition-colors ${
                        isCurrentMonth ? 'bg-[#0C0D0F]' : 'bg-[#08090A]'
                      } hover:bg-[#141518]`}
                      onClick={() => {
                        if (!isSameMonth(day, currentDate)) setCurrentDate(day);
                      }}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                          isTodayDate ? 'bg-[#FF8C5A] text-white font-bold' : isCurrentMonth ? 'text-white' : 'text-[#5E626A]'
                        }`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(e => {
                          const cfg = typeConfig[e.type];
                          return (
                            <div
                              key={e.id}
                              onClick={ev => { ev.stopPropagation(); setSelectedEvent(e); }}
                              className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer"
                              style={{ background: cfg.bg, color: cfg.color }}
                            >
                              {e.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] text-[#5E626A] pl-1">+{dayEvents.length - 3} weitere</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── WEEK VIEW ── */}
        <AnimatePresence mode="wait">
          {view === 'week' && (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="bg-[#0C0D0F] border border-white/[0.06] rounded-xl overflow-hidden"
            >
              {/* Day headers */}
              <div className="grid grid-cols-8 border-b border-white/[0.06]">
                <div className="h-10 border-r border-white/[0.04]" />
                {weekDays_arr.map((day, i) => (
                  <div key={i} className={`h-10 flex flex-col items-center justify-center border-r border-white/[0.04] last:border-0 ${
                    isToday(day) ? 'bg-[#FF8C5A]/5' : ''
                  }`}>
                    <span className="text-[10px] text-[#5E626A] uppercase">{weekDays[i]}</span>
                    <span className={`text-xs font-bold ${isToday(day) ? 'text-[#FF8C5A]' : 'text-white'}`}>{format(day, 'd')}</span>
                  </div>
                ))}
              </div>
              {/* Time grid */}
              <div className="overflow-y-auto max-h-[520px]">
                {timeSlots.map((slot, slotIdx) => (
                  <div key={slot} className="grid grid-cols-8" style={{ height: 48 }}>
                    <div className="border-r border-white/[0.04] flex items-start justify-center -mt-2">
                      <span className="text-[10px] text-[#5E626A]">{slot}</span>
                    </div>
                    {weekDays_arr.map((day, dayIdx) => {
                      const slotEvents = getEventsForDay(events, day).filter(e => {
                        const h = new Date(e.start_time).getHours();
                        return h === slotIdx + 8;
                      });
                      return (
                        <div key={dayIdx} className={`border-r border-white/[0.04] last:border-0 relative ${
                          isToday(day) ? 'bg-[#FF8C5A]/[0.02]' : ''
                        }`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          {slotEvents.map(e => {
                            const cfg = typeConfig[e.type];
                            return (
                              <div
                                key={e.id}
                                onClick={() => setSelectedEvent(e)}
                                className="absolute inset-x-1 top-0.5 rounded-md px-1.5 py-0.5 cursor-pointer overflow-hidden"
                                style={{ background: cfg.bg, color: cfg.color, height: getEventHeight(e) }}
                              >
                                <span className="text-[10px] font-medium truncate block">{e.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AGENDA VIEW ── */}
        <AnimatePresence mode="wait">
          {view === 'agenda' && (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {events.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="h-16 w-16 rounded-full bg-[#141518] flex items-center justify-center mb-4">
                    <CalendarDays size={32} className="text-[#5E626A]" />
                  </div>
                  <p className="text-white font-display font-bold text-lg mb-1">Keine Termine vorhanden</p>
                  <p className="text-[#A1A4AA] text-sm mb-6">Plane deinen ersten Termin</p>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 h-9 px-3 rounded-xl text-white text-xs font-medium"
                    style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}
                  >
                    <Plus size={14} /> Termin
                  </button>
                </motion.div>
              )}
              {['Heute', 'Morgen', 'Diese Woche', 'Spaeter'].map(section => {
                const sectionEvents = events.filter(e => {
                  const d = new Date(e.start_time);
                  if (section === 'Heute') return isToday(d);
                  if (section === 'Morgen') return isSameDay(d, addDays(now, 1));
                  if (section === 'Diese Woche') {
                                        const we = endOfWeek(now, { weekStartsOn: 1 });
                    return isAfter(d, addDays(now, 1)) && !isAfter(d, we);
                  }
                  return isAfter(d, endOfWeek(now, { weekStartsOn: 1 }));
                }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                if (sectionEvents.length === 0) return null;

                return (
                  <div key={section}>
                    <h3 className="text-xs font-medium text-[#5E626A] uppercase tracking-wider mb-3">{section}</h3>
                    <div className="space-y-2">
                      {sectionEvents.map((e, i) => {
                        const cfg = typeConfig[e.type];
                        const TypeIcon = cfg.icon;
                        return (
                          <motion.div
                            key={e.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            onClick={() => setSelectedEvent(e)}
                            className="flex items-center gap-4 p-4 rounded-xl bg-[#0C0D0F] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer transition-all duration-200"
                          >
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                              <TypeIcon size={18} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-white truncate">{e.title}</h4>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-[#A1A4AA] flex items-center gap-1">
                                  <Clock size={10} /> {format(new Date(e.start_time), 'HH:mm')} - {format(new Date(e.end_time), 'HH:mm')}
                                </span>
                                {e.location && (
                                  <span className="text-xs text-[#5E626A] flex items-center gap-1">
                                    <MapPin size={10} /> {e.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            {e.customer && (
                              <span className="text-xs text-[#5E626A] shrink-0 hidden sm:block">{e.customer}</span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Upcoming Sidebar (desktop) ── */}
      <div className="hidden xl:block w-72 shrink-0">
        <div
          className="rounded-xl p-5 sticky top-24"
          style={{ background: 'rgba(12,13,15,0.65)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h3 className="font-display font-bold text-white text-sm mb-4">Anstehende Termine</h3>
          <div className="space-y-3">
            {upcomingEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays size={24} className="text-[#5E626A] mb-2" />
                <p className="text-xs text-[#5E626A]">Keine anstehenden Termine</p>
              </div>
            )}
            {upcomingEvents.map(e => {
              const cfg = typeConfig[e.type];
              const TypeIcon = cfg.icon;
              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedEvent(e)}
                  className="p-3 rounded-xl bg-[#141518] cursor-pointer hover:bg-[#1B1D20] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <TypeIcon size={12} style={{ color: cfg.color }} />
                    <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-white font-medium truncate">{e.title}</p>
                  <p className="text-[10px] text-[#5E626A] mt-0.5">
                    {isToday(new Date(e.start_time)) ? 'Heute' : format(new Date(e.start_time), 'EEE, d.M.', { locale: de })}
                    {' '}um {format(new Date(e.start_time), 'HH:mm')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Event Detail Modal ── */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[480px] rounded-2xl overflow-hidden"
              style={{ background: '#0C0D0F', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cfg = typeConfig[selectedEvent.type];
                      const TypeIcon = cfg.icon;
                      return (
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                          <TypeIcon size={22} style={{ color: cfg.color }} />
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="font-display font-bold text-white">{selectedEvent.title}</h2>
                      <span className="text-xs" style={{ color: typeConfig[selectedEvent.type].color }}>
                        {typeConfig[selectedEvent.type].label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#141518] transition-colors"
                  >
                    <X size={16} className="text-[#A1A4AA]" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141518]">
                    <Clock size={16} className="text-[#FF8C5A]" />
                    <div>
                      <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Zeit</p>
                      <p className="text-sm text-white">{format(new Date(selectedEvent.start_time), 'EEEE, d. MMMM yyyy', { locale: de })}</p>
                      <p className="text-xs text-[#A1A4AA]">{format(new Date(selectedEvent.start_time), 'HH:mm')} - {format(new Date(selectedEvent.end_time), 'HH:mm')} Uhr</p>
                    </div>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141518]">
                      <MapPin size={16} className="text-[#B98BFF]" />
                      <div>
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Ort</p>
                        <p className="text-sm text-white">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}
                  {selectedEvent.customer && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141518]">
                      <Users size={16} className="text-[#36CFC9]" />
                      <div>
                        <p className="text-[10px] text-[#5E626A] uppercase tracking-wider">Kunde</p>
                        <p className="text-sm text-white">{selectedEvent.customer}</p>
                      </div>
                    </div>
                  )}
                  {selectedEvent.description && (
                    <div className="p-3 rounded-xl bg-[#141518]">
                      <p className="text-[10px] text-[#5E626A] uppercase tracking-wider mb-1">Beschreibung</p>
                      <p className="text-sm text-[#A1A4AA]">{selectedEvent.description}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => deleteEvent(selectedEvent.id)}
                  className="mt-4 flex items-center gap-2 h-10 px-4 rounded-xl text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                >
                  <X size={14} /> Termin loeschen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Event Modal ── */}
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
              <h2 className="text-lg font-display font-bold text-white mb-5">Neuer Termin</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Titel *</label>
                  <input
                    value={formData.title || ''} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Typ</label>
                    <select
                      value={formData.type || 'meeting'}
                      onChange={e => setFormData(p => ({ ...p, type: e.target.value as EventType }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Ort</label>
                    <input
                      value={formData.location || ''} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Start *</label>
                    <input
                      type="datetime-local"
                      value={formData.start_time || ''} onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A4AA] mb-1.5 block">Ende</label>
                    <input
                      type="datetime-local"
                      value={formData.end_time || ''} onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))}
                      className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                      style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Kunde</label>
                  <input
                    value={formData.customer || ''} onChange={e => setFormData(p => ({ ...p, customer: e.target.value }))}
                    className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A1A4AA] mb-1.5 block">Beschreibung</label>
                  <textarea
                    value={formData.description || ''} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                    style={{ background: '#1B1D20', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="h-10 px-4 rounded-xl text-sm text-[#A1A4AA] hover:text-white hover:bg-[#141518] transition-colors">Abbrechen</button>
                <button onClick={saveEvent} className="h-10 px-6 rounded-xl text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #FF8C5A, #FFB347)' }}>Erstellen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
