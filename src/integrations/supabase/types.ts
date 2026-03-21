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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      pwa_installations: {
        Row: {
          created_at: string
          id: string
          installed_at: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          installed_at?: string
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          installed_at?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pwa_installations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          color_primary: string | null
          color_secondary: string | null
          company_name: string
          created_at: string
          custom_domain: string | null
          id: string
          login_bg_color: string | null
          login_bg_image: string | null
          login_sidebar_color: string | null
          logo_url: string | null
          max_devices: number
          owner_email: string | null
          plan_type: string
          slug: string
          subscription_status: string
          traccar_url: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string | null
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          color_primary?: string | null
          color_secondary?: string | null
          company_name: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          login_bg_color?: string | null
          login_bg_image?: string | null
          login_sidebar_color?: string | null
          logo_url?: string | null
          max_devices?: number
          owner_email?: string | null
          plan_type?: string
          slug: string
          subscription_status?: string
          traccar_url: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          color_primary?: string | null
          color_secondary?: string | null
          company_name?: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          login_bg_color?: string | null
          login_bg_image?: string | null
          login_sidebar_color?: string | null
          logo_url?: string | null
          max_devices?: number
          owner_email?: string | null
          plan_type?: string
          slug?: string
          subscription_status?: string
          traccar_url?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      traccar_sessions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          session_cookie: string
          tenant_id: string
          traccar_user_id: number | null
          user_email: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          session_cookie: string
          tenant_id: string
          traccar_user_id?: number | null
          user_email: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          session_cookie?: string
          tenant_id?: string
          traccar_user_id?: number | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "traccar_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_alert_configs: {
        Row: {
          alert_type: string
          created_at: string
          enabled: boolean
          id: string
          template_message: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          enabled?: boolean
          id?: string
          template_message?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          enabled?: boolean
          id?: string
          template_message?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_alert_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_device_alert_prefs: {
        Row: {
          alert_type: string
          created_at: string
          device_id: number
          enabled: boolean
          id: string
          tenant_id: string
          updated_at: string
          user_email: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          device_id: number
          enabled?: boolean
          id?: string
          tenant_id: string
          updated_at?: string
          user_email: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          device_id?: number
          enabled?: boolean
          id?: string
          tenant_id?: string
          updated_at?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_device_alert_prefs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          id: string
          phone_number: string | null
          status: string
          tenant_id: string
          uazapi_instance_id: string | null
          uazapi_token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number?: string | null
          status?: string
          tenant_id: string
          uazapi_instance_id?: string | null
          uazapi_token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string | null
          status?: string
          tenant_id?: string
          uazapi_instance_id?: string | null
          uazapi_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_content: string
          message_type: string
          recipient_phone: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_content: string
          message_type?: string
          recipient_phone: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_content?: string
          message_type?: string
          recipient_phone?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
