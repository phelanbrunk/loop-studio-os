# 🧠 Loop Studio OS

> **Das Business-Dashboard für deine Webdesign-Agentur** — mit lebendigem Knowledge Graph Brain, AI Chat, und API Connector.

![Version](https://img.shields.io/badge/version-3.0.0-orange)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Brain-3ECF8E?logo=supabase)

---

## 🚀 Live Demo

**🔗 [loop-studio-os.vercel.app](https://loop-studio-os.vercel.app)** (Vercel)

---

## ✨ Features

### 📊 9 Dashboard-Seiten

| Seite | Route | Beschreibung |
|-------|-------|-------------|
| **Dashboard** | `/` | KPIs, Revenue Chart, Termine, Projekte, Kunden |
| **🧠 Brain** | `/brain` | **Knowledge Graph** — neuronales Netzwerk aller Daten |
| **Kunden** | `/kunden` | Kundenverwaltung mit Search, Filter, Detail-Modals |
| **Websites** | `/websites` | Website-Projekte Galerie mit Status-Tracking |
| **Projekte** | `/projekte` | Kanban-Board mit Drag & Drop (@dnd-kit) |
| **Kalender** | `/kalender` | Month/Week/Agenda Views mit Event-Management |
| **Verdienst** | `/verdienst` | Finanz-Dashboard mit Charts (Recharts) |
| **Rechnungen** | `/rechnungen` | Invoice Management mit Auto-Calc |
| **Chat** | `/chat` | AI Chat mit API Connector Panel |

### 🧠 Knowledge Graph Brain

- **Canvas 2D Force-Directed Graph** — eigene Physik-Engine
- **20 Knoten-Typen**: Projekte, Kunden, Notizen, Ideen, Tasks, Milestones...
- **4 Layout-Modes**: Force-Directed, Circular, Grid, Hierarchical
- **Zoom / Pan / Drag** — volle Canvas-Interaktion
- **Detail-Panel** — Knoten bearbeiten, verknüpfen, analysieren
- **Search & Filter** — Echtzeit-Suche im Graphen

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
| **Drag & Drop** | @dnd-kit |
| **Dates** | date-fns |
| **Icons** | Lucide React |
| **Brain** | HTML5 Canvas 2D (pure, no library) |
| **Backend** | Supabase (Postgres, Auth, Realtime) |
| **Hosting** | Vercel |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                 Vercel (Hosting)                 │
│              React SPA (Static)                  │
└────────────────────────┬────────────────────────┘
                         │
┌────────────────────────▼────────────────────────┐
│              Supabase (The Brain)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Auth    │  │ Postgres │  │   Realtime   │ │
│  │ (Users)  │  │ (Tables) │  │  (Live Data) │ │
│  └──────────┘  └────┬─────┘  └──────────────┘ │
│                     │                           │
│  ┌──────────────────┼───────────────────────┐  │
│  │  Business Tables │  Knowledge Graph      │  │
│  │  • customers     │  • knowledge_nodes    │  │
│  │  • projects      │  • knowledge_edges    │  │
│  │  • invoices      │  • knowledge_views    │  │
│  │  • appointments  │  • knowledge_activity │  │
│  │  • expenses      │                       │  │
│  │  • notes         │  Auto-triggers:       │  │
│  │  • time_entries  │  • customer→node      │  │
│  │  • documents     │  • project→node       │  │
│  │  • chat_*        │  • neighborhood()     │  │
│  │  • api_*         │  • brain_stats()      │  │
│  └──────────────────┴───────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
loop-studio-os/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # App shell (sidebar + content)
│   │   ├── Sidebar.tsx         # 260px nav sidebar
│   │   ├── TopBar.tsx          # Glassmorphism top bar
│   │   └── ui/                 # 40+ shadcn/ui components
│   ├── pages/
│   │   ├── Dashboard.tsx       # KPIs + Charts
│   │   ├── Brain.tsx           # 🧠 Knowledge Graph (1,301 lines)
│   │   ├── Kunden.tsx          # Customer management
│   │   ├── Websites.tsx        # Website projects
│   │   ├── Projekte.tsx        # Kanban board
│   │   ├── Kalender.tsx        # Calendar (month/week/agenda)
│   │   ├── Verdienst.tsx       # Earnings tracker
│   │   ├── Rechnungen.tsx      # Invoice management
│   │   └── Chat.tsx            # AI Chat + API connector
│   ├── hooks/
│   │   ├── useAuth.ts          # Supabase auth
│   │   └── useSupabaseQuery.ts # Data fetching
│   ├── lib/
│   │   └── supabase.ts         # Supabase client
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Routes
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles + dark theme
├── public/
├── index.html                  # Google Fonts
├── tailwind.config.js          # Custom colors + fonts
├── vite.config.ts
└── package.json
```

---

## 🎨 Design System

```css
/* Colors */
--bg-primary:     #000000;  /* Deep Black */
--bg-secondary:   #0C0D0F;  /* Card Background */
--bg-tertiary:    #141518;  /* Hover State */
--bg-quaternary:  #1B1D20;  /* Input Background */
--accent-orange:  #FF8C5A;  /* Primary Action */
--accent-purple:  #B98BFF;  /* Secondary Accent */
--status-teal:    #36CFC9;  /* Success/Live */
--status-yellow:  #F5C542;  /* Warning/Review */
--status-red:     #EF4444;  /* Error/Urgent */
--text-primary:   #FFFFFF;
--text-secondary: #A1A4AA;
--text-muted:     #5E626A;

/* Typography */
font-display: "Space Grotesk";  /* Headlines */
font-body:    "DM Sans";        /* Body text */
font-mono:    "IBM Plex Mono";  /* Numbers/Code */

/* Card Style */
background: #0C0D0F;
border: 1px solid rgba(255,255,255,0.06);
border-radius: 12px;

/* Glassmorphism */
background: rgba(12, 13, 15, 0.8);
backdrop-filter: blur(20px) saturate(180%);
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

## 🧠 Knowledge Graph Node Types

| Type | Color | Icon | Description |
|------|-------|------|-------------|
| `project` | 🟠 Orange | Layers | Website projects |
| `client` | 🩵 Teal | Users | Customers |
| `note` | ⚪ White | StickyNote | General notes |
| `idea` | 🟣 Purple | Lightbulb | Ideas & brainstorming |
| `task` | 🟡 Yellow | CheckSquare | Tasks & todos |
| `document` | ⚫ Gray | FileText | Contracts & files |
| `resource` | 🟢 Green | FolderOpen | Tools & resources |
| `milestone` | 🔴 Red | Flag | Key milestones |
| `meeting` | 🔵 Blue | CalendarDays | Meetings |
| `website` | 🟠 Orange | Globe | Websites |

---

## 🔌 API Integration

The Chat page supports connecting external APIs:
- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude)
- **Custom** (any OpenAI-compatible endpoint)
- **Webhook** (Zapier, Make, etc.)

Configure via the "API verbinden" panel in the Chat.

---

## 📊 Database Schema (Supabase)

### Business Tables
- `profiles`, `customers`, `projects`, `invoices`, `invoice_items`
- `appointments`, `expenses`, `notes`, `time_entries`, `documents`

### Chat Tables
- `chat_conversations`, `chat_messages`, `api_connectors`, `api_prompts`

### Brain Tables (Knowledge Graph)
- `knowledge_nodes` — the neurons
- `knowledge_edges` — the synapses
- `knowledge_views` — saved perspectives
- `knowledge_activity` — audit log

### Auto-Triggers
- Customer created → Node created
- Project created → Node created
- `get_node_neighborhood(node_id)` — 1-hop connections
- `get_brain_stats(user_id)` — dashboard metrics

---

## 📝 License

MIT © Loop Studio

---

Built with ❤️ by Loop Studio
