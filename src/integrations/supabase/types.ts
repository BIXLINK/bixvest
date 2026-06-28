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
      activation_codes: {
        Row: {
          amount: number | null
          assigned_email: string | null
          code: string
          created_at: string
          created_by: string | null
          currency: string | null
          email: string | null
          expires_at: string | null
          gateway: string | null
          generated_by: string
          id: string
          payment_id: string | null
          status: Database["public"]["Enums"]["code_status"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          amount?: number | null
          assigned_email?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          expires_at?: string | null
          gateway?: string | null
          generated_by?: string
          id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["code_status"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          amount?: number | null
          assigned_email?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          expires_at?: string | null
          gateway?: string | null
          generated_by?: string
          id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["code_status"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activation_codes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          payload: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      campaign_participations: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          proof: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          vst_awarded: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          proof?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          vst_awarded?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          proof?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          vst_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number
          created_at: string
          created_by: string | null
          description: string
          end_at: string | null
          ends_at: string | null
          id: string
          min_bix_score: number
          spent: number
          start_at: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          target_audience: Json
          title: string
          vst_reward: number
        }
        Insert: {
          budget?: number
          created_at?: string
          created_by?: string | null
          description?: string
          end_at?: string | null
          ends_at?: string | null
          id?: string
          min_bix_score?: number
          spent?: number
          start_at?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          target_audience?: Json
          title: string
          vst_reward?: number
        }
        Update: {
          budget?: number
          created_at?: string
          created_by?: string | null
          description?: string
          end_at?: string | null
          ends_at?: string | null
          id?: string
          min_bix_score?: number
          spent?: number
          start_at?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          target_audience?: Json
          title?: string
          vst_reward?: number
        }
        Relationships: []
      }
      daily_claims: {
        Row: {
          amount: number
          claim_date: string
          claim_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          claim_date?: string
          claim_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          claim_date?: string
          claim_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      invest_holdings: {
        Row: {
          amount: number
          ended_at: string | null
          id: string
          product_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          ended_at?: string | null
          id?: string
          product_id: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          ended_at?: string | null
          id?: string
          product_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invest_holdings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "invest_products"
            referencedColumns: ["id"]
          },
        ]
      }
      invest_products: {
        Row: {
          apr: number
          created_at: string
          description: string
          id: string
          min_amount: number
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          apr?: number
          created_at?: string
          description?: string
          id?: string
          min_amount?: number
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          apr?: number
          created_at?: string
          description?: string
          id?: string
          min_amount?: number
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      invest_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          note: string | null
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      invest_wallet: {
        Row: {
          balance: number
          currency: string
          locked: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency?: string
          locked?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency?: string
          locked?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_missions: {
        Row: {
          description: string
          id: string
          order_index: number
          reward: number
          title: string
        }
        Insert: {
          description: string
          id: string
          order_index?: number
          reward?: number
          title: string
        }
        Update: {
          description?: string
          id?: string
          order_index?: number
          reward?: number
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          activation_code_id: string | null
          amount: number
          created_at: string
          currency: string
          email: string
          gateway: string
          id: string
          payment_reference: string
          raw: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activation_code_id?: string | null
          amount: number
          created_at?: string
          currency?: string
          email: string
          gateway: string
          id?: string
          payment_reference: string
          raw?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activation_code_id?: string | null
          amount?: number
          created_at?: string
          currency?: string
          email?: string
          gateway?: string
          id?: string
          payment_reference?: string
          raw?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_activation_code_id_fkey"
            columns: ["activation_code_id"]
            isOneToOne: false
            referencedRelation: "activation_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activated_at: string | null
          bix_level: number
          bix_score: number
          created_at: string
          current_stake_level: number
          current_streak: number
          email: string
          email_normalized: string | null
          full_name: string
          id: string
          last_claim_date: string | null
          membership_status: Database["public"]["Enums"]["membership_status"]
          referral_code: string
          referred_by: string | null
          updated_at: string
          verified: boolean
          vst_balance: number
          vst_locked: number
        }
        Insert: {
          activated_at?: string | null
          bix_level?: number
          bix_score?: number
          created_at?: string
          current_stake_level?: number
          current_streak?: number
          email: string
          email_normalized?: string | null
          full_name?: string
          id: string
          last_claim_date?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          referral_code: string
          referred_by?: string | null
          updated_at?: string
          verified?: boolean
          vst_balance?: number
          vst_locked?: number
        }
        Update: {
          activated_at?: string | null
          bix_level?: number
          bix_score?: number
          created_at?: string
          current_stake_level?: number
          current_streak?: number
          email?: string
          email_normalized?: string | null
          full_name?: string
          id?: string
          last_claim_date?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
          verified?: boolean
          vst_balance?: number
          vst_locked?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      stake_levels: {
        Row: {
          created_at: string
          level: number
          name: string
          vst_required: number
        }
        Insert: {
          created_at?: string
          level: number
          name: string
          vst_required: number
        }
        Update: {
          created_at?: string
          level?: number
          name?: string
          vst_required?: number
        }
        Relationships: []
      }
      stakes: {
        Row: {
          amount: number
          created_at: string
          id: string
          level: number
          status: Database["public"]["Enums"]["stake_status"]
          unstaked_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          level: number
          status?: Database["public"]["Enums"]["stake_status"]
          unstaked_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          level?: number
          status?: Database["public"]["Enums"]["stake_status"]
          unstaked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakes_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "stake_levels"
            referencedColumns: ["level"]
          },
        ]
      }
      staking_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          payload: Json | null
          stake_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          stake_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          stake_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staking_audit_stake_id_fkey"
            columns: ["stake_id"]
            isOneToOne: false
            referencedRelation: "user_stakes_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      staking_pools: {
        Row: {
          apy: number
          auto_compound_supported: boolean
          capacity: number | null
          capacity_used: number
          created_at: string
          description: string | null
          emergency_penalty_pct: number
          id: string
          lock_days: number
          max_stake: number | null
          min_stake: number
          name: string
          reward_frequency: string
          risk_level: string
          slug: string
          status: string
          updated_at: string
          vip_only: boolean
        }
        Insert: {
          apy: number
          auto_compound_supported?: boolean
          capacity?: number | null
          capacity_used?: number
          created_at?: string
          description?: string | null
          emergency_penalty_pct?: number
          id?: string
          lock_days?: number
          max_stake?: number | null
          min_stake?: number
          name: string
          reward_frequency?: string
          risk_level?: string
          slug: string
          status?: string
          updated_at?: string
          vip_only?: boolean
        }
        Update: {
          apy?: number
          auto_compound_supported?: boolean
          capacity?: number | null
          capacity_used?: number
          created_at?: string
          description?: string | null
          emergency_penalty_pct?: number
          id?: string
          lock_days?: number
          max_stake?: number | null
          min_stake?: number
          name?: string
          reward_frequency?: string
          risk_level?: string
          slug?: string
          status?: string
          updated_at?: string
          vip_only?: boolean
        }
        Relationships: []
      }
      staking_rewards: {
        Row: {
          amount: number
          claimed: boolean
          created_at: string
          id: string
          period_end: string
          period_start: string
          posted_tx_id: string | null
          stake_id: string
          user_id: string
        }
        Insert: {
          amount: number
          claimed?: boolean
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          posted_tx_id?: string | null
          stake_id: string
          user_id: string
        }
        Update: {
          amount?: number
          claimed?: boolean
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          posted_tx_id?: string | null
          stake_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staking_rewards_stake_id_fkey"
            columns: ["stake_id"]
            isOneToOne: false
            referencedRelation: "user_stakes_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          proof: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
          task_id: string | null
          user_id: string
          vst_awarded: number
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          proof?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          task_id?: string | null
          user_id: string
          vst_awarded?: number
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          proof?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          task_id?: string | null
          user_id?: string
          vst_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          ends_at: string | null
          id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          type: Database["public"]["Enums"]["task_type"]
          vst_reward: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          type?: Database["public"]["Enums"]["task_type"]
          vst_reward?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          vst_reward?: number
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          status: string
          user_id: string
          vst_awarded: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          status?: string
          user_id: string
          vst_awarded?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          status?: string
          user_id?: string
          vst_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "onboarding_missions"
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
      user_stakes_v2: {
        Row: {
          auto_compound: boolean
          created_at: string
          id: string
          last_reward_at: string | null
          lock_tx_id: string | null
          pool_id: string
          principal: number
          rewards_accrued: number
          rewards_claimed: number
          started_at: string
          status: string
          unlock_at: string | null
          unlock_tx_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_compound?: boolean
          created_at?: string
          id?: string
          last_reward_at?: string | null
          lock_tx_id?: string | null
          pool_id: string
          principal: number
          rewards_accrued?: number
          rewards_claimed?: number
          started_at?: string
          status?: string
          unlock_at?: string | null
          unlock_tx_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_compound?: boolean
          created_at?: string
          id?: string
          last_reward_at?: string | null
          lock_tx_id?: string | null
          pool_id?: string
          principal?: number
          rewards_accrued?: number
          rewards_claimed?: number
          started_at?: string
          status?: string
          unlock_at?: string | null
          unlock_tx_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stakes_v2_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "staking_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_holdings: {
        Row: {
          apy: number
          auto_save_amount: number | null
          auto_save_frequency: string | null
          created_at: string
          goal_name: string | null
          goal_target: number | null
          id: string
          interest_accrued: number
          lock_until: string | null
          principal: number
          status: string
          updated_at: string
          user_id: string
          vault_type: string
        }
        Insert: {
          apy?: number
          auto_save_amount?: number | null
          auto_save_frequency?: string | null
          created_at?: string
          goal_name?: string | null
          goal_target?: number | null
          id?: string
          interest_accrued?: number
          lock_until?: string | null
          principal?: number
          status?: string
          updated_at?: string
          user_id: string
          vault_type?: string
        }
        Update: {
          apy?: number
          auto_save_amount?: number | null
          auto_save_frequency?: string | null
          created_at?: string
          goal_name?: string | null
          goal_target?: number | null
          id?: string
          interest_accrued?: number
          lock_until?: string | null
          principal?: number
          status?: string
          updated_at?: string
          user_id?: string
          vault_type?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          destination: string
          id: string
          note: string
          reference_id: string | null
          reference_table: string | null
          source: string
          status: string
          tx_ref: string
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          destination?: string
          id?: string
          note?: string
          reference_id?: string | null
          reference_table?: string | null
          source?: string
          status?: string
          tx_ref?: string
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          destination?: string
          id?: string
          note?: string
          reference_id?: string | null
          reference_table?: string | null
          source?: string
          status?: string
          tx_ref?: string
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_methods: {
        Row: {
          created_at: string
          details: Json
          id: string
          label: string
          method_type: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          label: string
          method_type: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          label?: string
          method_type?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          fee: number
          id: string
          lock_tx_id: string | null
          method_id: string | null
          net_amount: number
          processed_at: string | null
          reference: string | null
          settle_tx_id: string | null
          source: string
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          fee?: number
          id?: string
          lock_tx_id?: string | null
          method_id?: string | null
          net_amount: number
          processed_at?: string | null
          reference?: string | null
          settle_tx_id?: string | null
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          lock_tx_id?: string | null
          method_id?: string | null
          net_amount?: number
          processed_at?: string | null
          reference?: string | null
          settle_tx_id?: string | null
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          _action: string
          _max: number
          _user_id: string
          _window_seconds: number
        }
        Returns: boolean
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _actor: string
          _payload: Json
          _target_id: string
          _target_type: string
        }
        Returns: undefined
      }
      post_ledger: {
        Args: {
          _amount: number
          _destination?: string
          _note?: string
          _reference_id?: string
          _reference_table?: string
          _source?: string
          _type: string
          _user_id: string
        }
        Returns: {
          balance_after: number
          tx_id: string
        }[]
      }
      recompute_bix_score: { Args: { _user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      code_status: "unused" | "used" | "disabled"
      membership_status: "pending" | "active" | "suspended"
      stake_status: "active" | "unstaked"
      submission_status: "pending" | "approved" | "rejected"
      task_status: "draft" | "active" | "paused" | "ended"
      task_type: "engagement" | "community" | "brand" | "challenge"
      tx_type:
        | "earn"
        | "spend"
        | "stake"
        | "unstake"
        | "admin_adjust"
        | "referral"
        | "daily"
        | "mission"
        | "campaign"
        | "activation_payment"
        | "vault_deposit"
        | "vault_withdraw"
        | "vault_interest"
        | "transfer_in"
        | "transfer_out"
        | "withdrawal"
        | "staking_reward"
        | "stake_v2_lock"
        | "stake_v2_unlock"
        | "stake_v2_penalty"
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
      app_role: ["super_admin", "admin", "user"],
      code_status: ["unused", "used", "disabled"],
      membership_status: ["pending", "active", "suspended"],
      stake_status: ["active", "unstaked"],
      submission_status: ["pending", "approved", "rejected"],
      task_status: ["draft", "active", "paused", "ended"],
      task_type: ["engagement", "community", "brand", "challenge"],
      tx_type: [
        "earn",
        "spend",
        "stake",
        "unstake",
        "admin_adjust",
        "referral",
        "daily",
        "mission",
        "campaign",
        "activation_payment",
        "vault_deposit",
        "vault_withdraw",
        "vault_interest",
        "transfer_in",
        "transfer_out",
        "withdrawal",
        "staking_reward",
        "stake_v2_lock",
        "stake_v2_unlock",
        "stake_v2_penalty",
      ],
    },
  },
} as const
