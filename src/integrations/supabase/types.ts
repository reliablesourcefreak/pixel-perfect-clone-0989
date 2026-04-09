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
      artwork_analysis: {
        Row: {
          ai_description: string | null
          artwork_id: string
          color_palette: Json | null
          composition: string | null
          created_at: string
          id: string
          moods: string[] | null
          styles: string[] | null
          technical_details: string | null
        }
        Insert: {
          ai_description?: string | null
          artwork_id: string
          color_palette?: Json | null
          composition?: string | null
          created_at?: string
          id?: string
          moods?: string[] | null
          styles?: string[] | null
          technical_details?: string | null
        }
        Update: {
          ai_description?: string | null
          artwork_id?: string
          color_palette?: Json | null
          composition?: string | null
          created_at?: string
          id?: string
          moods?: string[] | null
          styles?: string[] | null
          technical_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_analysis_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: true
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_categories: {
        Row: {
          artwork_id: string
          category: string
          confidence: number
          id: string
        }
        Insert: {
          artwork_id: string
          category: string
          confidence?: number
          id?: string
        }
        Update: {
          artwork_id?: string
          category?: string
          confidence?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_categories_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_tags: {
        Row: {
          artwork_id: string
          id: string
          tag: string
        }
        Insert: {
          artwork_id: string
          id?: string
          tag: string
        }
        Update: {
          artwork_id?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_tags_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      artworks: {
        Row: {
          analysis_status: string
          created_at: string
          file_size_bytes: number | null
          height: number | null
          id: string
          image_url: string
          is_favorited: boolean
          title: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          analysis_status?: string
          created_at?: string
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          image_url: string
          is_favorited?: boolean
          title: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          analysis_status?: string
          created_at?: string
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          image_url?: string
          is_favorited?: boolean
          title?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      codex_artwork_links: {
        Row: {
          artwork_id: string
          codex_entry_id: string
          id: string
        }
        Insert: {
          artwork_id: string
          codex_entry_id: string
          id?: string
        }
        Update: {
          artwork_id?: string
          codex_entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "codex_artwork_links_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codex_artwork_links_codex_entry_id_fkey"
            columns: ["codex_entry_id"]
            isOneToOne: false
            referencedRelation: "codex_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      codex_entries: {
        Row: {
          ai_summary: string | null
          content: string
          created_at: string
          id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          content?: string
          created_at?: string
          id?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_artworks: {
        Row: {
          added_at: string
          artwork_id: string
          collection_id: string
          id: string
        }
        Insert: {
          added_at?: string
          artwork_id: string
          collection_id: string
          id?: string
        }
        Update: {
          added_at?: string
          artwork_id?: string
          collection_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_artworks_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_artworks_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          color: string
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          is_pinned: boolean
          is_public: boolean
          is_smart: boolean
          name: string
          smart_rules: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_pinned?: boolean
          is_public?: boolean
          is_smart?: boolean
          name: string
          smart_rules?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_pinned?: boolean
          is_public?: boolean
          is_smart?: boolean
          name?: string
          smart_rules?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          portfolio_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          portfolio_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          portfolio_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          ai_summary: string | null
          created_at: string
          description: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          description?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          description?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      story_scenes: {
        Row: {
          artwork_id: string | null
          codex_entry_id: string | null
          created_at: string
          description: string
          id: string
          scene_number: number
          story_id: string
          title: string
        }
        Insert: {
          artwork_id?: string | null
          codex_entry_id?: string | null
          created_at?: string
          description?: string
          id?: string
          scene_number?: number
          story_id: string
          title?: string
        }
        Update: {
          artwork_id?: string | null
          codex_entry_id?: string | null
          created_at?: string
          description?: string
          id?: string
          scene_number?: number
          story_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_scenes_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_scenes_codex_entry_id_fkey"
            columns: ["codex_entry_id"]
            isOneToOne: false
            referencedRelation: "codex_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_scenes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
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
