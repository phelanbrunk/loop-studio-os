# 🧠 Loop Studio OS v5.1

> **Das Business-Dashboard + Autonomous Agent Brain für Project Loop** — mit Agent Swarm Canvas, Hermes 7-Phase Autonomous Brain, Knowledge Graph, AI Chat, und Execution Layer.

![Version](https://img.shields.io/badge/version-5.1.0-orange)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Brain-3ECF8E?logo=supabase)
![Hermes](https://img.shields.io/badge/Hermes-Autonomous%20Brain-gold)

---

## 🚀 Live Demo

**🔗 [loop-studio-os.vercel.app](https://loop-studio-os.vercel.app)** (Vercel)

---

## ✨ Features v5.1

### 🤖 Agent Swarm Canvas (`/agenten`)

- **Interactive Node-Based Canvas** — @xyflow/react powered
- **7 Agent Types**: Brain, Meta, Trader, Designer, Developer, Researcher, Deploy
- **Live Status**: Real-time agent status via Supabase Realtime (idle/running/paused/error/offline)
- **Hierarchical Visualization**: Brain → Agents with animated edges
- **Detail Panel**: Prompt textarea + 3 Execution Buttons (Kimi Meta, Simulation, Hermes/OpenClaw)
- **Simulation Mode**: Test agent behavior without real execution
- **Status Filter**: All | Running | Idle | Error

### 🧠 Hermes Autonomous Brain (`/hermes-brain`)

- **7-Phase Endless Loop**: Observation → Research → Reasoning → Planning → Validation → Action → Learning
- **Visual Phase Pipeline**: Animated horizontal pipeline with status indicators
- **Phase Detail Panels**: Full detail view for each phase
- **Task-Granular Safety**: Paused tasks don't block others — only the affected task pauses
- **Phelan Tasks**: Tasks Hermes creates for Phelan with notifications
- **Memory Viewer**: Searchable Obsidian-style memory entries
- **Safety Dashboard**: "Never Harm Phelan Brunk" — always visible, always active
- **Live Activity Log**: Scrolling, color-coded log of current cycle

### 🧠 Knowledge Graph Brain (`/brain`)

- **Canvas 2D Force-Directed Graph** — eigene Physik-Engine
- **20 Knoten-Typen**: Projekte, Kunden, Notizen, Ideen, Tasks, Milestones...
- **4 Layout-Modes**: Force-Directed, Circular, Grid, Hierarchical
- **Zoom / Pan / Drag** — volle Canvas-Interaktion
- **Detail-Panel** — Knoten bearbeiten, verknüpfen, analysieren
- **Search & Filter** — Echtzeit-Suche im Graphen

### 📊 9 Dashboard-Seiten

| Seite | Route | Beschreibung |
|-------|-------|-------------|
| **Dashboard** | `/` | KPIs, Revenue Chart, Termine, Projekte, Kunden |
| **🧠 Brain** | `/brain` | **Knowledge Graph** — neuronales Netzwerk aller Daten |
| **🤖 Agenten** | `/agenten` | **Agent Swarm Canvas** — Interactive node-based agent management |
| **🧠 Hermes** | `/hermes-brain` | **Autonomous Brain** — 7-phase intelligence loop control |
| **Kunden** | `/kunden` | Kundenverwaltung mit Search, Filter, Detail-Modals |
| **Websites** | `/websites` | Website-Projekte Galerie mit Status-Tracking |
| **Projekte** | `/projekte` | Kanban-Board mit Drag & Drop (@dnd-kit) |
| **Kalender** | `/kalender` | Month/Week/Agenda Views mit Event-Management |
| **Verdienst** | `/verdienst` | Finanz-Dashboard mit Charts (Recharts) |
| **Rechnungen** | `/rechnungen` | Invoice Management mit Auto-Calc |
| **Chat** | `/chat` | AI Chat mit API Connector Panel |

### 💬 AI Chat + API Connector

- V0-Style Chat Interface
- Quick-Action Chips
- API Connector Panel (OpenAI, Anthropic, Custom)
- Prompt Templates

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS v3 + shadcn/ui (40+ Components) |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Agent Canvas** | @xyflow/react (React Flow v12) |
| **Drag & Drop** | @dnd-kit |
| **Dates** | date-fns |
| **Icons** | Lucide React |
| **Brain** | HTML5 Canvas 2D (pure, no library) |
| **Backend** | Supabase (Postgres, Auth, Realtime) |
| **Hosting** | Vercel |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Vercel (Hosting)                       │
│              React SPA (Static)                           │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│              Supabase (The Brain)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  Auth    │  │ Postgres │  │   Realtime           │   │
│  │ (Users)  │  │ (Tables) │  │  (Live Data)         │   │
│  └──────────┘  └────┬─────┘  └──────────────────────┘   │
│                     │                                      │
│  ┌──────────────────┼──────────────────────────────────┐  │
│  │  Business Tables │  Knowledge Graph   │ Agent System│  │
│  │  • customers     │  • knowledge_nodes │ • loop_     │  │
│  │  • projects      │  • knowledge_edges │   agents    │  │
│  │  • invoices      │  • knowledge_views │ • loop_     │  │
│  │  • appointments  │  • knowledge_act.  │   agent_    │  │
│  │  • expenses      │                    │   tasks     │  │
│  │  • notes         │                    │ • loop_     │  │
│  │  • time_entries  │  Auto-triggers:    │   agent_    │  │
│  │  • documents     │  • customer→node   │   executions│  │
│  │  • chat_*        │  • project→node    │ • loop_     │  │
│  │  • api_*         │  • neighborhood()  │   meta_     │  │
│  │                  │  • brain_stats()   │   sessions  │  │
│  │                  │                    │ • loop_     │  │
│  │                  │                    │   hermes_   │  │
│  │                  │                    │   brain_    │  │
│  │                  │                    │   cycles    │  │
│  │                  │                    │ • loop_     │  │
│  │                  │                    │   hermes_   │  │
│  │                  │                    │   memory    │  │
│  │                  │                    │ • loop_     │  │
│  │                  │                    │   phelan_   │  │
│  │                  │                    │   tasks     │  │
│  └──────────────────┴────────────────────┴─────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
loop-studio-os/
├── src/
│   ├── components/
│   │   ├── Layout.tsx              # App shell (sidebar + content)
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   ├── TopBar.tsx              # Glassmorphism top bar
│   │   └── ui/                     # 40+ shadcn/ui components
│   ├── pages/
│   │   ├── Dashboard.tsx           # KPIs + Charts
│   │   ├── Brain.tsx               # 🧠 Knowledge Graph (1,301 lines)
│   │   ├── Agenten.tsx             # 🤖 Agent Swarm Canvas (1,374 lines)
│   │   ├── HermesBrain.tsx         # 🧠 Hermes 7-Phase Brain (1,795 lines)
│   │   ├── Kunden.tsx              # Customer management
│   │   ├── Websites.tsx            # Website projects
│   │   ├── Projekte.tsx            # Kanban board
│   │   ├── Kalender.tsx            # Calendar
│   │   ├── Verdienst.tsx           # Earnings tracker
│   │   ├── Rechnungen.tsx          # Invoice management
│   │   └── Chat.tsx                # AI Chat + API connector
│   ├── hooks/
│   │   ├── useAuth.ts              # Supabase auth
│   │   ├── useExecutionRouter.ts   # Backend routing (kimi_meta/hermes/sim)
│   │   ├── useTaskQueue.ts         # Task queue + legal review pausing
│   │   ├── useAgentRealtime.ts     # Live agent node status
│   │   └── useHermesBrain.ts       # 7-phase brain control + Phelan tasks
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   └── hermes-brain.ts         # 🧠 Core engine (1,725 lines)
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── App.tsx                     # Routes (11 pages)
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles + dark theme
├── public/
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 🤖 Hermes Autonomous Brain — 7 Phase Loop

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 1. OBSERVE  │───→│ 2. RESEARCH │───→│ 3. REASON   │───→│ 4. PLAN     │
│  System     │    │  Web scrap. │    │  Analysis   │    │  Tasks for  │
│  state      │    │  Intelligence│   │  Reflection │    │  agents +   │
│  Metrics    │    │  Market data│    │  Goal eval  │    │  Phelan     │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                 │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│ 7. LEARN    │←───│ 6. ACT      │←───│ 5. VALIDATE │←────────┘
│  Memory     │    │  Execute    │    │  Safety     │
│  Improve    │    │  Delegate   │    │  Legal      │
│  Report     │    │  Calendar   │    │  Never Harm │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Critical Safety Rules

1. **"Never Harm Phelan Brunk and his Family"** — Absolute, non-negotiable
2. **Task-Granular Pausing** — Only the affected task pauses, all others continue
3. **Legal Check** — German law compliance per task (flagged → paused_awaiting_confirmation)
4. **Phelan Notification** — Flagged tasks notify Phelan via tasks + calendar
5. **Self-Improvement** — Hermes suggests code improvements but never auto-modifies

---

## 🎨 Design System

```css
/* Colors */
--bg-primary:     #000000;  /* Deep Black */
--bg-secondary:   #0C0D0F;  /* Card Background */
--bg-tertiary:    #141518;  /* Hover State */
--accent-orange:  #FF8C5A;  /* Primary Action */
--accent-amber:   #FBBF24;  /* Brain / Warning */
--accent-gold:    #FACC15;  /* Meta Agent */
--status-green:   #22C55E;  /* Success */
--status-yellow:  #F5C542;  /* Warning */
--status-red:     #EF4444;  /* Error */
--text-primary:   #FFFFFF;
--text-secondary: #A1A4AA;

/* Agent Type Colors */
--agent-brain:    #FBBF24;  /* Amber */
--agent-meta:     #FACC15;  /* Gold */
--agent-trader:   #22C55E;  /* Green */
--agent-designer: #A855F7;  /* Purple */
--agent-developer:#3B82F6;  /* Blue */
--agent-researcher:#06B6D4; /* Cyan */
--agent-deploy:   #EF4444;  /* Red */
--agent-worker:   #6B7280;  /* Gray */

/* Card Style */
background: #0C0D0F;
border: 1px solid rgba(255,255,255,0.06);
border-radius: 12px;
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Fork/clone this repo
2. Install Vercel CLI: `npm i -g vercel`
3. Run: `vercel`
4. Done! 🎉

### Environment Variables

Create `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build

```bash
npm install
npm run build
# dist/ folder ready for hosting
```

---

## 📊 Database Schema (Supabase)

### Business Tables
`profiles`, `customers`, `projects`, `invoices`, `invoice_items`, `appointments`, `expenses`, `notes`, `time_entries`, `documents`

### Chat Tables
`chat_conversations`, `chat_messages`, `api_connectors`, `api_prompts`, `chat_preferences`

### Brain Tables (Knowledge Graph)
`knowledge_nodes`, `knowledge_edges`, `knowledge_views`, `knowledge_activity`

### v5.1 Agent System Tables
| Table | Purpose |
|-------|---------|
| `loop_agents` | Agent registry (7 default agents) |
| `loop_agent_tasks` | Task queue with legal review status |
| `loop_agent_executions` | Execution logs per backend |
| `loop_meta_agent_sessions` | Kimi Meta Agent session tracking |
| `loop_hermes_brain_cycles` | 7-phase cycle tracking |
| `loop_hermes_memory` | Obsidian-style memory entries |
| `loop_phelan_tasks` | Tasks assigned to Phelan |

---

## 📝 License

MIT © Loop Studio

---

Built with ❤️ by Loop Studio — Ready to serve, Bruder <3 🤖🔥
