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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      allowed_domains: {
        Row: {
          client_id: string
          created_at: string
          domain: string
          id: string
          label: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          domain: string
          id?: string
          label?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          domain?: string
          id?: string
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowed_domains_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "api_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowed_domains_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_usage_stats"
            referencedColumns: ["client_id"]
          },
        ]
      }
      allowed_ips: {
        Row: {
          client_id: string
          created_at: string
          id: string
          ip_address: string
          label: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          ip_address: string
          label?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          ip_address?: string
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowed_ips_reseller_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "api_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowed_ips_reseller_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_usage_stats"
            referencedColumns: ["client_id"]
          },
        ]
      }
      api_clients: {
        Row: {
          api_key: string
          category: string
          created_at: string
          duration_days: number | null
          expires_at: string | null
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          api_key: string
          category?: string
          created_at?: string
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          api_key?: string
          category?: string
          created_at?: string
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          reference: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          reference?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          reference?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          amount_inr: number
          callback_error: string | null
          callback_received_at: string | null
          coins: number
          created_at: string
          credited_at: string | null
          currency: string
          gateway_order_no: string | null
          id: string
          merchant_order_no: string
          payment_url: string | null
          raw_callback: Json | null
          signature_status: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_inr: number
          callback_error?: string | null
          callback_received_at?: string | null
          coins: number
          created_at?: string
          credited_at?: string | null
          currency?: string
          gateway_order_no?: string | null
          id?: string
          merchant_order_no: string
          payment_url?: string | null
          raw_callback?: Json | null
          signature_status?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          callback_error?: string | null
          callback_received_at?: string | null
          coins?: number
          created_at?: string
          credited_at?: string | null
          currency?: string
          gateway_order_no?: string | null
          id?: string
          merchant_order_no?: string
          payment_url?: string | null
          raw_callback?: Json | null
          signature_status?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      request_logs: {
        Row: {
          api_key: string | null
          category: string | null
          client_id: string | null
          created_at: string
          endpoint: string | null
          error_message: string | null
          game: string | null
          host: string | null
          id: string
          ip_address: string | null
          response_time_ms: number | null
          status_code: number | null
          success: boolean
          type: string | null
        }
        Insert: {
          api_key?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          game?: string | null
          host?: string | null
          id?: string
          ip_address?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          success?: boolean
          type?: string | null
        }
        Update: {
          api_key?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          game?: string | null
          host?: string | null
          id?: string
          ip_address?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          success?: boolean
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_logs_reseller_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "api_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_logs_reseller_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_usage_stats"
            referencedColumns: ["client_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_usage_stats: {
        Row: {
          client_id: string | null
          error_count: number | null
          last_request_at: string | null
          success_count: number | null
          total_requests: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_usage_stats: {
        Row: {
          error_count: number | null
          last_request_at: string | null
          success_count: number | null
          total_requests: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_wallet: {
        Args: {
          _delta: number
          _reason: string
          _reference: string
          _type: string
          _user_id: string
        }
        Returns: number
      }
      client_usage_in_range: {
        Args: { _client_ids: string[]; _from: string; _to: string }
        Returns: {
          client_id: string
          error_count: number
          last_request_at: string
          success_count: number
          total_requests: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_usage_in_range: {
        Args: { _from: string; _to: string }
        Returns: {
          error_count: number
          last_request_at: string
          success_count: number
          total_requests: number
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "reseller"
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
    Enums: {
      app_role: ["admin", "reseller"],
    },
  },
} as const
