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
      arbitrage_trades: {
        Row: {
          actual_profit: number | null
          buy_dex: string
          contract_address: string
          created_at: string
          estimated_profit: number
          executed_at: string
          id: string
          opportunity_id: string
          sell_dex: string
          status: string
          token_pair: string
          tx_hash: string
        }
        Insert: {
          actual_profit?: number | null
          buy_dex: string
          contract_address: string
          created_at?: string
          estimated_profit: number
          executed_at?: string
          id?: string
          opportunity_id: string
          sell_dex: string
          status?: string
          token_pair: string
          tx_hash: string
        }
        Update: {
          actual_profit?: number | null
          buy_dex?: string
          contract_address?: string
          created_at?: string
          estimated_profit?: number
          executed_at?: string
          id?: string
          opportunity_id?: string
          sell_dex?: string
          status?: string
          token_pair?: string
          tx_hash?: string
        }
        Relationships: []
      }
      deployed_contracts: {
        Row: {
          aave_pool_provider: string | null
          abi: Json | null
          contract_address: string
          contract_name: string | null
          created_at: string
          deployed_at: string
          deployment_cost: number | null
          deployment_tx: string | null
          gas_price: number | null
          gas_used: number | null
          id: string
          network: string | null
          status: string | null
          updated_at: string | null
          verification_status: string | null
          verification_url: string | null
          wallet_address: string
        }
        Insert: {
          aave_pool_provider?: string | null
          abi?: Json | null
          contract_address: string
          contract_name?: string | null
          created_at?: string
          deployed_at?: string
          deployment_cost?: number | null
          deployment_tx?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          network?: string | null
          status?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verification_url?: string | null
          wallet_address: string
        }
        Update: {
          aave_pool_provider?: string | null
          abi?: Json | null
          contract_address?: string
          contract_name?: string | null
          created_at?: string
          deployed_at?: string
          deployment_cost?: number | null
          deployment_tx?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          network?: string | null
          status?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verification_url?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      deployment_configs: {
        Row: {
          auto_deploy: boolean | null
          created_at: string
          gas_price_gwei: number | null
          id: string
          network: string
          rpc_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_deploy?: boolean | null
          created_at?: string
          gas_price_gwei?: number | null
          id?: string
          network?: string
          rpc_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_deploy?: boolean | null
          created_at?: string
          gas_price_gwei?: number | null
          id?: string
          network?: string
          rpc_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
