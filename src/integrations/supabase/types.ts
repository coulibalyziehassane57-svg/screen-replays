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
      badges: {
        Row: {
          code: string
          created_at: string
          description: string
          emoji: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          emoji?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      gestures: {
        Row: {
          audio_url: string | null
          common_errors: string | null
          created_at: string
          federation: string | null
          id: string
          image_url: string | null
          meaning: string
          name: string
          restart: string | null
          ruleset_version: string | null
          sanction: string | null
          situation: string
          sport_id: string
          whistle: string | null
          whistle_count: number | null
        }
        Insert: {
          audio_url?: string | null
          common_errors?: string | null
          created_at?: string
          federation?: string | null
          id?: string
          image_url?: string | null
          meaning: string
          name: string
          restart?: string | null
          ruleset_version?: string | null
          sanction?: string | null
          situation: string
          sport_id: string
          whistle?: string | null
          whistle_count?: number | null
        }
        Update: {
          audio_url?: string | null
          common_errors?: string | null
          created_at?: string
          federation?: string | null
          id?: string
          image_url?: string | null
          meaning?: string
          name?: string
          restart?: string | null
          ruleset_version?: string | null
          sanction?: string | null
          situation?: string
          sport_id?: string
          whistle?: string | null
          whistle_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gestures_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          attempts: number
          best_score: number
          completed: boolean
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          best_score?: number
          completed?: boolean
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          best_score?: number
          completed?: boolean
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string
          created_at: string
          examples: Json
          federation: string | null
          id: string
          level: string
          position: number
          ruleset_version: string | null
          situations: Json
          sport_id: string
          summary: string | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          content: string
          created_at?: string
          examples?: Json
          federation?: string | null
          id?: string
          level?: string
          position: number
          ruleset_version?: string | null
          situations?: Json
          sport_id: string
          summary?: string | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          content?: string
          created_at?: string
          examples?: Json
          federation?: string | null
          id?: string
          level?: string
          position?: number
          ruleset_version?: string | null
          situations?: Json
          sport_id?: string
          summary?: string | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          display_name: string
          hidden_from_leaderboard: boolean
          id: string
          last_active_date: string | null
          level: string
          streak_days: number
          updated_at: string
          xp: number
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name?: string
          hidden_from_leaderboard?: boolean
          id: string
          last_active_date?: string | null
          level?: string
          streak_days?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string
          hidden_from_leaderboard?: boolean
          id?: string
          last_active_date?: string | null
          level?: string
          streak_days?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          choices: Json
          correct_index: number
          created_at: string
          difficulty: number
          explanation: string
          federation: string | null
          id: string
          lesson_id: string | null
          prompt: string
          ruleset_version: string | null
          skill: string
          sport_id: string
        }
        Insert: {
          choices: Json
          correct_index: number
          created_at?: string
          difficulty?: number
          explanation: string
          federation?: string | null
          id?: string
          lesson_id?: string | null
          prompt: string
          ruleset_version?: string | null
          skill?: string
          sport_id: string
        }
        Update: {
          choices?: Json
          correct_index?: number
          created_at?: string
          difficulty?: number
          explanation?: string
          federation?: string | null
          id?: string
          lesson_id?: string | null
          prompt?: string
          ruleset_version?: string | null
          skill?: string
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          passed: boolean
          score: number
          total: number
          user_id: string
          wrong_question_ids: Json
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          passed: boolean
          score: number
          total: number
          user_id: string
          wrong_question_ids?: Json
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          passed?: boolean
          score?: number
          total?: number
          user_id?: string
          wrong_question_ids?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_attempts: {
        Row: {
          correct: boolean
          created_at: string
          decision_ms: number
          id: string
          scenario_id: string
          user_id: string
        }
        Insert: {
          correct: boolean
          created_at?: string
          decision_ms?: number
          id?: string
          scenario_id: string
          user_id: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          decision_ms?: number
          id?: string
          scenario_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_attempts_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          correct_index: number
          created_at: string
          difficulty: number
          explanation: string
          federation: string | null
          gesture_id: string | null
          id: string
          level: string
          options: Json
          ruleset_version: string | null
          situation: string
          sport_id: string
          theme: string | null
          wrong_explanations: Json
        }
        Insert: {
          correct_index: number
          created_at?: string
          difficulty?: number
          explanation: string
          federation?: string | null
          gesture_id?: string | null
          id?: string
          level?: string
          options: Json
          ruleset_version?: string | null
          situation: string
          sport_id: string
          theme?: string | null
          wrong_explanations?: Json
        }
        Update: {
          correct_index?: number
          created_at?: string
          difficulty?: number
          explanation?: string
          federation?: string | null
          gesture_id?: string | null
          id?: string
          level?: string
          options?: Json
          ruleset_version?: string | null
          situation?: string
          sport_id?: string
          theme?: string | null
          wrong_explanations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_gesture_id_fkey"
            columns: ["gesture_id"]
            isOneToOne: false
            referencedRelation: "gestures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          emoji: string
          federation: string | null
          id: string
          name: string
          position: number
          ruleset_version: string | null
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          emoji?: string
          federation?: string | null
          id?: string
          name: string
          position?: number
          ruleset_version?: string | null
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          emoji?: string
          federation?: string | null
          id?: string
          name?: string
          position?: number
          ruleset_version?: string | null
          slug?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
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
      user_sports: {
        Row: {
          created_at: string
          sport_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          sport_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          sport_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
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
      seed_lesson: {
        Args: {
          _content: string
          _examples: Json
          _level: string
          _pos: number
          _situations: Json
          _sport: string
          _summary: string
          _title: string
        }
        Returns: string
      }
      seed_q: {
        Args: {
          _choices: Json
          _correct: number
          _expl: string
          _lesson: string
          _prompt: string
          _skill: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
