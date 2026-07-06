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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cabinet_departments: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cabinet_teams: {
        Row: {
          created_at: string
          department_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabinet_teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "cabinet_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_attendees: {
        Row: {
          conference_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          conference_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          conference_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_attendees_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conference_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conferences: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          location: string | null
          name: string
          point_of_contact_user_id: string | null
          published_at: string | null
          region_id: string | null
          scope_level: Database["public"]["Enums"]["conference_scope_level"]
          start_date: string
          status: Database["public"]["Enums"]["conference_status"]
          subregion_id: string | null
          tagline: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          location?: string | null
          name: string
          point_of_contact_user_id?: string | null
          published_at?: string | null
          region_id?: string | null
          scope_level?: Database["public"]["Enums"]["conference_scope_level"]
          start_date: string
          status?: Database["public"]["Enums"]["conference_status"]
          subregion_id?: string | null
          tagline?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          location?: string | null
          name?: string
          point_of_contact_user_id?: string | null
          published_at?: string | null
          region_id?: string | null
          scope_level?: Database["public"]["Enums"]["conference_scope_level"]
          start_date?: string
          status?: Database["public"]["Enums"]["conference_status"]
          subregion_id?: string | null
          tagline?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conferences_point_of_contact_user_id_fkey"
            columns: ["point_of_contact_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conferences_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conferences_subregion_id_fkey"
            columns: ["subregion_id"]
            isOneToOne: false
            referencedRelation: "subregions"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          left_at: string | null
          neighbor_net_id: string | null
          region_id: string | null
          status: Database["public"]["Enums"]["membership_status"]
          subregion_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          neighbor_net_id?: string | null
          region_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          subregion_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          neighbor_net_id?: string | null
          region_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          subregion_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_neighbor_net_id_fkey"
            columns: ["neighbor_net_id"]
            isOneToOne: false
            referencedRelation: "neighbor_nets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_subregion_id_fkey"
            columns: ["subregion_id"]
            isOneToOne: false
            referencedRelation: "subregions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      neighbor_nets: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_expansion: boolean
          name: string
          subregion_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_expansion?: boolean
          name: string
          subregion_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_expansion?: boolean
          name?: string
          subregion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighbor_nets_subregion_id_fkey"
            columns: ["subregion_id"]
            isOneToOne: false
            referencedRelation: "subregions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_expansion: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_expansion?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_expansion?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_assignments: {
        Row: {
          amir_custom_name: string | null
          amir_user_id: string | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          role_type_custom: string | null
          role_type_id: string | null
          scope_id: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amir_custom_name?: string | null
          amir_user_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          role_type_custom?: string | null
          role_type_id?: string | null
          scope_id?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amir_custom_name?: string | null
          amir_user_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          role_type_custom?: string | null
          role_type_id?: string | null
          scope_id?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_amir_user_id_fkey"
            columns: ["amir_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_role_type_id_fkey"
            columns: ["role_type_id"]
            isOneToOne: false
            referencedRelation: "role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_types: {
        Row: {
          category: Database["public"]["Enums"]["role_category"]
          code: string
          created_at: string
          description: string | null
          id: string
          max_per_scope: number | null
          name: string
          scope_type: Database["public"]["Enums"]["scope_type"]
          sort_order: number
        }
        Insert: {
          category: Database["public"]["Enums"]["role_category"]
          code: string
          created_at?: string
          description?: string | null
          id?: string
          max_per_scope?: number | null
          name: string
          scope_type: Database["public"]["Enums"]["scope_type"]
          sort_order?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["role_category"]
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          max_per_scope?: number | null
          name?: string
          scope_type?: Database["public"]["Enums"]["scope_type"]
          sort_order?: number
        }
        Relationships: []
      }
      session_check_ins: {
        Row: {
          checked_in_at: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_check_ins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_signups: {
        Row: {
          created_at: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_signups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_signups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          capacity: number | null
          check_in_code: string | null
          conference_id: string
          created_at: string
          description: string | null
          end_at: string
          id: string
          is_break: boolean
          room: string | null
          speaker: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          check_in_code?: string | null
          conference_id: string
          created_at?: string
          description?: string | null
          end_at: string
          id?: string
          is_break?: boolean
          room?: string | null
          speaker?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          check_in_code?: string | null
          conference_id?: string
          created_at?: string
          description?: string | null
          end_at?: string
          id?: string
          is_break?: boolean
          room?: string | null
          speaker?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
      }
      subregions: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_expansion: boolean
          name: string
          region_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_expansion?: boolean
          name: string
          region_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_expansion?: boolean
          name?: string
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subregions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          created_count: number | null
          errors_count: number | null
          id: string
          skipped_count: number | null
          started_at: string
          status: string
          total_count: number | null
          triggered_by: string
          updated_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_count?: number | null
          errors_count?: number | null
          id?: string
          skipped_count?: number | null
          started_at?: string
          status?: string
          total_count?: number | null
          triggered_by: string
          updated_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_count?: number | null
          errors_count?: number | null
          id?: string
          skipped_count?: number | null
          started_at?: string
          status?: string
          total_count?: number | null
          triggered_by?: string
          updated_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_projects: {
        Row: {
          amir_custom_name: string | null
          amir_user_id: string | null
          created_at: string
          description: string | null
          end_month: number | null
          end_year: number | null
          id: string
          is_current: boolean
          project_type: string | null
          project_type_custom: string | null
          role: string | null
          start_month: number | null
          start_year: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amir_custom_name?: string | null
          amir_user_id?: string | null
          created_at?: string
          description?: string | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          project_type?: string | null
          project_type_custom?: string | null
          role?: string | null
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amir_custom_name?: string | null
          amir_user_id?: string | null
          created_at?: string
          description?: string | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          project_type?: string | null
          project_type_custom?: string | null
          role?: string | null
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_amir_user_id_fkey"
            columns: ["amir_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          claimed_at: string | null
          created_at: string
          date_of_birth: string | null
          education: Json | null
          education_level: string | null
          email: string
          ethnicity: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed_at: string | null
          personal_email: string | null
          phone: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          claimed_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: Json | null
          education_level?: string | null
          email: string
          ethnicity?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed_at?: string | null
          personal_email?: string | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          claimed_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: Json | null
          education_level?: string | null
          email?: string
          ethnicity?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed_at?: string | null
          personal_email?: string | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_signup: { Args: { p_session_id: string }; Returns: Json }
      check_in_to_session: {
        Args: { p_code: string; p_session_id: string }
        Returns: Json
      }
      get_current_user_id: { Args: never; Returns: string }
      is_authenticated: { Args: never; Returns: boolean }
      is_event_admin: { Args: { p_user_id: string }; Returns: boolean }
      publish_conference: { Args: { p_id: string }; Returns: Json }
      remove_attendee: {
        Args: { p_conference_id: string; p_user_id: string }
        Returns: Json
      }
      signup_for_session: { Args: { p_session_id: string }; Returns: Json }
    }
    Enums: {
      conference_scope_level: "national" | "regional" | "subregional"
      conference_status: "draft" | "published"
      membership_status: "active" | "alumni" | "inactive"
      role_category:
        | "ns"
        | "council"
        | "regional"
        | "subregional"
        | "neighbor_net"
        | "cabinet"
        | "cloud"
        | "system"
      scope_type:
        | "national"
        | "region"
        | "subregion"
        | "neighbor_net"
        | "cabinet_department"
        | "cabinet_team"
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
      conference_scope_level: ["national", "regional", "subregional"],
      conference_status: ["draft", "published"],
      membership_status: ["active", "alumni", "inactive"],
      role_category: [
        "ns",
        "council",
        "regional",
        "subregional",
        "neighbor_net",
        "cabinet",
        "cloud",
        "system",
      ],
      scope_type: [
        "national",
        "region",
        "subregion",
        "neighbor_net",
        "cabinet_department",
        "cabinet_team",
      ],
    },
  },
} as const
