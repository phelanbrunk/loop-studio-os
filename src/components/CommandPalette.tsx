import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Globe, KanbanSquare,
  Calendar, TrendingUp, FileText, MessageSquare,
  Brain, BrainCircuit, Puzzle, Rocket, Search,
  Command as CommandIcon, ArrowRight, Sparkles, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface CommandItemData {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords: string[];
  action: () => void;
  group: string;
}

/* ------------------------------------------------------------------ */
/*  KEYBOARD SHORTCUT HOOK                                             */
/* ------------------------------------------------------------------ */

function useCommandShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onOpen]);
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function CommandPalette() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const toggleOpen = useCallback(() => setOpen((v) => !v), []);
  useCommandShortcut(toggleOpen);

  // Close palette on route change
  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [location.pathname]);

  // ESC handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  /* --- Commands definition --- */
  const commands = useMemo<CommandItemData[]>(() => {
    const nav = (path: string) => () => { navigate(path); };

    return [
      // Pages
      { id: 'dash', label: 'Dashboard', icon: LayoutDashboard, keywords: ['home', 'start', 'uebersicht'], action: nav('/'), group: 'Seiten' },
      { id: 'brain', label: 'Brain', icon: Brain, keywords: ['ki', 'ai', 'assistant'], action: nav('/brain'), group: 'Seiten' },
      { id: 'agenten', label: 'Agenten-Schwarm', icon: BrainCircuit, keywords: ['agent', 'swarm', 'ki-agenten'], action: nav('/agenten'), group: 'Seiten' },
      { id: 'registry', label: 'Agent Registry', icon: Puzzle, keywords: ['plugins', 'skills', 'register'], action: nav('/agenten/registry'), group: 'Seiten' },
      { id: 'kunden', label: 'Kunden', icon: Users, keywords: ['kunden', 'clients', 'kontakte'], action: nav('/kunden'), group: 'Seiten' },
      { id: 'websites', label: 'Websites', icon: Globe, keywords: ['web', 'sites', 'domains'], action: nav('/websites'), group: 'Seiten' },
      { id: 'projekte', label: 'Projekte', icon: KanbanSquare, keywords: ['projects', 'kanban', 'tasks'], action: nav('/projekte'), group: 'Seiten' },
      { id: 'kalender', label: 'Kalender', icon: Calendar, keywords: ['termin', 'datum', 'events'], action: nav('/kalender'), group: 'Seiten' },
      { id: 'verdienst', label: 'Verdienst', icon: TrendingUp, keywords: ['earnings', 'einnahmen', 'umsatz'], action: nav('/verdienst'), group: 'Seiten' },
      { id: 'rechnungen', label: 'Rechnungen', icon: FileText, keywords: ['invoices', 'billing', 'rechnung'], action: nav('/rechnungen'), group: 'Seiten' },
      { id: 'chat', label: 'Chat', icon: MessageSquare, keywords: ['nachrichten', 'messenger', 'ki-chat'], action: nav('/chat'), group: 'Seiten' },

      // Quick Actions
      {
        id: 'spawn-grok',
        label: 'Grok Orchestrator spawnen',
        icon: Rocket,
        keywords: ['orchestrator', 'start', 'grok'],
        action: () => {
          toast.success('Grok Orchestrator wurde gespawnt!', { icon: React.createElement(Rocket, { size: 14 }) });
          setOpen(false);
        },
        group: 'Schnellaktionen',
      },
      {
        id: 'spawn-divine',
        label: 'Divine Design Director spawnen',
        icon: Sparkles,
        keywords: ['design', 'creative', 'director'],
        action: () => {
          toast.success('Divine Design Director wurde gespawnt!', { icon: React.createElement(Sparkles, { size: 14 }) });
          setOpen(false);
        },
        group: 'Schnellaktionen',
      },
      {
        id: 'spawn-ecc',
        label: 'ECC v2 spawnen',
        icon: Zap,
        keywords: ['code', 'development', 'programming'],
        action: () => {
          toast.success('ECC v2 wurde gespawnt!', { icon: React.createElement(Zap, { size: 14 }) });
          setOpen(false);
        },
        group: 'Schnellaktionen',
      },

      // Suggestions
      { id: 'goto-registry', label: 'Zur Agent Registry', icon: Puzzle, keywords: ['registry', 'agenten'], action: nav('/agenten/registry'), group: 'Vorschlaege' },
      { id: 'goto-chat', label: 'Zum Chat', icon: MessageSquare, keywords: ['chat', 'nachricht'], action: nav('/chat'), group: 'Vorschlaege' },
      { id: 'goto-brain', label: 'Zum Brain', icon: Brain, keywords: ['brain', 'ki'], action: nav('/brain'), group: 'Vorschlaege' },
    ];
  }, [navigate]);

  /* Group commands */
  const grouped = useMemo(() => {
    const map: Record<string, CommandItemData[]> = {};
    for (const c of commands) {
      if (!map[c.group]) map[c.group] = [];
      map[c.group].push(c);
    }
    return map;
  }, [commands]);

  const groupOrder = ['Vorschlaege', 'Seiten', 'Schnellaktionen'];

  return (
    <>
      {/* Shortcut hint button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200"
        style={{
          color: '#5E626A',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = '#A1A4AA';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = '#5E626A';
        }}
      >
        <Search size={14} />
        <span className="hidden sm:inline">Suchen...</span>
        <kbd
          className="hidden md:inline-flex h-4 px-1.5 rounded text-[10px] font-mono items-center"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: '#5E626A',
          }}
        >
          <CommandIcon size={8} className="mr-0.5" />
          K
        </kbd>
      </button>

      {/* Overlay + Command Palette */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
            onClick={() => { setOpen(false); setQuery(''); }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl mx-4 rounded-xl overflow-hidden shadow-2xl"
              style={{
                backgroundColor: '#0F1014',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 32px rgba(255,140,90,0.08)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Command
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase [&_[cmdk-input-wrapper]]:h-14 [&_[cmdk-input]]:h-14 [&_[cmdk-input]]:text-sm [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]]:rounded-lg"
                style={{ backgroundColor: '#0F1014' }}
                loop
              >
                <CommandInput
                  placeholder="Befehl suchen oder Seite aufrufen..."
                  value={query}
                  onValueChange={setQuery}
                  className="text-white placeholder:text-[#5E626A]"
                />
                <CommandList className="max-h-[360px] py-2">
                  <CommandEmpty
                    className="py-8 text-sm text-center"
                    style={{ color: '#5E626A' }}
                  >
                    Keine Ergebnisse gefunden.
                  </CommandEmpty>

                  {groupOrder.map((groupName, gi) => {
                    const items = grouped[groupName];
                    if (!items || items.length === 0) return null;

                    return (
                      <React.Fragment key={groupName}>
                        {gi > 0 && (
                          <CommandSeparator
                            className="my-1"
                            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                          />
                        )}
                        <CommandGroup
                          heading={groupName}
                          className="px-2"
                        >
                          {items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <CommandItem
                                key={item.id}
                                onSelect={() => item.action()}
                                className="flex items-center gap-3 cursor-pointer transition-colors data-[selected=true]:bg-white/5"
                                style={{ color: '#A1A4AA' }}
                              >
                                <div
                                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                                >
                                  <Icon size={16} style={{ color: '#A1A4AA' }} />
                                </div>
                                <span className="flex-1 text-sm">{item.label}</span>
                                <ArrowRight size={14} style={{ color: '#5E626A' }} />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </React.Fragment>
                    );
                  })}
                </CommandList>

                {/* Footer */}
                <div
                  className="flex items-center justify-between px-4 h-9 text-[10px]"
                  style={{
                    color: '#5E626A',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd
                        className="inline-flex h-4 px-1 rounded text-[10px] font-mono items-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                      >
                        <CommandIcon size={8} />
                      </kbd>
                      <kbd
                        className="inline-flex h-4 px-1 rounded text-[10px] font-mono items-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                      >
                        K
                      </kbd>
                      zum Oeffnen
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd
                        className="inline-flex h-4 px-1 rounded text-[10px] font-mono items-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                      >
                        ESC
                      </kbd>
                      zum Schliessen
                    </span>
                  </div>
                  <span>Loop Studio Command Palette</span>
                </div>
              </Command>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
