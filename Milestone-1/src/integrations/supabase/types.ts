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
      athlete_profiles: {
        Row: {
          age: number | null
          coach_name: string | null
          contact_number: string | null
          created_at: string
          created_by: string | null
          current_medical_conditions: string | null
          dominant_side: string | null
          email: string | null
          emergency_contact: string | null
          full_name: string
          gender: string | null
          height_cm: number | null
          id: string
          injury_history: string | null
          notes: string | null
          position: string | null
          sport_type: string
          team_club: string | null
          training_experience: string | null
          training_load: string | null
          updated_at: string
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          coach_name?: string | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          current_medical_conditions?: string | null
          dominant_side?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          injury_history?: string | null
          notes?: string | null
          position?: string | null
          sport_type: string
          team_club?: string | null
          training_experience?: string | null
          training_load?: string | null
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          coach_name?: string | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          current_medical_conditions?: string | null
          dominant_side?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          injury_history?: string | null
          notes?: string | null
          position?: string | null
          sport_type?: string
          team_club?: string | null
          training_experience?: string | null
          training_load?: string | null
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
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
      pose_analyses: {
        Row: {
          analyzed_by: string | null
          athlete_user_id: string
          created_at: string
          duration_seconds: number
          frame_count: number
          id: string
          joint_metrics: Json
          movement_quality_score: number
          risk_flags: string[]
          updated_at: string
          video_submission_id: string
        }
        Insert: {
          analyzed_by?: string | null
          athlete_user_id: string
          created_at?: string
          duration_seconds?: number
          frame_count?: number
          id?: string
          joint_metrics?: Json
          movement_quality_score?: number
          risk_flags?: string[]
          updated_at?: string
          video_submission_id: string
        }
        Update: {
          analyzed_by?: string | null
          athlete_user_id?: string
          created_at?: string
          duration_seconds?: number
          frame_count?: number
          id?: string
          joint_metrics?: Json
          movement_quality_score?: number
          risk_flags?: string[]
          updated_at?: string
          video_submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pose_analyses_analyzed_by_fkey"
            columns: ["analyzed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pose_analyses_athlete_user_id_fkey"
            columns: ["athlete_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pose_analyses_video_submission_id_fkey"
            columns: ["video_submission_id"]
            isOneToOne: true
            referencedRelation: "video_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_submissions: {
        Row: {
          athlete_user_id: string
          created_at: string
          id: string
          notes: string | null
          status: string
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          athlete_user_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          athlete_user_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_submissions_athlete_user_id_fkey"
            columns: ["athlete_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "athlete"
        | "coach"
        | "physiotherapist"
        | "sports_scientist"
        | "administrator"
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
      app_role: [
        "athlete",
        "coach",
        "physiotherapist",
        "sports_scientist",
        "administrator",
      ],
    },
  },
} as const
