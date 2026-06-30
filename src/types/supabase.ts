// Auto-generated Supabase types — extend as needed
// Generated for: https://ksmrjvsfngykpywyvsuh.supabase.co

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ── CORE TABLES ──
      customers: {
        Row: {
          id: string;
          company_name: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          website?: string | null;
          status: string;
          industry?: string | null;
          logo_url?: string | null;
          notes?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          website?: string | null;
          status?: string;
          industry?: string | null;
          logo_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          website?: string | null;
          status?: string;
          industry?: string | null;
          logo_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };

      projects: {
        Row: {
          id: string;
          user_id: string;
          customer_id?: string | null;
          name: string;
          description?: string | null;
          project_type: string;
          status: string;
          priority: string;
          budget?: number | null;
          cost?: number | null;
          start_date?: string | null;
          deadline?: string | null;
          domain?: string | null;
          thumbnail_url?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id?: string | null;
          name: string;
          description?: string | null;
          project_type?: string;
          status?: string;
          priority?: string;
          budget?: number | null;
          cost?: number | null;
          start_date?: string | null;
          deadline?: string | null;
          domain?: string | null;
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_id?: string | null;
          name?: string;
          description?: string | null;
          project_type?: string;
          status?: string;
          priority?: string;
          budget?: number | null;
          cost?: number | null;
          start_date?: string | null;
          deadline?: string | null;
          domain?: string | null;
          thumbnail_url?: string | null;
          created_at?: string;
        };
      };

      // ── KNOWLEDGE GRAPH TABLES ──
      loop_knowledge_nodes: {
        Row: {
          id: string;
          user_id?: string | null;
          type: string;
          title: string;
          x: number;
          y: number;
          size: number;
          tags: string[];
          status?: string | null;
          priority?: string | null;
          content?: string | null;
          obsidian_note_id?: string | null;
          vault_path?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: string;
          title: string;
          x?: number;
          y?: number;
          size?: number;
          tags?: string[];
          status?: string | null;
          priority?: string | null;
          content?: string | null;
          obsidian_note_id?: string | null;
          vault_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string;
          title?: string;
          x?: number;
          y?: number;
          size?: number;
          tags?: string[];
          status?: string | null;
          priority?: string | null;
          content?: string | null;
          obsidian_note_id?: string | null;
          vault_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      loop_knowledge_edges: {
        Row: {
          id: string;
          source_id: string;
          target_id: string;
          label: string;
          type: string;
          strength: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          target_id: string;
          label?: string;
          type?: string;
          strength?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          target_id?: string;
          label?: string;
          type?: string;
          strength?: number;
          created_at?: string;
        };
      };

      // ── OBSIDIAN VAULT TABLES ──
      obsidian_notes: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          frontmatter: Json;
          tags: string[];
          vault_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content?: string | null;
          frontmatter?: Json;
          tags?: string[];
          vault_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string | null;
          frontmatter?: Json;
          tags?: string[];
          vault_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      obsidian_links: {
        Row: {
          id: string;
          source_note_id: string;
          target_note_id: string;
          link_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_note_id: string;
          target_note_id: string;
          link_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_note_id?: string;
          target_note_id?: string;
          link_text?: string | null;
          created_at?: string;
        };
      };

      // ── CHAT TABLES ──
      chat_conversations: {
        Row: {
          id: string;
          title: string;
          model: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          model?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          model?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          model?: string | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          model?: string | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          model?: string | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          created_at?: string;
        };
      };

      // ── PROFILES ──
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          hourly_rate?: number | null;
          currency?: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          hourly_rate?: number | null;
          currency?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          hourly_rate?: number | null;
          currency?: string | null;
        };
      };
    };
  };
}
