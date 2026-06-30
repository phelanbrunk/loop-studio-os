import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Play,
  Pause,
  Square,
  Settings,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Bell,
  BellDot,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Eye,
  BookOpen,
  Lightbulb,
  ClipboardList,
  Zap,
  GraduationCap,
  X,
  Star,
  Tag,
  User,
  Calendar,
  Activity,
  FileText,
  Lock,
  XCircle,
  Loader2,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// =============================================================================
// TYPES
// =============================================================================

type PhaseStatus = "pending" | "active" | "completed" | "skipped" | "error";
type CycleStatus = "running" | "paused" | "error" | "idle";
type TaskPriority = "urgent" | "high" | "medium" | "low";
type TaskStatus = "pending" | "in_progress" | "completed";
type LegalCheckStatus = "pending" | "approved" | "flagged" | "blocked";
type MemoryEntryType = "observation" | "decision" | "learning" | "plan" | "reflection";
type LogEntryType = "observation" | "action" | "warning" | "error" | "info";
type ImportanceLevel = 1 | 2 | 3 | 4 | 5;

interface PhaseData {
  content: string;
  findings?: string[];
  sources?: { name: string; confidence: number }[];
  reflections?: string[];
  tasks?: GeneratedTask[];
  checks?: SafetyCheck[];
  actions?: ActionItem[];
  learnings?: string[];
  metrics?: Record<string, string | number>;
}

interface Phase {
  number: number;
  name: string;
  status: PhaseStatus;
  icon: React.ReactNode;
  data: PhaseData;
}

interface GeneratedTask {
  id: string;
  title: string;
  priority: TaskPriority;
  agent: string;
  approved: boolean;
}

interface SafetyCheck {
  taskId: string;
  taskTitle: string;
  status: LegalCheckStatus;
  concern?: string;
  phelanAction?: "approve" | "block";
}

interface ActionItem {
  description: string;
  agent: string;
  result: string;
  timestamp: string;
}

interface PhelanTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  notification_sent: boolean;
  notification_read: boolean;
  hermes_reasoning: string;
  created_by: string;
}

interface MemoryEntry {
  id: string;
  entry_type: MemoryEntryType;
  title: string;
  content: string;
  tags: string[];
  source: string;
  cycle_id: number;
  importance: ImportanceLevel;
  created_at: string;
}

interface Cycle {
  cycle_number: number;
  status: CycleStatus;
  phase_observation: PhaseData;
  phase_research: PhaseData;
  phase_reasoning: PhaseData;
  phase_planning: PhaseData;
  phase_validation: PhaseData;
  phase_action: PhaseData;
  phase_learning: PhaseData;
  summary: string;
  tasks_generated: number;
  tasks_completed: number;
  tasks_paused: number;
  phelan_tasks_created: number;
  learnings: string[];
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: LogEntryType;
  message: string;
  phase?: number;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_CYCLE: Cycle = {
  cycle_number: 47,
  status: "running",
  summary:
    "Cycle 47: Detected declining agent performance in research tasks. Implemented optimization protocol. Generated 3 tasks for Phelan review.",
  tasks_generated: 8,
  tasks_completed: 5,
  tasks_paused: 2,
  phelan_tasks_created: 3,
  learnings: [
    "Research agent response time increased 23% over past week",
    "Prioritizing high-impact tasks reduces cycle time by 15%",
    "Validation phase catches 94% of potential issues before action",
  ],
  phase_observation: {
    content:
      "System monitoring detected decreased throughput in research pipeline. 4 tasks queued for >2 hours. Agent 'Nova' showing elevated error rate (12%). Memory usage at 78% capacity.",
    metrics: {
      "Active Agents": 7,
      "Queued Tasks": 4,
      "Avg Response": "2.3s",
      "Error Rate": "4.2%",
      "Memory Use": "78%",
    },
  },
  phase_research: {
    content:
      "Deep analysis of agent performance logs reveals Nova's language model context window is fragmenting on long-running sessions. Similar pattern observed in previous cycle #44.",
    findings: [
      "Nova agent context fragmentation after ~50 turns",
      "Research task queue backing up during peak hours (14:00-16:00 UTC)",
      "Newer GPT-4o-mini model shows 18% better latency",
    ],
    sources: [
      { name: "Agent Performance Logs", confidence: 0.98 },
      { name: "System Metrics DB", confidence: 0.95 },
      { name: "Historical Cycles #40-46", confidence: 0.88 },
    ],
  },
  phase_reasoning: {
    content:
      "The degradation pattern is consistent with context window saturation. Nova requires periodic context resets. The queue bottleneck is addressable by scaling research workers during peak hours. Safety assessment: No risk to Phelan. All actions are system-internal optimizations.",
    reflections: [
      "Context window management needs proactive monitoring",
      "Peak-hour scaling should be automatic, not reactive",
      "Consider implementing agent health check protocol",
    ],
  },
  phase_planning: {
    content: "Generated 8 optimization tasks across 3 workstreams.",
    tasks: [
      { id: "t1", title: "Reset Nova agent context window", priority: "urgent", agent: "System", approved: true },
      { id: "t2", title: "Scale research workers 14:00-16:00 UTC", priority: "high", agent: "AutoScaler", approved: true },
      { id: "t3", title: "Deploy agent health check protocol", priority: "medium", agent: "DevOps", approved: true },
      { id: "t4", title: "Evaluate GPT-4o-mini upgrade for Nova", priority: "medium", agent: "Research", approved: false },
      { id: "t5", title: "Optimize memory garbage collection", priority: "low", agent: "System", approved: true },
      { id: "t6", title: "Review Phelan's pending task queue", priority: "high", agent: "Hermes", approved: true },
      { id: "t7", title: "Archive old memory entries (>30 days)", priority: "low", agent: "System", approved: true },
      { id: "t8", title: "Update safety validation rules v2.3", priority: "high", agent: "Legal", approved: false },
    ],
  },
  phase_validation: {
    content: "Safety validation complete. 6 tasks approved automatically. 2 tasks flagged for Phelan review.",
    checks: [
      { taskId: "t1", taskTitle: "Reset Nova agent context window", status: "approved" },
      { taskId: "t2", taskTitle: "Scale research workers 14:00-16:00 UTC", status: "approved" },
      { taskId: "t3", taskTitle: "Deploy agent health check protocol", status: "approved" },
      { taskId: "t4", taskTitle: "Evaluate GPT-4o-mini upgrade for Nova", status: "flagged", concern: "Model upgrade may change response characteristics. Recommend Phelan review before deployment." },
      { taskId: "t5", taskTitle: "Optimize memory garbage collection", status: "approved" },
      { taskId: "t6", taskTitle: "Review Phelan's pending task queue", status: "approved" },
      { taskId: "t7", taskTitle: "Archive old memory entries (>30 days)", status: "approved" },
      { taskId: "t8", taskTitle: "Update safety validation rules v2.3", status: "flagged", concern: "Legal rule changes require Phelan approval per constitution §4.2. Changes affect harm prevention thresholds." },
    ],
  },
  phase_action: {
    content: "Executed 6 approved tasks. 2 tasks paused awaiting Phelan confirmation.",
    actions: [
      { description: "Reset Nova agent context window", agent: "System", result: "Success - Nova response time improved to 1.2s", timestamp: "2026-01-15T14:32:00Z" },
      { description: "Scale research workers for peak hours", agent: "AutoScaler", result: "Workers scaled from 2→4, queue cleared", timestamp: "2026-01-15T14:33:00Z" },
      { description: "Deployed health check protocol v1", agent: "DevOps", result: "Protocol active, checking every 60s", timestamp: "2026-01-15T14:35:00Z" },
      { description: "Optimized memory garbage collection", agent: "System", result: "Memory usage reduced from 78%→61%", timestamp: "2026-01-15T14:36:00Z" },
      { description: "Reviewed Phelan's pending task queue", agent: "Hermes", result: "3 new tasks generated for Phelan", timestamp: "2026-01-15T14:38:00Z" },
      { description: "Archived 142 old memory entries", agent: "System", result: "Archive complete, DB size reduced 12%", timestamp: "2026-01-15T14:40:00Z" },
    ],
  },
  phase_learning: {
    content: "Cycle learnings processed and stored to memory.",
    learnings: [
      "Context window fragmentation is a recurring pattern - should predict and prevent",
      "Peak-hour auto-scaling reduces queue time by 73%",
      "Health check protocol provides early warning for 89% of agent issues",
      "Phelan prefers reviewing model changes before deployment",
    ],
    metrics: {
      "Cycle Time": "8.2 min",
      "Tasks Processed": 8,
      "Safety Checks Passed": "6/8",
      "Phelan Reviews Needed": 2,
      "Performance Gain": "+18%",
    },
  },
};

const MOCK_PREVIOUS_CYCLES: Cycle[] = [
  {
    cycle_number: 46,
    status: "paused" as CycleStatus,
    phase_observation: { content: "Normal system operations. All agents healthy." },
    phase_research: { content: "No significant findings. Routine maintenance suggested." },
    phase_reasoning: { content: "System stable. Proactive maintenance recommended." },
    phase_planning: { content: "2 maintenance tasks planned." },
    phase_validation: { content: "All checks passed." },
    phase_action: { content: "Maintenance completed." },
    phase_learning: { content: "System stability confirmed." },
    summary: "Routine maintenance cycle. All systems nominal.",
    tasks_generated: 2,
    tasks_completed: 2,
    tasks_paused: 0,
    phelan_tasks_created: 0,
    learnings: ["Proactive maintenance prevents degradation"],
  },
  {
    cycle_number: 45,
    status: "paused" as CycleStatus,
    phase_observation: { content: "Detected memory leak in archive agent." },
    phase_research: { content: "Memory leak traced to unclosed file handles." },
    phase_reasoning: { content: "Fix is straightforward and low-risk." },
    phase_planning: { content: "1 fix task planned." },
    phase_validation: { content: "Fix approved - no Phelan impact." },
    phase_action: { content: "Fix deployed and verified." },
    phase_learning: { content: "File handle management needs review." },
    summary: "Fixed memory leak in archive agent.",
    tasks_generated: 1,
    tasks_completed: 1,
    tasks_paused: 0,
    phelan_tasks_created: 0,
    learnings: ["File handle cleanup is critical for long-running agents"],
  },
  {
    cycle_number: 44,
    status: "paused" as CycleStatus,
    phase_observation: { content: "Nova agent showing first signs of slowdown." },
    phase_research: { content: "Initial investigation inconclusive." },
    phase_reasoning: { content: "May be transient - monitor and observe." },
    phase_planning: { content: "Monitoring enhanced." },
    phase_validation: { content: "All clear." },
    phase_action: { content: "Enhanced monitoring deployed." },
    phase_learning: { content: "Early signs of agent degradation are detectable." },
    summary: "First detection of Nova slowdown. Monitoring enhanced.",
    tasks_generated: 1,
    tasks_completed: 1,
    tasks_paused: 0,
    phelan_tasks_created: 0,
    learnings: ["Early detection of agent degradation is possible"],
  },
];

const MOCK_PHELAN_TASKS: PhelanTask[] = [
  {
    id: "pt1",
    title: "Review GPT-4o-mini upgrade for Nova agent",
    description: "Hermes detected that upgrading Nova to GPT-4o-mini could improve response time by 18%. The upgrade may change response characteristics. Please review and approve or reject.",
    priority: "high",
    status: "pending",
    due_date: "2026-01-16",
    notification_sent: true,
    notification_read: false,
    hermes_reasoning: "Nova's current model is showing performance degradation. GPT-4o-mini offers better latency and cost profile. However, response style changes require Phelan's approval as it affects output quality he relies on.",
    created_by: "Hermes",
  },
  {
    id: "pt2",
    title: "Approve Safety Validation Rules v2.3",
    description: "Hermes drafted updated safety validation rules that refine the harm detection thresholds. Changes affect how tasks are auto-approved vs flagged for review.",
    priority: "urgent",
    status: "pending",
    due_date: "2026-01-16",
    notification_sent: true,
    notification_read: false,
    hermes_reasoning: "Updated safety rules reduce false positive flagging by 30% while maintaining 99.7% safety coverage. This directly improves cycle efficiency without compromising the 'Never Harm Phelan' principle.",
    created_by: "Hermes",
  },
  {
    id: "pt3",
    title: "Review Q1 2026 System Roadmap",
    description: "Hermes compiled a system optimization roadmap based on recent learning patterns. Includes agent upgrades, new safety protocols, and performance enhancements.",
    priority: "medium",
    status: "pending",
    due_date: "2026-01-20",
    notification_sent: true,
    notification_read: true,
    hermes_reasoning: "Based on accumulated learnings from 47 cycles, several system improvements are recommended. Phelan's input on priorities would help sequence the work optimally.",
    created_by: "Hermes",
  },
];

const MOCK_MEMORY_ENTRIES: MemoryEntry[] = [
  {
    id: "m1",
    entry_type: "observation",
    title: "Nova agent context fragmentation pattern",
    content: "After approximately 50 conversational turns, Nova's context window begins fragmenting. This manifests as increased response latency and occasional off-topic responses. Pattern observed across cycles #44-47.",
    tags: ["nova", "performance", "context-window"],
    source: "Cycle #47 Research",
    cycle_id: 47,
    importance: 5,
    created_at: "2026-01-15T14:30:00Z",
  },
  {
    id: "m2",
    entry_type: "decision",
    title: "Auto-scale research workers during peak hours",
    content: "Implemented automatic scaling of research worker agents from 2 to 4 instances during 14:00-16:00 UTC peak period. This reduced average queue wait time from 2.1 hours to 18 minutes.",
    tags: ["scaling", "performance", "automation"],
    source: "Cycle #47 Planning",
    cycle_id: 47,
    importance: 4,
    created_at: "2026-01-15T14:33:00Z",
  },
  {
    id: "m3",
    entry_type: "learning",
    title: "Peak-hour scaling reduces queue time by 73%",
    content: "Data from cycle #47 confirms that proactive scaling during identified peak hours is far more effective than reactive scaling. Queue time reduced by 73% compared to cycle #46 which used reactive scaling.",
    tags: ["scaling", "metrics", "optimization"],
    source: "Cycle #47 Learning",
    cycle_id: 47,
    importance: 4,
    created_at: "2026-01-15T14:45:00Z",
  },
  {
    id: "m4",
    entry_type: "reflection",
    title: "Context management should be proactive",
    content: "Rather than waiting for context fragmentation to degrade performance, we should implement predictive context resets based on turn count and conversation complexity metrics.",
    tags: ["nova", "improvement", "context-window"],
    source: "Cycle #47 Reasoning",
    cycle_id: 47,
    importance: 3,
    created_at: "2026-01-15T14:31:00Z",
  },
  {
    id: "m5",
    entry_type: "plan",
    title: "Agent health check protocol v1",
    content: "Deploy automated health checks every 60 seconds for all active agents. Checks include response time, error rate, memory usage, and output quality scoring.",
    tags: ["health-check", "monitoring", "agents"],
    source: "Cycle #47 Planning",
    cycle_id: 47,
    importance: 4,
    created_at: "2026-01-15T14:35:00Z",
  },
  {
    id: "m6",
    entry_type: "observation",
    title: "Memory usage trending upward over past week",
    content: "Database memory usage has increased from 62% to 78% over the past 7 days. Growth rate suggests capacity limit will be reached in ~14 days without intervention.",
    tags: ["memory", "database", "capacity"],
    source: "Cycle #47 Observation",
    cycle_id: 47,
    importance: 5,
    created_at: "2026-01-15T14:28:00Z",
  },
  {
    id: "m7",
    entry_type: "decision",
    title: "Archive entries older than 30 days",
    content: "Implement automatic archival of memory and log entries older than 30 days to cold storage. This reclaimed 12% of database capacity immediately.",
    tags: ["archival", "storage", "cleanup"],
    source: "Cycle #47 Planning",
    cycle_id: 47,
    importance: 3,
    created_at: "2026-01-15T14:40:00Z",
  },
  {
    id: "m8",
    entry_type: "learning",
    title: "Validation phase catches 94% of issues",
    content: "Across all 47 cycles, the validation phase (Phase 5) has successfully identified and flagged 94% of tasks that required additional review before execution. Only 2 tasks required retroactive corrections.",
    tags: ["validation", "safety", "metrics"],
    source: "Historical Analysis",
    cycle_id: 47,
    importance: 5,
    created_at: "2026-01-15T14:50:00Z",
  },
];

const MOCK_LOG_ENTRIES: LogEntry[] = [
  { id: "l1", timestamp: "2026-01-15T14:28:15Z", type: "observation", message: "System monitoring: Nova agent latency >2s threshold", phase: 1 },
  { id: "l2", timestamp: "2026-01-15T14:28:30Z", type: "info", message: "Phase 1 Observation complete - 5 metrics collected", phase: 1 },
  { id: "l3", timestamp: "2026-01-15T14:29:00Z", type: "observation", message: "Research: Context fragmentation pattern identified in Nova logs", phase: 2 },
  { id: "l4", timestamp: "2026-01-15T14:30:00Z", type: "info", message: "Phase 2 Research complete - 3 findings, 3 sources", phase: 2 },
  { id: "l5", timestamp: "2026-01-15T14:31:00Z", type: "info", message: "Reasoning: Degradation is predictable and preventable", phase: 3 },
  { id: "l6", timestamp: "2026-01-15T14:31:30Z", type: "info", message: "Phase 3 Reasoning complete - 3 reflections generated", phase: 3 },
  { id: "l7", timestamp: "2026-01-15T14:32:00Z", type: "info", message: "Planning: 8 tasks generated across 3 workstreams", phase: 4 },
  { id: "l8", timestamp: "2026-01-15T14:32:30Z", type: "info", message: "Phase 4 Planning complete - awaiting validation", phase: 4 },
  { id: "l9", timestamp: "2026-01-15T14:33:00Z", type: "warning", message: "Validation: 2 tasks flagged for Phelan review (t4, t8)", phase: 5 },
  { id: "l10", timestamp: "2026-01-15T14:33:30Z", type: "warning", message: "Validation: Task t4 - Model upgrade requires Phelan approval", phase: 5 },
  { id: "l11", timestamp: "2026-01-15T14:34:00Z", type: "warning", message: "Validation: Task t8 - Safety rule changes require Phelan approval per constitution", phase: 5 },
  { id: "l12", timestamp: "2026-01-15T14:34:30Z", type: "info", message: "Phase 5 Validation complete - 6 approved, 2 flagged", phase: 5 },
  { id: "l13", timestamp: "2026-01-15T14:35:00Z", type: "action", message: "Action: Reset Nova agent context window - Success", phase: 6 },
  { id: "l14", timestamp: "2026-01-15T14:36:00Z", type: "action", message: "Action: Scale research workers 2→4 - Queue cleared", phase: 6 },
  { id: "l15", timestamp: "2026-01-15T14:37:00Z", type: "action", message: "Action: Deploy health check protocol v1 - Active", phase: 6 },
  { id: "l16", timestamp: "2026-01-15T14:38:00Z", type: "action", message: "Action: Optimize memory GC - Usage 78%→61%", phase: 6 },
  { id: "l17", timestamp: "2026-01-15T14:39:00Z", type: "action", message: "Action: Review Phelan queue - 3 tasks generated", phase: 6 },
  { id: "l18", timestamp: "2026-01-15T14:40:00Z", type: "action", message: "Action: Archive 142 old entries - DB reduced 12%", phase: 6 },
  { id: "l19", timestamp: "2026-01-15T14:41:00Z", type: "info", message: "Phase 6 Action complete - 6 executed, 2 paused", phase: 6 },
  { id: "l20", timestamp: "2026-01-15T14:45:00Z", type: "info", message: "Phase 7 Learning complete - 4 learnings stored", phase: 7 },
  { id: "l21", timestamp: "2026-01-15T14:46:00Z", type: "info", message: "Cycle #47 complete - 8 tasks processed in 8.2 minutes", phase: 7 },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case "urgent": return "bg-red-600 text-white border-red-500";
    case "high": return "bg-orange-600 text-white border-orange-500";
    case "medium": return "bg-yellow-600 text-white border-yellow-500";
    case "low": return "bg-gray-600 text-white border-gray-500";
  }
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "completed": return "text-green-400";
    case "in_progress": return "text-orange-400";
    case "pending": return "text-yellow-400";
  }
}

function getLegalStatusColor(status: LegalCheckStatus): string {
  switch (status) {
    case "approved": return "text-green-400 border-green-500/30 bg-green-500/10";
    case "flagged": return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    case "blocked": return "text-red-400 border-red-500/30 bg-red-500/10";
    case "pending": return "text-gray-400 border-gray-500/30 bg-gray-500/10";
  }
}

function getLogTypeColor(type: LogEntryType): string {
  switch (type) {
    case "observation": return "text-blue-400 border-blue-500/20 bg-blue-500/5";
    case "action": return "text-green-400 border-green-500/20 bg-green-500/5";
    case "warning": return "text-yellow-400 border-yellow-500/20 bg-yellow-500/5";
    case "error": return "text-red-400 border-red-500/20 bg-red-500/5";
    case "info": return "text-gray-400 border-gray-500/20 bg-gray-500/5";
  }
}

function getLogTypeIcon(type: LogEntryType) {
  switch (type) {
    case "observation": return <Eye className="h-3 w-3 text-blue-400" />;
    case "action": return <Zap className="h-3 w-3 text-green-400" />;
    case "warning": return <AlertTriangle className="h-3 w-3 text-yellow-400" />;
    case "error": return <XCircle className="h-3 w-3 text-red-400" />;
    case "info": return <Activity className="h-3 w-3 text-gray-400" />;
  }
}

function getPhaseIconForNumber(num: number) {
  switch (num) {
    case 1: return <Eye className="h-5 w-5" />;
    case 2: return <BookOpen className="h-5 w-5" />;
    case 3: return <Lightbulb className="h-5 w-5" />;
    case 4: return <ClipboardList className="h-5 w-5" />;
    case 5: return <ShieldCheck className="h-5 w-5" />;
    case 6: return <Zap className="h-5 w-5" />;
    case 7: return <GraduationCap className="h-5 w-5" />;
    default: return <Circle className="h-5 w-5" />;
  }
}

function getPhaseStatusIcon(status: PhaseStatus) {
  switch (status) {
    case "active": return <Loader2 className="h-4 w-4 animate-spin text-orange-400" />;
    case "completed": return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    case "pending": return <Clock className="h-4 w-4 text-gray-500" />;
    case "skipped": return <SkipForward className="h-4 w-4 text-gray-600" />;
    case "error": return <XCircle className="h-4 w-4 text-red-400" />;
  }
}

// =============================================================================
// PHASE DETAIL COMPONENTS
// =============================================================================

function ObservationPhase({ data }: { data: PhaseData }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300 leading-relaxed">{data.content}</p>
      {data.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(data.metrics).map(([key, value]) => (
            <Card key={key} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-3">
                <div className="text-xs text-gray-500 mb-1">{key}</div>
                <div className="text-lg font-semibold text-white">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ResearchPhase({ data }: { data: PhaseData }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300 leading-relaxed">{data.content}</p>
      {data.findings && data.findings.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-400" /> Key Findings
          </h4>
          <ul className="space-y-2">
            {data.findings.map((finding, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-orange-400 mt-0.5">•</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.sources && data.sources.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-400" /> Sources
          </h4>
          <div className="space-y-2">
            {data.sources.map((source, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                <span className="text-sm text-gray-300">{source.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                      style={{ width: `${source.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{(source.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReasoningPhase({ data }: { data: PhaseData }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300 leading-relaxed">{data.content}</p>
      {data.reflections && data.reflections.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-400" /> Reflections
          </h4>
          <div className="space-y-2">
            {data.reflections.map((reflection, i) => (
              <div key={i} className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-sm text-gray-300">{reflection}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanningPhase({ data }: { data: PhaseData }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300 leading-relaxed">{data.content}</p>
      {data.tasks && data.tasks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-orange-400" /> Generated Tasks
          </h4>
          <div className="space-y-2">
            {data.tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  <span className="text-sm text-gray-200">{task.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{task.agent}</span>
                  {task.approved ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationPhase({ data }: { data: PhaseData }) {
  const approvedChecks = data.checks?.filter((c) => c.status === "approved") || [];
  const flaggedChecks = data.checks?.filter((c) => c.status === "flagged") || [];
  const blockedChecks = data.checks?.filter((c) => c.status === "blocked") || [];
  const pendingChecks = data.checks?.filter((c) => c.status === "pending") || [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300 leading-relaxed">{data.content}</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{approvedChecks.length}</div>
            <div className="text-xs text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{flaggedChecks.length}</div>
            <div className="text-xs text-gray-500">Flagged</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{blockedChecks.length}</div>
            <div className="text-xs text-gray-500">Blocked</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-500/5 border-gray-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-400">{pendingChecks.length}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Approved Tasks */}
      {approvedChecks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Approved Tasks
          </h4>
          <div className="space-y-1">
            {approvedChecks.map((check) => (
              <div key={check.taskId} className="flex items-center gap-2 bg-green-500/5 border border-green-500/10 rounded-lg p-2">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-sm text-gray-300">{check.taskTitle}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Tasks - CRITICAL */}
      {flaggedChecks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Paused Awaiting Phelan Confirmation
          </h4>
          <div className="space-y-2">
            {flaggedChecks.map((check) => (
              <div key={check.taskId} className="bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
                    <span className="text-sm font-medium text-white">{check.taskTitle}</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                    Flagged
                  </Badge>
                </div>
                {check.concern && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                    <p className="text-xs text-yellow-200/80 flex items-start gap-2">
                      <ShieldAlert className="h-3 w-3 shrink-0 mt-0.5" />
                      {check.concern}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                    <XCircle className="h-3 w-3 mr-1" /> Block
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked Tasks */}
      {blockedChecks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Blocked Tasks
          </h4>
          {blockedChecks.map((check) => (
            <div key={check.taskId} className="flex items-center gap-2 bg-red-500/5 border border-red-500/10 rounded-lg p-2">
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span className="text-sm text-gray-300">{check.taskTitle}</span>
              {check.concern && <span className="text-xs text-red-300">- {check.concern}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionPhase({ data }: { data: PhaseData }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300 leading-relaxed">{data.content}</p>
      {data.actions && data.actions.length > 0 && (
        <div className="space-y-2">
          {data.actions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-900/50 border border-gray-800 rounded-lg p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-gray-200">{action.description}</span>
                </div>
                <span className="text-xs text-gray-600">{formatTime(action.timestamp)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-gray-500 border-gray-700">
                  {action.agent}
                </Badge>
                <span className="text-xs text-green-400">→ {action.result}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function LearningPhase({ data }: { data: PhaseData }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-300 leading-relaxed">{data.content}</p>
      {data.learnings && data.learnings.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-orange-400" /> Key Learnings
          </h4>
          <div className="space-y-2">
            {data.learnings.map((learning, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3"
              >
                <p className="text-sm text-gray-300 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                  {learning}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {data.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(data.metrics).map(([key, value]) => (
            <Card key={key} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-3">
                <div className="text-xs text-gray-500 mb-1">{key}</div>
                <div className="text-lg font-semibold text-white">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HermesBrain() {
  const [cycle, setCycle] = useState<Cycle>(MOCK_CYCLE);
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [cycleStatus, setCycleStatus] = useState<CycleStatus>(MOCK_CYCLE.status);
  const [logFilter, setLogFilter] = useState<LogEntryType | "all">("all");
  const [memoryFilter, setMemoryFilter] = useState<MemoryEntryType | "all">("all");
  const [memorySearch, setMemorySearch] = useState("");
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const logScrollRef = useRef<HTMLDivElement>(null);

  const unreadCount = MOCK_PHELAN_TASKS.filter((t) => !t.notification_read && !readNotifications.has(t.id)).length;

  const phases: Phase[] = [
    { number: 1, name: "Observation", status: "completed", icon: getPhaseIconForNumber(1), data: cycle.phase_observation },
    { number: 2, name: "Research", status: "completed", icon: getPhaseIconForNumber(2), data: cycle.phase_research },
    { number: 3, name: "Reasoning", status: "completed", icon: getPhaseIconForNumber(3), data: cycle.phase_reasoning },
    { number: 4, name: "Planning", status: "completed", icon: getPhaseIconForNumber(4), data: cycle.phase_planning },
    { number: 5, name: "Validation", status: "active", icon: getPhaseIconForNumber(5), data: cycle.phase_validation },
    { number: 6, name: "Action", status: "pending", icon: getPhaseIconForNumber(6), data: cycle.phase_action },
    { number: 7, name: "Learning", status: "pending", icon: getPhaseIconForNumber(7), data: cycle.phase_learning },
  ];

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, []);

  const filteredLog = MOCK_LOG_ENTRIES.filter((entry) => logFilter === "all" || entry.type === logFilter);

  const filteredMemory = MOCK_MEMORY_ENTRIES.filter((entry) => {
    const matchesType = memoryFilter === "all" || entry.entry_type === memoryFilter;
    const matchesSearch =
      memorySearch === "" ||
      entry.title.toLowerCase().includes(memorySearch.toLowerCase()) ||
      entry.content.toLowerCase().includes(memorySearch.toLowerCase()) ||
      entry.tags.some((t) => t.toLowerCase().includes(memorySearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  function handleMarkRead(taskId: string) {
    setReadNotifications((prev) => new Set(prev).add(taskId));
  }

  function handleStartCycle() {
    setCycleStatus("running");
  }

  function handlePauseCycle() {
    setCycleStatus(cycleStatus === "paused" ? "running" : "paused");
  }

  function handleStopCycle() {
    setCycleStatus("idle");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
        {/* ================================================================ */}
        {/* PAGE HEADER */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Top row: Title + Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Brain className="h-10 w-10 text-orange-500" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-orange-500/20"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Hermes Brain</h1>
                <p className="text-sm text-gray-400">Autonomous Intelligence Loop — 7 Phase Cycle</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Never Harm Badge */}
              <Badge className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 font-semibold border-red-500">
                <Shield className="h-4 w-4 mr-1" />
                Never Harm Phelan Brunk
              </Badge>

              {/* Status */}
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
                <div className="relative">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      cycleStatus === "running"
                        ? "bg-green-500"
                        : cycleStatus === "paused"
                          ? "bg-yellow-500"
                          : cycleStatus === "error"
                            ? "bg-red-500"
                            : "bg-gray-500"
                    }`}
                  />
                  {cycleStatus === "running" && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-green-500"
                      animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
                <span className="text-sm text-gray-300 capitalize">{cycleStatus}</span>
              </div>

              {/* Cycle Counter */}
              <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-sm px-3 py-1.5">
                Cycle #{cycle.cycle_number}
              </Badge>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleStartCycle}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="h-4 w-4 mr-1" /> Start Cycle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePauseCycle}
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Pause className="h-4 w-4 mr-1" /> {cycleStatus === "paused" ? "Resume" : "Pause"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopCycle}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Square className="h-4 w-4 mr-1" /> Stop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSettings(!showSettings)}
                  className="border-gray-700 text-gray-400 hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {/* Notification Bell */}
              <Button size="sm" variant="outline" className="border-gray-700 text-gray-400 hover:bg-gray-800 relative">
                {unreadCount > 0 ? (
                  <>
                    <BellDot className="h-4 w-4 text-orange-400" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                      {unreadCount}
                    </span>
                  </>
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Cycle Settings</h3>
                      <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Auto-start cycles</label>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-5 bg-orange-500 rounded-full relative cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                          </div>
                          <span className="text-xs text-gray-400">Enabled</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Cycle interval (min)</label>
                        <Input defaultValue="10" className="bg-gray-800 border-gray-700 text-white h-8" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Validation strictness</label>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: "85%" }} />
                          </div>
                          <span className="text-xs text-gray-400">High</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ================================================================ */}
        {/* SAFETY DASHBOARD */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-400" />
                    <div>
                      <div className="text-xs text-gray-500">Safety Rule</div>
                      <div className="text-sm font-medium text-green-400">Never Harm Phelan — Active</div>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-8 bg-gray-800 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-green-400" />
                    <div>
                      <div className="text-xs text-gray-500">Legal Compliance</div>
                      <div className="text-sm font-medium text-green-400">100% — All Clear</div>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-8 bg-gray-800 hidden md:block" />
                  <div className="flex items-center gap-2">
                    {cycle.tasks_paused > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    )}
                    <div>
                      <div className="text-xs text-gray-500">Paused Tasks</div>
                      <div className={`text-sm font-medium ${cycle.tasks_paused > 0 ? "text-yellow-400" : "text-green-400"}`}>
                        {cycle.tasks_paused} awaiting Phelan
                      </div>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-8 bg-gray-800 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-400" />
                    <div>
                      <div className="text-xs text-gray-500">Constitution Score</div>
                      <div className="text-sm font-medium text-orange-400">98.7%</div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  Last safety check: {formatTime("2026-01-15T14:34:30Z")}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ================================================================ */}
        {/* 7-PHASE PIPELINE */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Phase Pipeline
          </h2>

          {/* Horizontal Pipeline - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {phases.map((phase, index) => (
              <div key={phase.number} className="flex items-center gap-2 flex-1">
                <motion.div
                  className={`relative flex-1 rounded-xl border-2 cursor-pointer transition-colors ${
                    phase.status === "active"
                      ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                      : phase.status === "completed"
                        ? "border-green-500/50 bg-green-500/5"
                        : phase.status === "skipped"
                          ? "border-gray-700 bg-gray-900/30 opacity-60"
                          : "border-gray-800 bg-gray-900/50"
                  }`}
                  onClick={() => setSelectedPhase(selectedPhase === phase.number ? null : phase.number)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  {phase.status === "active" && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-orange-400"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <div className="p-3 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          phase.status === "active"
                            ? "border-orange-500/50 text-orange-400"
                            : phase.status === "completed"
                              ? "border-green-500/50 text-green-400"
                              : "border-gray-700 text-gray-500"
                        }`}
                      >
                        {phase.number}
                      </Badge>
                      {getPhaseStatusIcon(phase.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={phase.status === "active" ? "text-orange-400" : "text-gray-400"}>
                        {phase.icon}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          phase.status === "active" ? "text-orange-300" : phase.status === "completed" ? "text-green-300" : "text-gray-400"
                        }`}
                      >
                        {phase.name}
                      </span>
                    </div>
                    {phase.data.content && (
                      <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                        {phase.data.content}
                      </p>
                    )}
                    {phase.status === "active" && (
                      <div className="mt-2">
                        <Progress value={65} className="h-1 bg-gray-800" />
                      </div>
                    )}
                  </div>
                </motion.div>
                {index < phases.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-700 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Vertical Pipeline - Mobile */}
          <div className="lg:hidden space-y-2">
            {phases.map((phase, index) => (
              <div key={phase.number} className="flex items-center gap-2">
                <motion.div
                  className={`flex-1 rounded-xl border-2 cursor-pointer ${
                    phase.status === "active"
                      ? "border-orange-500 bg-orange-500/10"
                      : phase.status === "completed"
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-gray-800 bg-gray-900/50"
                  }`}
                  onClick={() => setSelectedPhase(selectedPhase === phase.number ? null : phase.number)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-3 flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center h-10 w-10 rounded-lg ${
                        phase.status === "active"
                          ? "bg-orange-500/20 text-orange-400"
                          : phase.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      {phase.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{phase.icon}</span>
                        <span className="text-sm font-medium text-white">{phase.name}</span>
                        {getPhaseStatusIcon(phase.status)}
                      </div>
                      {phase.data.content && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{phase.data.content}</p>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-600 transition-transform ${
                        selectedPhase === phase.number ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Inline Phase Detail for Mobile */}
                  <AnimatePresence>
                    {selectedPhase === phase.number && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 border-t border-gray-800 pt-3">
                          <PhaseDetailContent phase={phase} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ================================================================ */}
        {/* PHASE DETAIL PANEL (Desktop) */}
        {/* ================================================================ */}
        <AnimatePresence>
          {selectedPhase !== null && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden hidden lg:block"
            >
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-orange-400">
                        {phases.find((p) => p.number === selectedPhase)?.icon}
                      </span>
                      Phase {selectedPhase} — {phases.find((p) => p.number === selectedPhase)?.name}
                      <Badge
                        variant="outline"
                        className={
                          phases.find((p) => p.number === selectedPhase)?.status === "completed"
                            ? "border-green-500/50 text-green-400"
                            : phases.find((p) => p.number === selectedPhase)?.status === "active"
                              ? "border-orange-500/50 text-orange-400"
                              : "border-gray-700 text-gray-500"
                        }
                      >
                        {phases.find((p) => p.number === selectedPhase)?.status}
                      </Badge>
                    </CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedPhase(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <PhaseDetailContent phase={phases.find((p) => p.number === selectedPhase)!} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================ */}
        {/* PHELAN TASKS SECTION */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Tasks for Phelan
            {unreadCount > 0 && (
              <Badge className="bg-red-600 text-white text-xs">{unreadCount} new</Badge>
            )}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {MOCK_PHELAN_TASKS.map((task, index) => {
              const isRead = task.notification_read || readNotifications.has(task.id);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card
                    className={`bg-gray-950 border-gray-800 hover:border-gray-700 transition-colors ${
                      !isRead ? "ring-1 ring-orange-500/30" : ""
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          {!isRead && <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-sm font-semibold text-white">{task.title}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                      </div>

                      {/* Hermes Reasoning */}
                      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="h-3 w-3 text-orange-400" />
                          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                            Hermes Reasoning
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{task.hermes_reasoning}</p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          {task.created_by}
                        </div>
                        <div className="flex gap-2">
                          {!isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-700 text-gray-400 hover:bg-gray-800 h-7 text-xs"
                              onClick={() => handleMarkRead(task.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" /> Mark Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ================================================================ */}
        {/* MEMORY VIEWER */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-orange-500" />
              Memory Viewer
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search memory..."
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  className="pl-9 bg-gray-900 border-gray-800 text-white h-8 text-sm w-full sm:w-64"
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white h-8">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-orange-500" />
                      Add Memory Entry
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Title</label>
                      <Input className="bg-gray-900 border-gray-800 text-white" placeholder="Entry title..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Type</label>
                      <div className="flex gap-2">
                        {(["observation", "decision", "learning", "plan", "reflection"] as MemoryEntryType[]).map(
                          (type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className="cursor-pointer border-gray-700 text-gray-400 hover:border-orange-500 hover:text-orange-400 capitalize"
                            >
                              {type}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Content</label>
                      <Textarea
                        className="bg-gray-900 border-gray-800 text-white min-h-[100px]"
                        placeholder="Enter memory content..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Tags (comma-separated)</label>
                      <Input className="bg-gray-900 border-gray-800 text-white" placeholder="tag1, tag2, tag3..." />
                    </div>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-1" /> Create Entry
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={memoryFilter} onValueChange={(v) => setMemoryFilter(v as MemoryEntryType | "all")}>
            <TabsList className="bg-gray-900 border border-gray-800">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="observation" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Observations
              </TabsTrigger>
              <TabsTrigger value="decision" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Decisions
              </TabsTrigger>
              <TabsTrigger value="learning" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Learnings
              </TabsTrigger>
              <TabsTrigger value="plan" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Plans
              </TabsTrigger>
              <TabsTrigger value="reflection" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Reflections
              </TabsTrigger>
            </TabsList>

            <TabsContent value={memoryFilter} className="mt-4">
              <div className="space-y-2">
                {filteredMemory.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">No memory entries found.</div>
                )}
                {filteredMemory.map((entry) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Card
                      className="bg-gray-950 border-gray-800 hover:border-gray-700 cursor-pointer transition-colors"
                      onClick={() => setExpandedMemory(expandedMemory === entry.id ? null : entry.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className="text-[10px] capitalize border-gray-700 text-gray-400"
                              >
                                {entry.entry_type}
                              </Badge>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < entry.importance ? "text-yellow-400 fill-yellow-400" : "text-gray-700"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <h4 className="text-sm font-medium text-white">{entry.title}</h4>
                            <p
                              className={`text-xs text-gray-400 mt-1 ${
                                expandedMemory === entry.id ? "" : "line-clamp-1"
                              }`}
                            >
                              {entry.content}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] text-gray-600">{formatDate(entry.created_at)}</span>
                            <span className="text-[10px] text-gray-600">Cycle #{entry.cycle_id}</span>
                          </div>
                        </div>
                        <AnimatePresence>
                          {expandedMemory === entry.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 mt-3 border-t border-gray-800">
                                <p className="text-sm text-gray-300 leading-relaxed">{entry.content}</p>
                                <div className="flex items-center gap-2 mt-3">
                                  <span className="text-xs text-gray-500">Source: {entry.source}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-2">
                                  <Tag className="h-3 w-3 text-gray-600" />
                                  {entry.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-[10px] border-gray-700 text-gray-500"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="flex justify-center mt-2">
                          {expandedMemory === entry.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* ================================================================ */}
        {/* LIVE ACTIVITY LOG */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Live Activity Log
              <span className="text-xs text-gray-500 font-normal">— Cycle #{cycle.cycle_number}</span>
            </h2>
            <div className="flex items-center gap-1 flex-wrap">
              {(["all", "observation", "action", "warning", "error", "info"] as const).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={logFilter === type ? "default" : "outline"}
                  onClick={() => setLogFilter(type)}
                  className={`h-7 text-xs capitalize ${
                    logFilter === type
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "border-gray-700 text-gray-400 hover:bg-gray-800"
                  }`}
                >
                  {type === "all" && <Activity className="h-3 w-3 mr-1" />}
                  {type}
                  {type !== "all" && (
                    <span className="ml-1 text-[10px] opacity-60">
                      {MOCK_LOG_ENTRIES.filter((e) => e.type === type).length}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Card className="bg-gray-950 border-gray-800">
            <ScrollArea className="h-80" ref={logScrollRef}>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {filteredLog.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.01 }}
                      className={`flex items-start gap-3 px-4 py-2 border-b border-gray-900 ${getLogTypeColor(entry.type)}`}
                    >
                      <div className="flex items-center gap-2 shrink-0 w-20">
                        {getLogTypeIcon(entry.type)}
                        <span className="text-[10px] text-gray-500">{formatTime(entry.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-16">
                        <Badge variant="outline" className="text-[9px] border-gray-700 text-gray-600 px-1">
                          P{entry.phase}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-300">{entry.message}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        </motion.div>

        {/* ================================================================ */}
        {/* CYCLE SUMMARY FOOTER */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Cycle #{cycle.cycle_number} Summary</h3>
                  <p className="text-xs text-gray-400 mt-1">{cycle.summary}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-400">{cycle.tasks_generated}</div>
                    <div className="text-[10px] text-gray-500">Generated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{cycle.tasks_completed}</div>
                    <div className="text-[10px] text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">{cycle.tasks_paused}</div>
                    <div className="text-[10px] text-gray-500">Paused</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{cycle.phelan_tasks_created}</div>
                    <div className="text-[10px] text-gray-500">For Phelan</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// PHASE DETAIL CONTENT ROUTER
// =============================================================================

function PhaseDetailContent({ phase }: { phase: Phase }) {
  switch (phase.number) {
    case 1:
      return <ObservationPhase data={phase.data} />;
    case 2:
      return <ResearchPhase data={phase.data} />;
    case 3:
      return <ReasoningPhase data={phase.data} />;
    case 4:
      return <PlanningPhase data={phase.data} />;
    case 5:
      return <ValidationPhase data={phase.data} />;
    case 6:
      return <ActionPhase data={phase.data} />;
    case 7:
      return <LearningPhase data={phase.data} />;
    default:
      return <p className="text-sm text-gray-400">No data available for this phase.</p>;
  }
}