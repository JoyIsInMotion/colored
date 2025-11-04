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
      item_photos: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          item_id: string
          path: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          item_id: string
          path: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          item_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_photos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_type_aliases: {
        Row: {
          alias: string
          type_id: number
        }
        Insert: {
          alias: string
          type_id: number
        }
        Update: {
          alias?: string
          type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_type_aliases_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "item_types"
            referencedColumns: ["id"]
          },
        ]
      }
      item_types: {
        Row: {
          category_slug: string
          id: number
          label: string
          slug: string
          sort: number | null
        }
        Insert: {
          category_slug: string
          id?: number
          label: string
          slug: string
          sort?: number | null
        }
        Update: {
          category_slug?: string
          id?: number
          label?: string
          slug?: string
          sort?: number | null
        }
        Relationships: []
      }
      items: {
        Row: {
          brand: string | null
          category: Database["public"]["Enums"]["item_category"]
          color_hex: string | null
          cover_path: string | null
          created_at: string
          cutout_path: string | null
          id: string
          image_processing_status: string
          is_public: boolean
          notes: string | null
          original_path: string | null
          price: number | null
          purchase_date: string | null
          season: string | null
          size: string | null
          title: string
          type_id: number | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          color_hex?: string | null
          cover_path?: string | null
          created_at?: string
          cutout_path?: string | null
          id?: string
          image_processing_status?: string
          is_public?: boolean
          notes?: string | null
          original_path?: string | null
          price?: number | null
          purchase_date?: string | null
          season?: string | null
          size?: string | null
          title: string
          type_id?: number | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          color_hex?: string | null
          cover_path?: string | null
          created_at?: string
          cutout_path?: string | null
          id?: string
          image_processing_status?: string
          is_public?: boolean
          notes?: string | null
          original_path?: string | null
          price?: number | null
          purchase_date?: string | null
          season?: string | null
          size?: string | null
          title?: string
          type_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "item_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_items: {
        Row: {
          added_at: string
          item_id: string
          outfit_id: string
        }
        Insert: {
          added_at?: string
          item_id: string
          outfit_id: string
        }
        Update: {
          added_at?: string
          item_id?: string
          outfit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          cover_path: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      palette_swatches: {
        Row: {
          h: number | null
          hex: string
          id: string
          l: number | null
          name: string | null
          palette_id: string
          rank: number | null
          s: number | null
        }
        Insert: {
          h?: number | null
          hex: string
          id?: string
          l?: number | null
          name?: string | null
          palette_id: string
          rank?: number | null
          s?: number | null
        }
        Update: {
          h?: number | null
          hex?: string
          id?: string
          l?: number | null
          name?: string | null
          palette_id?: string
          rank?: number | null
          s?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "palette_swatches_palette_id_fkey"
            columns: ["palette_id"]
            isOneToOne: false
            referencedRelation: "palettes"
            referencedColumns: ["id"]
          },
        ]
      }
      palettes: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          season: Database["public"]["Enums"]["palette_season"]
          subtype: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          season: Database["public"]["Enums"]["palette_season"]
          subtype?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          season?: Database["public"]["Enums"]["palette_season"]
          subtype?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palettes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          username?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          username?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          link: string | null
          name: string
          price: number | null
          tags: string[] | null
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          name: string
          price?: number | null
          tags?: string[] | null
          wishlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          name?: string
          price?: number | null
          tags?: string[] | null
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
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
      [_ in never]: never
    }
    Enums: {
      item_category:
        | "top"
        | "bottom"
        | "dress"
        | "outerwear"
        | "shoes"
        | "bag"
        | "accessory"
        | "beauty"
        | "other"
      palette_season: "spring" | "summer" | "autumn" | "winter"
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
      item_category: [
        "top",
        "bottom",
        "dress",
        "outerwear",
        "shoes",
        "bag",
        "accessory",
        "beauty",
        "other",
      ],
      palette_season: ["spring", "summer", "autumn", "winter"],
    },
  },
} as const
