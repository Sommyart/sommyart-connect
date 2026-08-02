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
      challenges: {
        Row: {
          ai_tool: string | null
          created_at: string
          created_by: string | null
          day_of_week: number | null
          description: string
          ends_at: string | null
          id: string
          is_active: boolean
          kind: string
          prompt: string | null
          starts_at: string
          title: string
          track: string | null
          updated_at: string
        }
        Insert: {
          ai_tool?: string | null
          created_at?: string
          created_by?: string | null
          day_of_week?: number | null
          description?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          prompt?: string | null
          starts_at?: string
          title: string
          track?: string | null
          updated_at?: string
        }
        Update: {
          ai_tool?: string | null
          created_at?: string
          created_by?: string | null
          day_of_week?: number | null
          description?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          prompt?: string | null
          starts_at?: string
          title?: string
          track?: string | null
          updated_at?: string
        }
        Relationships: []
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
      events: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          kind: string
          speaker_image: string | null
          speaker_name: string | null
          speaker_title: string | null
          starts_at: string | null
          title: string
          updated_at: string
          week_of_month: number | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          kind?: string
          speaker_image?: string | null
          speaker_name?: string | null
          speaker_title?: string | null
          starts_at?: string | null
          title: string
          updated_at?: string
          week_of_month?: number | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          kind?: string
          speaker_image?: string | null
          speaker_name?: string | null
          speaker_title?: string | null
          starts_at?: string | null
          title?: string
          updated_at?: string
          week_of_month?: number | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_rsvps: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_rsvps_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          description: string
          duration_minutes: number
          id: string
          meeting_url: string | null
          presenter_id: string | null
          presenter_name: string | null
          recording_url: string | null
          scheduled_at: string
          status: string
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          presenter_id?: string | null
          presenter_name?: string | null
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          title: string
          topic?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          presenter_id?: string | null
          presenter_name?: string | null
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_presenter_id_fkey"
            columns: ["presenter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          kind: string
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      points_log: {
        Row: {
          created_at: string
          id: string
          meta: Json | null
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json | null
          points: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json | null
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          link_url: string | null
          media_type: string
          media_urls: string[]
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          id?: string
          link_url?: string | null
          media_type?: string
          media_urls?: string[]
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          link_url?: string | null
          media_type?: string
          media_urls?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          featured: boolean
          full_name: string
          id: string
          last_active_date: string | null
          monthly_points: number
          occupation: string | null
          phone: string | null
          points: number
          streak: number
          suspended: boolean
          updated_at: string
          username: string
          weekly_points: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          featured?: boolean
          full_name?: string
          id: string
          last_active_date?: string | null
          monthly_points?: number
          occupation?: string | null
          phone?: string | null
          points?: number
          streak?: number
          suspended?: boolean
          updated_at?: string
          username: string
          weekly_points?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          featured?: boolean
          full_name?: string
          id?: string
          last_active_date?: string | null
          monthly_points?: number
          occupation?: string | null
          phone?: string | null
          points?: number
          streak?: number
          suspended?: boolean
          updated_at?: string
          username?: string
          weekly_points?: number
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_likes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string
          download_url: string | null
          downloads: number
          featured: boolean
          id: string
          link_url: string | null
          media_urls: string[]
          owner_id: string
          technologies: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string
          download_url?: string | null
          downloads?: number
          featured?: boolean
          id?: string
          link_url?: string | null
          media_urls?: string[]
          owner_id: string
          technologies?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string
          download_url?: string | null
          downloads?: number
          featured?: boolean
          id?: string
          link_url?: string | null
          media_urls?: string[]
          owner_id?: string
          technologies?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      redemptions: {
        Row: {
          cost: number
          created_at: string
          id: string
          reward_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          id?: string
          reward_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          reward_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          cost: number
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          title?: string
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
      submission_feedback: {
        Row: {
          author_id: string
          created_at: string
          id: string
          improvement: string
          liked: string
          submission_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          improvement: string
          liked: string
          submission_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          improvement?: string
          liked?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_feedback_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_feedback_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          author_id: string
          body: string
          challenge_id: string | null
          created_at: string
          featured: boolean
          id: string
          link_url: string | null
          media_urls: string[]
          title: string
          track: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string
          challenge_id?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          link_url?: string | null
          media_urls?: string[]
          title?: string
          track?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          challenge_id?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          link_url?: string | null
          media_urls?: string[]
          title?: string
          track?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
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
      votes: {
        Row: {
          category: string
          challenge_id: string | null
          created_at: string
          id: string
          submission_id: string
          voter_id: string
        }
        Insert: {
          category: string
          challenge_id?: string | null
          created_at?: string
          id?: string
          submission_id: string
          voter_id: string
        }
        Update: {
          category?: string
          challenge_id?: string | null
          created_at?: string
          id?: string
          submission_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
