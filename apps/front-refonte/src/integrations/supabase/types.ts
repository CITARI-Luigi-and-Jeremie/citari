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
      mentions: {
        Row: {
          brand: string
          created_at: string
          id: string
          is_recommended: boolean
          position: number | null
          response_id: string
          scan_id: string
          sentiment: string | null
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          is_recommended?: boolean
          position?: number | null
          response_id: string
          scan_id: string
          sentiment?: string | null
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          is_recommended?: boolean
          position?: number | null
          response_id?: string
          scan_id?: string
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentions_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses_meta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans_public"
            referencedColumns: ["id"]
          },
        ]
      }
      queries: {
        Row: {
          created_at: string
          id: string
          position: number
          scan_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          position: number
          scan_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
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
          {
            foreignKeyName: "queries_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans_public"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          created_at: string
          engine: string
          id: string
          latency_ms: number | null
          query_id: string
          scan_id: string
          text: string | null
        }
        Insert: {
          created_at?: string
          engine: string
          id?: string
          latency_ms?: number | null
          query_id: string
          scan_id: string
          text?: string | null
        }
        Update: {
          created_at?: string
          engine?: string
          id?: string
          latency_ms?: number | null
          query_id?: string
          scan_id?: string
          text?: string | null
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
          {
            foreignKeyName: "responses_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans_public"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          scan_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          scan_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          scan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_leads_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_leads_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans_public"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          actions: Json | null
          brand: string
          competitors: string[]
          cost_cents: number
          created_at: string
          domain: string
          error: string | null
          id: string
          progress: number
          score: number | null
          score_detail: Json | null
          sector: string | null
          share_of_voice: Json | null
          started_at: string
          status: string
        }
        Insert: {
          actions?: Json | null
          brand: string
          competitors?: string[]
          cost_cents?: number
          created_at?: string
          domain: string
          error?: string | null
          id?: string
          progress?: number
          score?: number | null
          score_detail?: Json | null
          sector?: string | null
          share_of_voice?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          actions?: Json | null
          brand?: string
          competitors?: string[]
          cost_cents?: number
          created_at?: string
          domain?: string
          error?: string | null
          id?: string
          progress?: number
          score?: number | null
          score_detail?: Json | null
          sector?: string | null
          share_of_voice?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      responses_meta: {
        Row: {
          created_at: string | null
          engine: string | null
          id: string | null
          latency_ms: number | null
          query_id: string | null
          scan_id: string | null
        }
        Insert: {
          created_at?: string | null
          engine?: string | null
          id?: string | null
          latency_ms?: number | null
          query_id?: string | null
          scan_id?: string | null
        }
        Update: {
          created_at?: string | null
          engine?: string | null
          id?: string | null
          latency_ms?: number | null
          query_id?: string | null
          scan_id?: string | null
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
          {
            foreignKeyName: "responses_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans_public"
            referencedColumns: ["id"]
          },
        ]
      }
      scans_public: {
        Row: {
          brand: string | null
          competitors: string[] | null
          created_at: string | null
          domain: string | null
          id: string | null
          progress: number | null
          score: number | null
          score_detail: Json | null
          sector: string | null
          share_of_voice: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          brand?: string | null
          competitors?: string[] | null
          created_at?: string | null
          domain?: string | null
          id?: string | null
          progress?: number | null
          score?: number | null
          score_detail?: Json | null
          sector?: string | null
          share_of_voice?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          brand?: string | null
          competitors?: string[] | null
          created_at?: string | null
          domain?: string | null
          id?: string | null
          progress?: number | null
          score?: number | null
          score_detail?: Json | null
          sector?: string | null
          share_of_voice?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
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
