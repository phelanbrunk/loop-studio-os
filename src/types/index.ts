export interface Customer {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  status: 'active' | 'inactive' | 'prospect' | 'churned';
  industry?: string;
  logo_url?: string;
  notes?: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  customer_id?: string;
  name: string;
  description?: string;
  project_type: 'website' | 'webapp' | 'ecommerce' | 'redesign' | 'maintenance' | 'seo' | 'branding' | 'other';
  status: 'planning' | 'design' | 'development' | 'review' | 'live' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
  cost?: number;
  start_date?: string;
  deadline?: string;
  domain?: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  customer_id?: string;
  project_id?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  customer_id?: string;
  project_id?: string;
  title: string;
  description?: string;
  appointment_type: 'meeting' | 'call' | 'deadline' | 'reminder' | 'presentation' | 'other';
  start_time: string;
  end_time?: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  project_id?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  description?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  is_billable: boolean;
  hourly_rate?: number;
}

export interface Note {
  id: string;
  user_id: string;
  entity_type: 'customer' | 'project' | 'invoice' | 'appointment' | 'general';
  entity_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  avatar_url?: string;
  hourly_rate?: number;
  currency?: string;
}

// ─── CHAT TYPES ───

export interface ChatConversation {
  id: string;
  title: string;
  model: string;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokens_used?: number;
  latency_ms?: number;
  created_at: string;
}

export interface ApiConnector {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom' | 'webhook' | 'supabase_function';
  base_url?: string;
  api_key?: string;
  default_model: string;
  is_active: boolean;
  config?: Record<string, unknown>;
}

export interface ApiPrompt {
  id: string;
  name: string;
  description?: string;
  system_prompt?: string;
  user_prompt_template?: string;
  variables?: string[];
  is_favorite: boolean;
}

export interface ChatPreferences {
  default_model: string;
  theme: string;
  show_timestamps: boolean;
  compact_mode: boolean;
}
