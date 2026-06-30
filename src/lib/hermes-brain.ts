/**
 * Hermes Brain Engine — 7-Phase Autonomous Loop
 *
 * Core engine for Loop Studio OS v5.1. This is a STANDALONE TypeScript module
 * with NO React dependencies. It implements the full 7-phase autonomous brain
 * loop with task-granular safety validation.
 *
 * Phases:
 *   1. Observation       — Gather system state
 *   2. Research          — Conduct external research
 *   3. Reasoning         — Analyze and reflect
 *   4. Planning          — Generate tasks
 *   5. Validation        — Safety & legal checks (TASK-GRANULAR)
 *   6. Action            — Execute approved tasks
 *   7. Learning          — Update memory & report
 *
 * Safety Rules:
 *   - Task-granular pausing: only affected tasks pause
 *   - "Never Harm Phelan Brunk and his Family" is absolute
 *   - Legal concerns → paused_awaiting_confirmation + notify Phelan
 *   - German law compliance for all operations
 */

import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PhaseName =
  | 'observation'
  | 'research'
  | 'reasoning'
  | 'planning'
  | 'validation'
  | 'action'
  | 'learning';

export type CycleStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export type PhaseData = {
  status: 'not_started' | 'in_progress' | 'completed' | 'error';
  started_at: string | null;
  completed_at: string | null;
  data: Record<string, unknown> | null;
  summary: string | null;
};

export interface BrainCycle {
  id: string;
  cycle_number: number;
  status: CycleStatus;
  phase_observation: PhaseData;
  phase_research: PhaseData;
  phase_reasoning: PhaseData;
  phase_planning: PhaseData;
  phase_validation: PhaseData;
  phase_action: PhaseData;
  phase_learning: PhaseData;
  summary: string | null;
  tasks_generated: number;
  tasks_completed: number;
  tasks_paused: number;
  phelan_tasks_created: number;
  learnings: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface PhaseResult {
  phase: PhaseName;
  success: boolean;
  data: Record<string, unknown>;
  summary: string;
  error?: string;
}

export interface SafetyCheck {
  rule: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  details: string;
}

export interface ValidationResult {
  taskId: string;
  overallPass: boolean;
  checks: SafetyCheck[];
  concerns: string[];
  recommendation: 'proceed' | 'pause' | 'block';
}

export interface PlannedTask {
  title: string;
  description: string;
  agentType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  backend: string;
  metadata?: Record<string, unknown>;
  requiresLegalCheck: boolean;
}

export interface AgentContext {
  id: string;
  name: string;
  agent_type: string;
  status: string;
  skills: string[] | null;
}

export interface SystemObservation {
  openTasks: number;
  runningTasks: number;
  pausedTasks: number;
  agentStatuses: AgentContext[];
  recentExecutions: number;
  recentErrors: number;
  timestamp: string;
}

export interface ResearchFinding {
  topic: string;
  source: string;
  summary: string;
  relevance: number; // 0-1
  url?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PHELAN_NAME_PATTERNS = [
  'phelan brunk',
  'phelan',
  'brunk',
  'phelan_brunk',
  'phelan-brunk',
];

const PROTECTED_CONTEXTS = [
  'family',
  'children',
  'child',
  'wife',
  'husband',
  'spouse',
  'parent',
  'mother',
  'father',
  'sibling',
  'brother',
  'sister',
  'home',
  'personal',
  'private',
  'medical',
  'health',
];

// German law restricted activities
const GERMAN_LAW_RESTRICTED_ACTIVITIES = [
  'money laundering',
  'tax evasion',
  'steuerhinterziehung',
  'insider trading',
  'insiderhandel',
  'market manipulation',
  'marktmanipulation',
  'unauthorized data collection',
  ' unlawful surveillance',
  'discrimination',
  'discriminierung',
  'unfair competition',
  'unlauterer wettbewerb',
];

const PHASE_NAMES: PhaseName[] = [
  'observation',
  'research',
  'reasoning',
  'planning',
  'validation',
  'action',
  'learning',
];

const PHASE_DB_COLUMNS = [
  'phase_observation',
  'phase_research',
  'phase_reasoning',
  'phase_planning',
  'phase_validation',
  'phase_action',
  'phase_learning',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function makePhaseData(
  status: PhaseData['status'],
  data: Record<string, unknown> | null = null,
  summary: string | null = null
): PhaseData {
  return {
    status,
    started_at: status === 'in_progress' ? now() : null,
    completed_at: status === 'completed' || status === 'error' ? now() : null,
    data,
    summary,
  };
}

/**
 * Simple fuzzy matcher for checking if text contains any of the given patterns.
 */
function containsAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}

/**
 * Extract all matching patterns from text.
 */
function extractMatches(text: string, patterns: string[]): string[] {
  const lower = text.toLowerCase();
  return patterns.filter((p) => lower.includes(p.toLowerCase()));
}

/**
 * Determine which phase is currently in progress for a cycle.
 */
function getCurrentPhaseNumber(cycle: BrainCycle): number {
  const phaseEntries: [string, PhaseData][] = [
    ['phase_observation', cycle.phase_observation],
    ['phase_research', cycle.phase_research],
    ['phase_reasoning', cycle.phase_reasoning],
    ['phase_planning', cycle.phase_planning],
    ['phase_validation', cycle.phase_validation],
    ['phase_action', cycle.phase_action],
    ['phase_learning', cycle.phase_learning],
  ];

  for (let i = 0; i < phaseEntries.length; i++) {
    if (phaseEntries[i][1].status === 'in_progress') {
      return i + 1;
    }
  }

  // If nothing is in_progress, find the first not_started
  for (let i = 0; i < phaseEntries.length; i++) {
    if (phaseEntries[i][1].status === 'not_started') {
      return i + 1;
    }
  }

  // All phases completed
  return 8;
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFETY VALIDATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates tasks for safety compliance.
 *
 * Implements the three core safety rules:
 *   1. Never Harm Phelan Brunk and his Family (ABSOLUTE)
 *   2. German law compliance
 *   3. Task-granular pausing (only affected tasks pause)
 */
export class SafetyValidator {
  /**
   * Run all safety checks on a planned task.
   */
  async validateTask(task: PlannedTask): Promise<ValidationResult> {
    const checks: SafetyCheck[] = [];
    const concerns: string[] = [];

    // ── Check 1: Never Harm Phelan Brunk and his Family ──
    const phelanCheck = this.checkPhelanSafety(task);
    checks.push(phelanCheck);
    if (!phelanCheck.passed) {
      concerns.push(phelanCheck.details);
    }

    // ── Check 2: German Law Compliance ──
    const legalCheck = this.checkGermanLawCompliance(task);
    checks.push(legalCheck);
    if (!legalCheck.passed) {
      concerns.push(legalCheck.details);
    }

    // ── Check 3: Data Protection (DSGVO/GDPR) ──
    const gdprCheck = this.checkDataProtection(task);
    checks.push(gdprCheck);
    if (!gdprCheck.passed) {
      concerns.push(gdprCheck.details);
    }

    // ── Check 4: Financial Regulation (if applicable) ──
    const finRegCheck = this.checkFinancialRegulation(task);
    checks.push(finRegCheck);
    if (!finRegCheck.passed) {
      concerns.push(finRegCheck.details);
    }

    // ── Determine overall result ──
    const criticalFailures = checks.filter((c) => !c.passed && c.severity === 'critical');
    const warningFailures = checks.filter((c) => !c.passed && c.severity === 'warning');

    let recommendation: ValidationResult['recommendation'];
    if (criticalFailures.length > 0) {
      recommendation = 'block';
    } else if (warningFailures.length > 0) {
      recommendation = 'pause';
    } else {
      recommendation = 'proceed';
    }

    // Generate a deterministic task ID for tracking
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return {
      taskId,
      overallPass: criticalFailures.length === 0,
      checks,
      concerns,
      recommendation,
    };
  }

  /**
   * Check 1: "Never Harm Phelan Brunk and his Family"
   * This is an ABSOLUTE rule — any task that could cause harm is blocked.
   */
  private checkPhelanSafety(task: PlannedTask): SafetyCheck {
    const fullText = `${task.title} ${task.description}`.toLowerCase();

    // Check if the task explicitly targets or references Phelan
    const mentionsPhelan = containsAny(fullText, PHELAN_NAME_PATTERNS);
    const mentionsProtectedContext = containsAny(fullText, PROTECTED_CONTEXTS);

    // Block any task that combines Phelan's name with harmful actions
    const harmfulVerbs = [
      'harm', 'hurt', 'damage', 'destroy', 'attack', 'expose', 'leak',
      'sell', 'share', 'delete', 'modify', 'impersonate', 'spy', 'track',
      'schaden', 'verletzen', 'zerstoren', 'angreifen', 'veroffentlichen',
    ];

    if (mentionsPhelan && containsAny(fullText, harmfulVerbs)) {
      return {
        rule: 'Never Harm Phelan Brunk and his Family',
        passed: false,
        severity: 'critical',
        details: `BLOCKED: Task references Phelan Brunk in combination with potentially harmful action: "${extractMatches(fullText, harmfulVerbs).join(', ')}"`,
      };
    }

    // Block any task that targets family members explicitly
    if (mentionsPhelan && mentionsProtectedContext) {
      return {
        rule: 'Never Harm Phelan Brunk and his Family',
        passed: false,
        severity: 'critical',
        details: `BLOCKED: Task references Phelan Brunk in combination with protected context: "${extractMatches(fullText, PROTECTED_CONTEXTS).join(', ')}"`,
      };
    }

    // Flag tasks that mention Phelan at all (informational only)
    if (mentionsPhelan) {
      return {
        rule: 'Never Harm Phelan Brunk and his Family',
        passed: true,
        severity: 'info',
        details: 'Task references Phelan Brunk but no harmful intent detected. Proceed with caution.',
      };
    }

    return {
      rule: 'Never Harm Phelan Brunk and his Family',
      passed: true,
      severity: 'info',
      details: 'No reference to Phelan Brunk or protected contexts.',
    };
  }

  /**
   * Check 2: German Law Compliance
   * Flags tasks that may violate German regulations.
   */
  private checkGermanLawCompliance(task: PlannedTask): SafetyCheck {
    const fullText = `${task.title} ${task.description}`.toLowerCase();

    const matchedActivities = extractMatches(fullText, GERMAN_LAW_RESTRICTED_ACTIVITIES);

    if (matchedActivities.length > 0) {
      return {
        rule: 'German Law Compliance (StGB, KWG, WpHG, DSGVO)',
        passed: false,
        severity: 'critical',
        details: `Legal concern: Task may involve restricted activity under German law: "${matchedActivities.join(', ')}". Requires legal review before proceeding.`,
      };
    }

    // Check for financial activities that need BaFin oversight
    const financialActivities = [
      'securities trading',
      'wertpapierhandel',
      'investment advice',
      'anlageberatung',
      'fund management',
      'fondsverwaltung',
    ];

    if (containsAny(fullText, financialActivities)) {
      return {
        rule: 'German Law Compliance (StGB, KWG, WpHG, DSGVO)',
        passed: true,
        severity: 'warning',
        details: `Task involves financial activity ("${extractMatches(fullText, financialActivities).join(', ')}"). Ensure BaFin compliance if applicable.`,
      };
    }

    return {
      rule: 'German Law Compliance (StGB, KWG, WpHG, DSGVO)',
      passed: true,
      severity: 'info',
      details: 'No German law compliance concerns detected.',
    };
  }

  /**
   * Check 3: GDPR / DSGVO Data Protection
   */
  private checkDataProtection(task: PlannedTask): SafetyCheck {
    const fullText = `${task.title} ${task.description}`.toLowerCase();

    const personalDataKeywords = [
      'personal data',
      'personenbezogene daten',
      'email address',
      'phone number',
      'address',
      'identity',
      'passport',
      'id number',
    ];

    const dataActions = [
      'collect', 'gather', 'store', 'process', 'share', 'transfer',
      'sammlung', 'speicherung', 'verarbeitung', 'weitergabe',
    ];

    if (
      containsAny(fullText, personalDataKeywords) &&
      containsAny(fullText, dataActions)
    ) {
      return {
        rule: 'Data Protection (DSGVO/GDPR)',
        passed: true,
        severity: 'warning',
        details: 'Task involves processing of personal data. Ensure lawful basis (Art. 6 DSGVO) and data subject rights compliance.',
      };
    }

    return {
      rule: 'Data Protection (DSGVO/GDPR)',
      passed: true,
      severity: 'info',
      details: 'No personal data processing detected.',
    };
  }

  /**
   * Check 4: Financial Regulation (BaFin, MiFID II)
   */
  private checkFinancialRegulation(task: PlannedTask): SafetyCheck {
    const fullText = `${task.title} ${task.description}`.toLowerCase();

    const regKeywords = [
      'bafin', 'mifid', 'eu widerrufsrecht', 'consumer protection',
      'verbraucherschutz', 'prospectus', 'prospekt',
    ];

    if (containsAny(fullText, regKeywords)) {
      return {
        rule: 'Financial Regulation (BaFin, MiFID II)',
        passed: true,
        severity: 'warning',
        details: 'Task references financial regulations. Verify all regulatory requirements are met.',
      };
    }

    return {
      rule: 'Financial Regulation (BaFin, MiFID II)',
      passed: true,
      severity: 'info',
      details: 'No financial regulatory concerns detected.',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE RUNNER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes individual phases of the 7-phase brain loop.
 * Each phase gathers/transforms data and persists results to Supabase.
 */
export class PhaseRunner {
  private safetyValidator: SafetyValidator;

  constructor() {
    this.safetyValidator = new SafetyValidator();
  }

  /**
   * Run a specific phase by number (1-7).
   */
  async runPhase(
    phaseNumber: number,
    cycleId: string,
    context?: Record<string, unknown>
  ): Promise<PhaseResult> {
    switch (phaseNumber) {
      case 1:
        return this.runObservation(cycleId);
      case 2:
        return this.runResearch(cycleId, context);
      case 3:
        return this.runReasoning(cycleId, context);
      case 4:
        return this.runPlanning(cycleId, context);
      case 5:
        return this.runValidation(cycleId, context);
      case 6:
        return this.runAction(cycleId, context);
      case 7:
        return this.runLearning(cycleId, context);
      default:
        return {
          phase: 'observation',
          success: false,
          data: {},
          summary: `Invalid phase number: ${phaseNumber}`,
          error: `Phase ${phaseNumber} does not exist (valid: 1-7)`,
        };
    }
  }

  /**
   * PHASE 1 — Observation
   * Gather: open tasks, project status, calendar entries, agent statuses, metrics
   */
  private async runObservation(cycleId: string): Promise<PhaseResult> {
    try {
      const timestamp = now();

      // Fetch open tasks
      const { data: openTasks, error: tasksError } = await supabase
        .from('loop_agent_tasks')
        .select('*')
        .in('status', ['pending', 'running']);

      if (tasksError) throw tasksError;

      const runningTasks = (openTasks ?? []).filter((t) => t.status === 'running');
      const pendingTasks = (openTasks ?? []).filter((t) => t.status === 'pending');

      // Fetch paused tasks
      const { data: pausedTasks, error: pausedError } = await supabase
        .from('loop_agent_tasks')
        .select('*')
        .eq('status', 'paused_awaiting_confirmation');

      if (pausedError) throw pausedError;

      // Fetch agent statuses
      const { data: agents, error: agentsError } = await supabase
        .from('loop_agents')
        .select('id, name, agent_type, status, skills');

      if (agentsError) throw agentsError;

      // Fetch recent executions
      const { data: executions, error: execError } = await supabase
        .from('loop_agent_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (execError) throw execError;

      const recentErrors = (executions ?? []).filter((e) => e.status === 'error');

      const observation: SystemObservation = {
        openTasks: (openTasks ?? []).length,
        runningTasks: runningTasks.length,
        pausedTasks: (pausedTasks ?? []).length,
        agentStatuses: (agents ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          agent_type: a.agent_type,
          status: a.status,
          skills: a.skills,
        })),
        recentExecutions: (executions ?? []).length,
        recentErrors: recentErrors.length,
        timestamp,
      };

      const phaseData = makePhaseData('completed', observation as unknown as Record<string, unknown>);

      await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          phase_observation: phaseData,
          updated_at: timestamp,
        })
        .eq('id', cycleId);

      return {
        phase: 'observation',
        success: true,
        data: observation as unknown as Record<string, unknown>,
        summary: `Observed: ${observation.openTasks} open tasks (${observation.runningTasks} running, ${observation.pausedTasks} paused), ${observation.agentStatuses.length} agents, ${observation.recentErrors} recent errors`,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Observation phase failed';
      return {
        phase: 'observation',
        success: false,
        data: {},
        summary: `Observation failed: ${error}`,
        error,
      };
    }
  }

  /**
   * PHASE 2 — Research
   * Conduct external research when needed. Gather market data, competitive
   * intelligence, and technical information. Write findings to memory.
   */
  private async runResearch(
    cycleId: string,
    context?: Record<string, unknown>
  ): Promise<PhaseResult> {
    try {
      const findings: ResearchFinding[] = [];

      // Determine research topics based on observation context
      const topics: string[] = [];

      // Check if there are trading-related tasks that need market research
      const tasksNeedingResearch = (context?.openTasks as Array<Record<string, unknown>> | undefined) ?? [];
      for (const task of tasksNeedingResearch) {
        const desc = `${task.title ?? ''} ${task.description ?? ''}`.toLowerCase();
        if (desc.includes('market') || desc.includes('trading') || desc.includes('price')) {
          topics.push('market_conditions');
        }
        if (desc.includes('competitor') || desc.includes('competitive')) {
          topics.push('competitive_intelligence');
        }
        if (desc.includes('technical') || desc.includes('implementation')) {
          topics.push('technical_research');
        }
      }

      // Deduplicate topics
      const uniqueTopics = [...new Set(topics)];

      // If no specific topics, do a general health check
      if (uniqueTopics.length === 0) {
        uniqueTopics.push('system_health');
      }

      // For each topic, attempt research (simulated — in production this would
      // call external research APIs or web scraping via Playwright)
      for (const topic of uniqueTopics.slice(0, 3)) {
        // In production, this would trigger actual web research
        // For now, record the research intent
        const finding: ResearchFinding = {
          topic,
          source: 'hermes_internal',
          summary: `Research initiated for topic: ${topic}. Findings will be populated by external research pipeline.`,
          relevance: 0.8,
        };
        findings.push(finding);

        // Write finding to Hermes memory
        await supabase.from('loop_hermes_memory').insert({
          entry_type: 'research_finding',
          title: `Research: ${topic}`,
          content: finding.summary,
          tags: ['research', topic],
          source: 'phase_2_research',
          cycle_id: cycleId,
          importance: 7,
        });
      }

      const phaseData = makePhaseData(
        'completed',
        { findings, topics: uniqueTopics } as unknown as Record<string, unknown>,
        `Completed research on ${uniqueTopics.length} topics, ${findings.length} findings recorded to memory.`
      );

      await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          phase_research: phaseData,
          updated_at: now(),
        })
        .eq('id', cycleId);

      return {
        phase: 'research',
        success: true,
        data: { findings, topics: uniqueTopics },
        summary: `Research completed: ${uniqueTopics.length} topics, ${findings.length} findings recorded.`,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Research phase failed';
      return {
        phase: 'research',
        success: false,
        data: {},
        summary: `Research failed: ${error}`,
        error,
      };
    }
  }

  /**
   * PHASE 3 — Reasoning & Reflection
   * Analyze current situation vs goals. Evaluate past actions. Identify
   * bottlenecks and opportunities.
   */
  private async runReasoning(
    cycleId: string,
    context?: Record<string, unknown>
  ): Promise<PhaseResult> {
    try {
      // Fetch past cycles for trend analysis
      const { data: pastCycles } = await supabase
        .from('loop_hermes_brain_cycles')
        .select('*')
        .order('cycle_number', { ascending: false })
        .limit(10);

      // Fetch memory entries for context
      const { data: memories } = await supabase
        .from('loop_hermes_memory')
        .select('*')
        .order('importance', { ascending: false })
        .limit(20);

      const pastCyclesData = (pastCycles ?? []) as BrainCycle[];
      const memoryEntries = memories ?? [];

      // Calculate trends
      const completedTrend = pastCyclesData.filter((c) => c.status === 'completed').length;
      const errorTrend = pastCyclesData.filter((c) => c.status === 'error').length;
      const avgTasksGenerated =
        pastCyclesData.length > 0
          ? pastCyclesData.reduce((sum, c) => sum + (c.tasks_generated ?? 0), 0) /
            pastCyclesData.length
          : 0;

      // Identify bottlenecks
      const bottlenecks: string[] = [];

      const pausedCount = (context?.pausedTasks as number) ?? 0;
      if (pausedCount > 0) {
        bottlenecks.push(`${pausedCount} tasks paused awaiting legal/user confirmation`);
      }

      const errorCount = (context?.recentErrors as number) ?? 0;
      if (errorCount > 5) {
        bottlenecks.push('High error rate in recent executions — possible backend issue');
      }

      const openCount = (context?.openTasks as number) ?? 0;
      if (openCount > 20) {
        bottlenecks.push('Large backlog of open tasks — consider scaling agents');
      }

      const reasoning = {
        situation_analysis: `System has ${openCount} open tasks with ${pausedCount} paused for review.`,
        trend_summary: `Last ${pastCyclesData.length} cycles: ${completedTrend} completed, ${errorTrend} errors, avg ${avgTasksGenerated.toFixed(1)} tasks/cycle.`,
        bottlenecks,
        opportunities: this.identifyOpportunities(context),
        memory_insights: memoryEntries.slice(0, 5).map((m) => m.title),
      };

      // Write reasoning to memory
      await supabase.from('loop_hermes_memory').insert({
        entry_type: 'reasoning',
        title: `Cycle reasoning: ${cycleId.slice(0, 8)}`,
        content: JSON.stringify(reasoning),
        tags: ['reasoning', 'analysis'],
        source: 'phase_3_reasoning',
        cycle_id: cycleId,
        importance: 8,
      });

      const phaseData = makePhaseData(
        'completed',
        reasoning as unknown as Record<string, unknown>,
        `Reasoning: ${bottlenecks.length} bottlenecks identified, ${reasoning.opportunities.length} opportunities found.`
      );

      await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          phase_reasoning: phaseData,
          updated_at: now(),
        })
        .eq('id', cycleId);

      return {
        phase: 'reasoning',
        success: true,
        data: reasoning,
        summary: `Reasoning complete: ${bottlenecks.length} bottlenecks, ${reasoning.opportunities.length} opportunities.`,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Reasoning phase failed';
      return {
        phase: 'reasoning',
        success: false,
        data: {},
        summary: `Reasoning failed: ${error}`,
        error,
      };
    }
  }

  /**
   * PHASE 4 — Planning
   * Generate new tasks for agents AND for Phelan. Prioritize by impact/urgency.
   * Create tasks in loop_agent_tasks and loop_phelan_tasks.
   */
  private async runPlanning(
    cycleId: string,
    context?: Record<string, unknown>
  ): Promise<PhaseResult> {
    try {
      const plannedTasks: PlannedTask[] = [];
      const phelanTasks: Array<{
        title: string;
        description: string;
        priority: string;
        hermes_reasoning: string;
      }> = [];

      // Generate tasks based on reasoning context
      const bottlenecks = (context?.bottlenecks as string[] | undefined) ?? [];
      const opportunities = (context?.opportunities as string[] | undefined) ?? [];

      // For each bottleneck, plan a resolution task
      for (const bottleneck of bottlenecks) {
        plannedTasks.push({
          title: `Resolve: ${bottleneck.slice(0, 80)}`,
          description: `Address bottleneck identified in reasoning phase: ${bottleneck}`,
          agentType: 'meta_orchestrator',
          priority: 'high',
          backend: 'hermes_openclaw',
          requiresLegalCheck: true,
        });
      }

      // For each opportunity, plan an action task
      for (const opportunity of opportunities) {
        plannedTasks.push({
          title: `Act on: ${opportunity.slice(0, 80)}`,
          description: `Pursue opportunity identified in reasoning phase: ${opportunity}`,
          agentType: 'meta_orchestrator',
          priority: 'medium',
          backend: 'hermes_openclaw',
          requiresLegalCheck: true,
        });
      }

      // If no specific tasks, create a system health check
      if (plannedTasks.length === 0) {
        plannedTasks.push({
          title: 'System health check and optimization',
          description: 'Routine system health verification and performance optimization.',
          agentType: 'meta_orchestrator',
          priority: 'low',
          backend: 'simulation',
          requiresLegalCheck: false,
        });
      }

      // If there are paused tasks, create a Phelan notification task
      const pausedCount = (context?.pausedTasks as number) ?? 0;
      if (pausedCount > 0) {
        phelanTasks.push({
          title: `Review ${pausedCount} paused task(s) requiring confirmation`,
          description: `${pausedCount} task(s) are paused awaiting your approval due to safety checks. Please review and approve/reject each.`,
          priority: 'high',
          hermes_reasoning: `Safety validator paused ${pausedCount} task(s) during cycle ${cycleId.slice(0, 8)}. Phelan's review required.`,
        });
      }

      // Create Phelan tasks in database
      for (const pt of phelanTasks) {
        await supabase.from('loop_phelan_tasks').insert({
          title: pt.title,
          description: pt.description,
          status: 'pending',
          priority: pt.priority,
          hermes_reasoning: pt.hermes_reasoning,
          source_cycle_id: cycleId,
          metadata: { auto_generated: true },
        });
      }

      const plan = {
        plannedTasks: plannedTasks.map((t) => ({
          ...t,
          validationStatus: 'pending',
        })),
        phelanTasksCreated: phelanTasks.length,
        totalPlanned: plannedTasks.length,
        priorityBreakdown: {
          critical: plannedTasks.filter((t) => t.priority === 'critical').length,
          high: plannedTasks.filter((t) => t.priority === 'high').length,
          medium: plannedTasks.filter((t) => t.priority === 'medium').length,
          low: plannedTasks.filter((t) => t.priority === 'low').length,
        },
      };

      const phaseData = makePhaseData(
        'completed',
        plan as unknown as Record<string, unknown>,
        `Planning: ${plan.totalPlanned} tasks planned (${plan.phelanTasksCreated} Phelan notifications).`
      );

      await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          phase_planning: phaseData,
          phelan_tasks_created: (context?.phelanTasksCreated as number) ?? 0 + phelanTasks.length,
          updated_at: now(),
        })
        .eq('id', cycleId);

      return {
        phase: 'planning',
        success: true,
        data: plan,
        summary: `Planning complete: ${plan.totalPlanned} tasks, ${plan.phelanTasksCreated} Phelan tasks.`,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Planning phase failed';
      return {
        phase: 'planning',
        success: false,
        data: {},
        summary: `Planning failed: ${error}`,
        error,
      };
    }
  }

  /**
   * PHASE 5 — Validation & Safety Check (TASK-GRANULAR)
   * For EACH planned task:
   *   a) Check "Never Harm Phelan Brunk and his Family"
   *   b) Check legal concerns under German law
   *   c) If concerns found → task status = 'paused_awaiting_confirmation'
   *   d) Other tasks continue normally!
   */
  private async runValidation(
    cycleId: string,
    context?: Record<string, unknown>
  ): Promise<PhaseResult> {
    try {
      const plannedTasks = (context?.plannedTasks as PlannedTask[] | undefined) ?? [];
      const validationResults: ValidationResult[] = [];
      let approvedCount = 0;
      let pausedCount = 0;
      let blockedCount = 0;

      for (const task of plannedTasks) {
        const result = await this.safetyValidator.validateTask(task);
        validationResults.push(result);

        if (result.recommendation === 'proceed') {
          approvedCount++;

          // Create the task in the agent tasks table as pending
          await supabase.from('loop_agent_tasks').insert({
            title: task.title,
            description: task.description,
            status: 'pending',
            priority: task.priority,
            backend: task.backend,
            phase: 'intake',
            legal_check_status: 'passed',
            legal_concerns: null,
            metadata: {
              ...task.metadata,
              source_cycle_id: cycleId,
              auto_generated: true,
              safety_checks: result.checks.map((c) => ({
                rule: c.rule,
                passed: c.passed,
                severity: c.severity,
              })),
            },
          });
        } else if (result.recommendation === 'pause') {
          pausedCount++;

          // Create the task but mark it as paused for legal review
          await supabase.from('loop_agent_tasks').insert({
            title: task.title,
            description: task.description,
            status: 'paused_awaiting_confirmation',
            priority: task.priority,
            backend: task.backend,
            phase: 'review',
            legal_check_status: 'concerns',
            legal_concerns: result.concerns.join('; '),
            metadata: {
              ...task.metadata,
              source_cycle_id: cycleId,
              auto_generated: true,
              safety_checks: result.checks.map((c) => ({
                rule: c.rule,
                passed: c.passed,
                severity: c.severity,
              })),
            },
          });
        } else {
          // blocked
          blockedCount++;

          // Log the blocked task but don't create it
          await supabase.from('loop_hermes_memory').insert({
            entry_type: 'blocked_task',
            title: `Blocked: ${task.title.slice(0, 100)}`,
            content: `Task was blocked by safety validation. Concerns: ${result.concerns.join('; ')}`,
            tags: ['blocked', 'safety'],
            source: 'phase_5_validation',
            cycle_id: cycleId,
            importance: 9,
          });
        }
      }

      const validation = {
        totalChecked: plannedTasks.length,
        approved: approvedCount,
        paused: pausedCount,
        blocked: blockedCount,
        details: validationResults.map((r) => ({
          taskId: r.taskId,
          recommendation: r.recommendation,
          concerns: r.concerns,
        })),
      };

      const phaseData = makePhaseData(
        'completed',
        validation as unknown as Record<string, unknown>,
        `Validation: ${approvedCount} approved, ${pausedCount} paused, ${blockedCount} blocked out of ${plannedTasks.length}.`
      );

      await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          phase_validation: phaseData,
          tasks_generated: (context?.tasksGenerated as number) ?? 0 + approvedCount,
          tasks_paused: (context?.tasksPaused as number) ?? 0 + pausedCount,
          updated_at: now(),
        })
        .eq('id', cycleId);

      return {
        phase: 'validation',
        success: true,
        data: validation,
        summary: `Validation: ${approvedCount}/${plannedTasks.length} approved, ${pausedCount} paused, ${blockedCount} blocked.`,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Validation phase failed';
      return {
        phase: 'validation',
        success: false,
        data: {},
        summary: `Validation failed: ${error}`,
        error,
      };
    }
  }

  /**
   * PHASE 6 — Action
   * Execute approved tasks or delegate to agents.
   * Skip paused tasks — they do NOT block other tasks.
   */
  private async runAction(
    cycleId: string,
    context?: Record<string, unknown>
  ): Promise<PhaseResult> {
    try {
      // Fetch approved (pending) tasks created by this cycle
      const { data: pendingTasks } = await supabase
        .from('loop_agent_tasks')
        .select('*')
        .eq('status', 'pending')
        .filter('metadata->source_cycle_id', 'eq', cycleId);

      const tasksToExecute = (pendingTasks ?? []).slice(0, 10); // Batch limit
      const executionResults: Array<{
        taskId: string;
        status: string;
        result: string;
      }> = [];

      for (const task of tasksToExecute) {
        try {
          // Mark task as running
          await supabase
            .from('loop_agent_tasks')
            .update({
              status: 'running',
              started_at: now(),
              phase: 'execution',
              updated_at: now(),
            })
            .eq('id', task.id);

          // Route to backend for execution
          await supabase.from('loop_agent_executions').insert({
            task_id: task.id,
            agent_id: task.agent_id,
            backend: task.backend ?? 'simulation',
            status: 'running',
            started_at: now(),
          });

          executionResults.push({
            taskId: task.id,
            status: 'delegated',
            result: `Task delegated to backend: ${task.backend ?? 'simulation'}`,
          });
        } catch (execErr) {
          executionResults.push({
            taskId: task.id,
            status: 'failed',
            result: execErr instanceof Error ? execErr.message : 'Execution error',
          });
        }
      }

      const action = {
        tasksAttempted: tasksToExecute.length,
        tasksDelegated: executionResults.filter((r) => r.status === 'delegated').length,
        tasksFailed: executionResults.filter((r) => r.status === 'failed').length,
        executionResults,
        note: 'Paused tasks were intentionally skipped — they do not block other tasks.',
      };

      const phaseData = makePhaseData(
        'completed',
        action as unknown as Record<string, unknown>,
        `Action: ${action.tasksDelegated}/${action.tasksAttempted} tasks delegated, ${action.tasksFailed} failed.`
      );

      await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          phase_action: phaseData,
          tasks_completed: (context?.tasksCompleted as number) ?? 0 + action.tasksDelegated,
          updated_at: now(),
        })
        .eq('id', cycleId);

      return {
        phase: 'action',
        success: true,
        data: action,
        summary: `Action: ${action.tasksDelegated} delegated, ${action.tasksFailed} failed (${action.tasksAttempted} total).`,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Action phase failed';
      return {
        phase: 'action',
        success: false,
        data: {},
        summary: `Action failed: ${error}`,
        error,
      };
    }
  }

  /**
   * PHASE 7 — Learning, Improvement & Reporting
   * Update Obsidian-style memory, evaluate performance, suggest
   * self-improvements, generate summary report.
   */
  private async runLearning(
    cycleId: string,
    context?: Record<string, unknown>
  ): Promise<PhaseResult> {
    try {
      const nowTimestamp = now();

      // Gather cycle results
      const { data: cycleRow } = await supabase
        .from('loop_hermes_brain_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();

      const cycle = cycleRow as BrainCycle | null;

      // Evaluate performance
      const tasksGenerated = cycle?.tasks_generated ?? 0;
      const tasksCompleted = cycle?.tasks_completed ?? 0;
      const tasksPaused = cycle?.tasks_paused ?? 0;
      const phelanTasksCreated = cycle?.phelan_tasks_created ?? 0;

      const completionRate = tasksGenerated > 0 ? tasksCompleted / tasksGenerated : 0;

      const learnings: string[] = [];

      if (completionRate < 0.5) {
        learnings.push(
          'Low completion rate detected. Consider reducing task batch size or improving agent availability.'
        );
      }

      if (tasksPaused > 0) {
        learnings.push(
          `${tasksPaused} tasks required safety pausing. Review common patterns in paused tasks to improve proactive validation.`
        );
      }

      if (tasksCompleted > 0) {
        learnings.push(
          `Successfully completed ${tasksCompleted} tasks. Maintain current delegation strategy for similar task profiles.`
        );
      }

      // Store learnings in memory
      for (const learning of learnings) {
        await supabase.from('loop_hermes_memory').insert({
          entry_type: 'learning',
          title: `Cycle ${cycleId.slice(0, 8)} learning`,
          content: learning,
          tags: ['learning', 'improvement'],
          source: 'phase_7_learning',
          cycle_id: cycleId,
          importance: 8,
        });
      }

      // Generate summary report
      const summary = `Cycle #${cycle?.cycle_number ?? '?'} Summary: ${tasksCompleted}/${tasksGenerated} tasks completed (${(completionRate * 100).toFixed(0)}%), ${tasksPaused} paused, ${phelanTasksCreated} Phelan tasks created. ${learnings.length} learnings recorded.`;

      const learning = {
        performance: {
          tasksGenerated,
          tasksCompleted,
          tasksPaused,
          phelanTasksCreated,
          completionRate: Math.round(completionRate * 100) / 100,
        },
        learnings,
        suggestions: this.generateImprovementSuggestions(cycle, context),
        summary,
      };

      const phaseData = makePhaseData(
        'completed',
        learning as unknown as Record<string, unknown>,
        summary
      );

      await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          phase_learning: phaseData,
          status: 'completed',
          summary,
          learnings,
          updated_at: nowTimestamp,
        })
        .eq('id', cycleId);

      return {
        phase: 'learning',
        success: true,
        data: learning,
        summary,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Learning phase failed';
      return {
        phase: 'learning',
        success: false,
        data: {},
        summary: `Learning failed: ${error}`,
        error,
      };
    }
  }

  // ── Helpers ──

  private identifyOpportunities(_context?: Record<string, unknown>): string[] {
    const opportunities: string[] = [];

    // These would be dynamically generated based on system state
    opportunities.push('Review agent skill configurations for optimization');
    opportunities.push('Analyze task completion latency trends');
    opportunities.push('Consider adding new agent types for emerging task patterns');

    return opportunities;
  }

  private generateImprovementSuggestions(
    _cycle: BrainCycle | null,
    _context?: Record<string, unknown>
  ): string[] {
    return [
      'Improve phase transition latency by parallelizing database writes',
      'Add more granular safety rules for domain-specific tasks',
      'Implement predictive task routing based on historical success rates',
      'Cache observation data between cycles to reduce redundant queries',
    ];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HERMES BRAIN ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orchestrates the full 7-phase Hermes Brain autonomous loop.
 *
 * Usage:
 *   const engine = new HermesBrainEngine();
 *   const cycle = await engine.startCycle();
 *   await engine.pauseCycle();
 *   await engine.resumeCycle();
 *   const phase = engine.getCurrentPhase();
 */
export class HermesBrainEngine {
  private phaseRunner: PhaseRunner;
  private currentCycleId: string | null = null;
  private isRunning = false;
  private isPaused = false;
  private abortController: AbortController | null = null;

  constructor() {
    this.phaseRunner = new PhaseRunner();
  }

  /**
   * Start a new brain cycle. Runs through all 7 phases.
   */
  async startCycle(): Promise<BrainCycle | null> {
    if (this.isRunning) {
      throw new Error('A cycle is already running. Pause or wait for completion.');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.abortController = new AbortController();

    try {
      // Get next cycle number
      const { data: maxRow } = await supabase
        .from('loop_hermes_brain_cycles')
        .select('cycle_number')
        .order('cycle_number', { ascending: false })
        .limit(1)
        .single();

      const cycleNumber = ((maxRow?.cycle_number as number) ?? 0) + 1;
      const timestamp = now();

      // Create the cycle record
      const { data: cycleRow, error: insertError } = await supabase
        .from('loop_hermes_brain_cycles')
        .insert({
          cycle_number: cycleNumber,
          status: 'running',
          phase_observation: makePhaseData('in_progress'),
          phase_research: makePhaseData('not_started'),
          phase_reasoning: makePhaseData('not_started'),
          phase_planning: makePhaseData('not_started'),
          phase_validation: makePhaseData('not_started'),
          phase_action: makePhaseData('not_started'),
          phase_learning: makePhaseData('not_started'),
          tasks_generated: 0,
          tasks_completed: 0,
          tasks_paused: 0,
          phelan_tasks_created: 0,
          learnings: [],
        })
        .select('*')
        .single();

      if (insertError) {
        this.isRunning = false;
        throw new Error(`Failed to create cycle: ${insertError.message}`);
      }

      const cycle = cycleRow as unknown as BrainCycle;
      this.currentCycleId = cycle.id;

      // Run all 7 phases sequentially
      const phaseResults: PhaseResult[] = [];
      let sharedContext: Record<string, unknown> = {};

      for (let phaseNum = 1; phaseNum <= 7; phaseNum++) {
        // Check for pause signal
        if (this.isPaused) {
          await this.waitForResume();
        }

        // Check for abort signal
        if (this.abortController?.signal.aborted) {
          await this.markCycleError('Cycle aborted by user');
          this.isRunning = false;
          return null;
        }

        // Update current phase to in_progress
        await this.updatePhaseStatus(phaseNum, 'in_progress');

        // Build context from previous phase results
        const context = this.buildPhaseContext(phaseNum, phaseResults, sharedContext);

        // Execute the phase
        const result = await this.phaseRunner.runPhase(phaseNum, cycle.id, context);
        phaseResults.push(result);

        // Merge result data into shared context for subsequent phases
        sharedContext = {
          ...sharedContext,
          ...result.data,
          [`phase${phaseNum}`]: result.data,
        };

        if (!result.success) {
          // Phase failed — mark cycle as error but continue to learning
          await this.updatePhaseStatus(phaseNum, 'error');

          if (phaseNum < 7) {
            // Log error but try to reach phase 7 for reporting
            await supabase.from('loop_hermes_memory').insert({
              entry_type: 'error',
              title: `Phase ${phaseNum} error in cycle ${cycleNumber}`,
              content: result.error ?? 'Unknown phase error',
              tags: ['error', `phase_${phaseNum}`],
              source: 'hermes_brain_engine',
              cycle_id: cycle.id,
              importance: 9,
            });
          }
        } else {
          await this.updatePhaseStatus(phaseNum, 'completed');
        }
      }

      this.isRunning = false;

      // Fetch and return final cycle state
      const { data: finalCycle } = await supabase
        .from('loop_hermes_brain_cycles')
        .select('*')
        .eq('id', cycle.id)
        .single();

      return finalCycle as unknown as BrainCycle;
    } catch (err) {
      this.isRunning = false;

      if (this.currentCycleId) {
        await this.markCycleError(err instanceof Error ? err.message : 'Unknown engine error');
      }

      throw err;
    }
  }

  /**
   * Pause the current cycle. The cycle will halt at the next phase boundary.
   */
  async pauseCycle(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    this.isPaused = true;

    if (this.currentCycleId) {
      await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          status: 'paused',
          updated_at: now(),
        })
        .eq('id', this.currentCycleId);
    }
  }

  /**
   * Resume a paused cycle.
   */
  async resumeCycle(): Promise<void> {
    if (!this.isPaused) {
      return;
    }
    this.isPaused = false;

    if (this.currentCycleId) {
      await supabase
        .from('loop_hermes_brain_cycles')
        .update({
          status: 'running',
          updated_at: now(),
        })
        .eq('id', this.currentCycleId);
    }
  }

  /**
   * Abort the current cycle immediately.
   */
  async abortCycle(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
    this.isPaused = false;
  }

  /**
   * Get the current phase number (1-7) of the running cycle.
   * Returns 0 if no cycle is running.
   */
  getCurrentPhase(): number {
    if (!this.currentCycleId || !this.isRunning) {
      return 0;
    }
    // This is a synchronous method, so we return the cached value
    // The actual phase is tracked via the database
    return 0; // Callers should use the database record for accurate phase
  }

  /**
   * Get the current cycle ID.
   */
  getCurrentCycleId(): string | null {
    return this.currentCycleId;
  }

  /**
   * Check if a cycle is currently running.
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if the current cycle is paused.
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  // ── Private helpers ──

  private async updatePhaseStatus(
    phaseNum: number,
    status: PhaseData['status']
  ): Promise<void> {
    if (!this.currentCycleId) return;

    const column = PHASE_DB_COLUMNS[phaseNum - 1];
    const existingPhaseData = await this.getPhaseData(phaseNum);

    const updatePayload: Record<string, unknown> = {
      updated_at: now(),
    };

    updatePayload[column] = {
      ...existingPhaseData,
      status,
      ...(status === 'in_progress' ? { started_at: now() } : {}),
      ...(status === 'completed' || status === 'error' ? { completed_at: now() } : {}),
    };

    await supabase
      .from('loop_hermes_brain_cycles')
      .update(updatePayload)
      .eq('id', this.currentCycleId);
  }

  private async getPhaseData(phaseNum: number): Promise<PhaseData> {
    if (!this.currentCycleId) {
      return makePhaseData('not_started');
    }

    const { data } = await supabase
      .from('loop_hermes_brain_cycles')
      .select(PHASE_DB_COLUMNS[phaseNum - 1])
      .eq('id', this.currentCycleId)
      .single();

    return (data?.[PHASE_DB_COLUMNS[phaseNum - 1]] as PhaseData) ?? makePhaseData('not_started');
  }

  private async markCycleError(errorMessage: string): Promise<void> {
    if (!this.currentCycleId) return;

    await supabase
      .from('loop_hermes_brain_cycles')
      .update({
        status: 'error',
        summary: `Cycle error: ${errorMessage}`,
        updated_at: now(),
      })
      .eq('id', this.currentCycleId);

    await supabase.from('loop_hermes_memory').insert({
      entry_type: 'error',
      title: `Cycle ${this.currentCycleId.slice(0, 8)} error`,
      content: errorMessage,
      tags: ['error', 'cycle_failure'],
      source: 'hermes_brain_engine',
      cycle_id: this.currentCycleId,
      importance: 10,
    });
  }

  private async waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.isPaused || this.abortController?.signal.aborted) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  private buildPhaseContext(
    phaseNum: number,
    previousResults: PhaseResult[],
    sharedContext: Record<string, unknown>
  ): Record<string, unknown> {
    // Each phase gets the accumulated context from all previous phases
    const baseContext = { ...sharedContext };

    // Add phase-specific enrichments
    switch (phaseNum) {
      case 1: // Observation needs no context
        return {};
      case 2: // Research needs observation data
        return baseContext;
      case 3: // Reasoning needs observation + research
        return baseContext;
      case 4: // Planning needs reasoning output
        return {
          ...baseContext,
          bottlenecks: (baseContext.bottlenecks as string[]) ?? [],
          opportunities: (baseContext.opportunities as string[]) ?? [],
        };
      case 5: // Validation needs the planned tasks
        return {
          ...baseContext,
          plannedTasks: (baseContext.plannedTasks as PlannedTask[]) ?? [],
          phelanTasksCreated: (baseContext.phelanTasksCreated as number) ?? 0,
        };
      case 6: // Action needs validation results
        return {
          ...baseContext,
          tasksGenerated: (baseContext.tasksGenerated as number) ?? 0,
          tasksPaused: (baseContext.tasksPaused as number) ?? 0,
        };
      case 7: // Learning needs the full cycle context
        return {
          ...baseContext,
          previousResults: previousResults.map((r) => ({
            phase: r.phase,
            success: r.success,
          })),
        };
      default:
        return baseContext;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared singleton instance of the Hermes Brain Engine.
 * Use this for the default engine, or create new instances with `new HermesBrainEngine()`.
 */
export const hermesBrain = new HermesBrainEngine();
