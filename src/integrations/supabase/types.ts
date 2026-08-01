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
      activities: {
        Row: {
          created_at: string
          day: number
          description: string
          id: string
          image: string | null
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day: number
          description: string
          id?: string
          image?: string | null
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: number
          description?: string
          id?: string
          image?: string | null
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_pinned: boolean
          message: string
          publish_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          message: string
          publish_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          message?: string
          publish_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          member_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          member_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      business_posts: {
        Row: {
          business_name: string | null
          caption: string | null
          created_at: string
          id: string
          images: string[]
          member_id: string
          member_image: string | null
          member_nickname: string
          post_date: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          images: string[]
          member_id: string
          member_image?: string | null
          member_nickname: string
          post_date?: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          images?: string[]
          member_id?: string
          member_image?: string | null
          member_nickname?: string
          post_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_posts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          member_id: string
          month: number
          remarks: string | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          member_id: string
          month: number
          remarks?: string | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          member_id?: string
          month?: number
          remarks?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_completions: {
        Row: {
          created_at: string
          date: string
          id: string
          kind: string
          member_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          kind: string
          member_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          kind?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_completions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_badges: {
        Row: {
          badge: string
          earned_at: string
          id: string
          member_id: string
        }
        Insert: {
          badge: string
          earned_at?: string
          id?: string
          member_id: string
        }
        Update: {
          badge?: string
          earned_at?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_points: {
        Row: {
          best_quiz_score: number
          created_at: string
          featured: boolean
          games_won: number
          member_id: string
          nickname: string
          profile_picture: string | null
          quizzes_played: number
          riddles_solved: number
          total_points: number
          updated_at: string
        }
        Insert: {
          best_quiz_score?: number
          created_at?: string
          featured?: boolean
          games_won?: number
          member_id: string
          nickname: string
          profile_picture?: string | null
          quizzes_played?: number
          riddles_solved?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          best_quiz_score?: number
          created_at?: string
          featured?: boolean
          games_won?: number
          member_id?: string
          nickname?: string
          profile_picture?: string | null
          quizzes_played?: number
          riddles_solved?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_points_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          member_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          member_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          member_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          birth_day: number
          birth_month: number
          created_at: string
          id: string
          is_active: boolean
          nickname: string
          occupation: string
          password_hint: string | null
          pin_hash: string | null
          pin_reset_requested: boolean
          profile_picture: string | null
          real_name: string
          updated_at: string
        }
        Insert: {
          birth_day: number
          birth_month: number
          created_at?: string
          id?: string
          is_active?: boolean
          nickname: string
          occupation: string
          password_hint?: string | null
          pin_hash?: string | null
          pin_reset_requested?: boolean
          profile_picture?: string | null
          real_name: string
          updated_at?: string
        }
        Update: {
          birth_day?: number
          birth_month?: number
          created_at?: string
          id?: string
          is_active?: boolean
          nickname?: string
          occupation?: string
          password_hint?: string | null
          pin_hash?: string | null
          pin_reset_requested?: boolean
          profile_picture?: string | null
          real_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          created_at: string
          id: string
          member_id: string
          points: number
          reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          points: number
          reason: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          points?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          answer_index: number
          category: string
          created_at: string
          difficulty: string
          id: string
          is_active: boolean
          options: string[]
          question: string
          updated_at: string
        }
        Insert: {
          answer_index: number
          category: string
          created_at?: string
          difficulty?: string
          id?: string
          is_active?: boolean
          options: string[]
          question: string
          updated_at?: string
        }
        Update: {
          answer_index?: number
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_active?: boolean
          options?: string[]
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      riddles: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
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
      whatsapp_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          created_at: string
          device: string | null
          id: string
          join_clicked: boolean
          joined_at: string | null
          member_id: string
          nickname: string
          real_name: string
          updated_at: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          created_at?: string
          device?: string | null
          id?: string
          join_clicked?: boolean
          joined_at?: string | null
          member_id: string
          nickname: string
          real_name: string
          updated_at?: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          created_at?: string
          device?: string | null
          id?: string
          join_clicked?: boolean
          joined_at?: string | null
          member_id?: string
          nickname?: string
          real_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_consents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      winners: {
        Row: {
          activity: string
          congratulation_message: string | null
          created_at: string
          date: string
          id: string
          member_id: string | null
          updated_at: string
          winner_image: string | null
          winner_name: string
        }
        Insert: {
          activity: string
          congratulation_message?: string | null
          created_at?: string
          date?: string
          id?: string
          member_id?: string | null
          updated_at?: string
          winner_image?: string | null
          winner_name: string
        }
        Update: {
          activity?: string
          congratulation_message?: string | null
          created_at?: string
          date?: string
          id?: string
          member_id?: string | null
          updated_at?: string
          winner_image?: string | null
          winner_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "winners_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
