export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      citation_targets: {
        Row: {
          contacted_on: string | null
          directory_id: string | null
          id: string
          name: string
          notes: string | null
          obtained_on: string | null
          sprint_id: string
          status: string
          url: string | null
        }
        Insert: {
          contacted_on?: string | null
          directory_id?: string | null
          id?: string
          name: string
          notes?: string | null
          obtained_on?: string | null
          sprint_id: string
          status?: string
          url?: string | null
        }
        Update: {
          contacted_on?: string | null
          directory_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          obtained_on?: string | null
          sprint_id?: string
          status?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citation_targets_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      client_data: {
        Row: {
          client_id: string
          created_at: string
          id: string
          key: string
          value: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_data_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          amount_eur: number
          brand_name: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          invoice_status: string
          lead_id: string | null
          notes: string | null
          offer: string
          scan_id: string | null
          updated_at: string
        }
        Insert: {
          amount_eur?: number
          brand_name: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          invoice_status?: string
          lead_id?: string | null
          notes?: string | null
          offer?: string
          scan_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_eur?: number
          brand_name?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          invoice_status?: string
          lead_id?: string | null
          notes?: string | null
          offer?: string
          scan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_log: {
        Row: {
          cost_eur: number
          created_at: string
          engine: string
          id: string
          scan_id: string | null
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          cost_eur?: number
          created_at?: string
          engine: string
          id?: string
          scan_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          cost_eur?: number
          created_at?: string
          engine?: string
          id?: string
          scan_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_log_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
          id: string
          kind: string
          sprint_id: string
          status: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          sprint_id: string
          status?: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          sprint_id?: string
          status?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      directories: {
        Row: {
          authority_note: string | null
          created_at: string
          id: string
          kind: string
          language: string
          name: string
          sector: string
          url: string | null
        }
        Insert: {
          authority_note?: string | null
          created_at?: string
          id?: string
          kind?: string
          language?: string
          name: string
          sector: string
          url?: string | null
        }
        Update: {
          authority_note?: string | null
          created_at?: string
          id?: string
          kind?: string
          language?: string
          name?: string
          sector?: string
          url?: string | null
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          body: string | null
          cancelled: boolean
          channel: string
          created_at: string
          due_on: string
          id: string
          lead_id: string
          sent_at: string | null
          step: number
          subject: string | null
        }
        Insert: {
          body?: string | null
          cancelled?: boolean
          channel?: string
          created_at?: string
          due_on: string
          id?: string
          lead_id: string
          sent_at?: string | null
          step: number
          subject?: string | null
        }
        Update: {
          body?: string | null
          cancelled?: boolean
          channel?: string
          created_at?: string
          due_on?: string
          id?: string
          lead_id?: string
          sent_at?: string | null
          step?: number
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          consent_at: string
          converted: boolean
          created_at: string
          email: string
          first_name: string | null
          id: string
          notes: string | null
          phone: string | null
          priority: string
          scan_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          consent_at?: string
          converted?: boolean
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          priority?: string
          scan_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          consent_at?: string
          converted?: boolean
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          priority?: string
          scan_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          brand: string
          created_at: string
          engine: string
          id: string
          is_target: boolean
          position: number | null
          query_id: string
          recommended: boolean
          response_id: string
          scan_id: string
          sentiment: string | null
          verbatim: string | null
        }
        Insert: {
          brand: string
          created_at?: string
          engine: string
          id?: string
          is_target?: boolean
          position?: number | null
          query_id: string
          recommended?: boolean
          response_id: string
          scan_id: string
          sentiment?: string | null
          verbatim?: string | null
        }
        Update: {
          brand?: string
          created_at?: string
          engine?: string
          id?: string
          is_target?: boolean
          position?: number | null
          query_id?: string
          recommended?: boolean
          response_id?: string
          scan_id?: string
          sentiment?: string | null
          verbatim?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      queries: {
        Row: {
          created_at: string
          id: string
          intent: string
          rank: number
          scan_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent: string
          rank: number
          scan_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          intent?: string
          rank?: number
          scan_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "queries_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          cost_eur: number | null
          created_at: string
          engine: string
          error: string | null
          id: string
          latency_ms: number | null
          query_id: string
          raw_text: string | null
          scan_id: string
          sources: Json
        }
        Insert: {
          cost_eur?: number | null
          created_at?: string
          engine: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          query_id: string
          raw_text?: string | null
          scan_id: string
          sources?: Json
        }
        Update: {
          cost_eur?: number | null
          created_at?: string
          engine?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          query_id?: string
          raw_text?: string | null
          scan_id?: string
          sources?: Json
        }
        Relationships: [
          {
            foreignKeyName: "responses_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          actions: Json
          avg_position: number | null
          brand_name: string
          city: string | null
          competitors: string[]
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_hash: string | null
          language: string
          mention_rate: number | null
          phase: string
          previous_scan_id: string | null
          reco_rate: number | null
          report_token: string
          score_chatgpt: number | null
          score_claude: number | null
          score_gemini: number | null
          score_global: number | null
          score_perplexity: number | null
          sector: string
          sentiment_score: number | null
          share_of_voice: Json
          started_at: string | null
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          actions?: Json
          avg_position?: number | null
          brand_name: string
          city?: string | null
          competitors?: string[]
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_hash?: string | null
          language?: string
          mention_rate?: number | null
          phase?: string
          previous_scan_id?: string | null
          reco_rate?: number | null
          report_token?: string
          score_chatgpt?: number | null
          score_claude?: number | null
          score_gemini?: number | null
          score_global?: number | null
          score_perplexity?: number | null
          sector: string
          sentiment_score?: number | null
          share_of_voice?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          actions?: Json
          avg_position?: number | null
          brand_name?: string
          city?: string | null
          competitors?: string[]
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_hash?: string | null
          language?: string
          mention_rate?: number | null
          phase?: string
          previous_scan_id?: string | null
          reco_rate?: number | null
          report_token?: string
          score_chatgpt?: number | null
          score_claude?: number | null
          score_gemini?: number | null
          score_global?: number | null
          score_perplexity?: number | null
          sector?: string
          sentiment_score?: number | null
          share_of_voice?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_previous_scan_id_fkey"
            columns: ["previous_scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_tasks: {
        Row: {
          done: boolean
          id: string
          label: string
          notes: string | null
          position: number
          sprint_id: string
          week: number
        }
        Insert: {
          done?: boolean
          id?: string
          label: string
          notes?: string | null
          position?: number
          sprint_id: string
          week: number
        }
        Update: {
          done?: boolean
          id?: string
          label?: string
          notes?: string | null
          position?: number
          sprint_id?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "sprint_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          client_id: string
          created_at: string
          ends_on: string | null
          id: string
          rescan_due_on: string | null
          rescan_scan_id: string | null
          started_on: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          ends_on?: string | null
          id?: string
          rescan_due_on?: string | null
          rescan_scan_id?: string | null
          started_on?: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          rescan_due_on?: string | null
          rescan_scan_id?: string | null
          started_on?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprints_rescan_scan_id_fkey"
            columns: ["rescan_scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
