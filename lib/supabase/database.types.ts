export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          wallet: string;
          full_name: string;
          email_hash: string;
          country: string;
          occupation: string;
          monthly_income_usd: number;
          loan_purpose: string;
          kyc_status: string;
          kyc_level: string | null;
          identity_score: number;
          active_loans: number;
          completed_loans: number;
          defaults: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      credit_profiles: {
        Row: {
          id: string;
          wallet: string;
          credit_score: number;
          reputation_score: number;
          reputation_tier: string;
          identity_score: number;
          repayment_score: number;
          wallet_trust_score: number;
          income_score: number;
          governance_score: number;
          total_borrowed: number;
          total_repaid: number;
          active_loan_count: number;
          fraud_risk: string;
          last_evaluated: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["credit_profiles"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["credit_profiles"]["Insert"]>;
      };
      loans: {
        Row: {
          id: string;
          loan_id: string;
          borrower: string;
          amount_usd: number;
          duration_days: number;
          loan_type: string;
          purpose: string;
          collateral_amount: number;
          status: string;
          credit_score: number;
          risk_level: string;
          interest_rate: number;
          required_collateral_ratio: number;
          max_loan_amount: number;
          confidence: number;
          reasoning: string;
          positive_factors: Json;
          risk_factors: Json;
          approval_hash: string;
          approval_timestamp: string;
          consensus_id: string;
          pool_id: string | null;
          total_repaid: number;
          is_immutable: boolean;
          requested_at: string;
          activated_at: string | null;
          due_date: string | null;
          repaid_at: string | null;
          defaulted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["loans"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loans"]["Insert"]>;
      };
      repayments: {
        Row: {
          id: string;
          loan_id: string;
          wallet: string;
          amount: number;
          fee: number;
          status: string;
          repaid_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["repayments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["repayments"]["Insert"]>;
      };
      risk_assessments: {
        Row: {
          id: string;
          wallet: string;
          loan_id: string;
          decision: string;
          credit_score: number;
          risk_level: string;
          max_loan_amount: number;
          required_collateral_ratio: number;
          interest_rate: number;
          confidence: number;
          reasoning: string;
          positive_factors: Json;
          risk_factors: Json;
          fraud_risk: string;
          approval_hash: string;
          evaluated_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["risk_assessments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["risk_assessments"]["Insert"]>;
      };
      liquidity_pools: {
        Row: {
          id: string;
          pool_id: string;
          name: string;
          target_return_bps: number;
          min_credit_score: number;
          max_loan_amount: number;
          risk_tier: string;
          status: string;
          total_deposited: number;
          available_liquidity: number;
          total_borrowed: number;
          total_repaid: number;
          active_loans: number;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["liquidity_pools"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["liquidity_pools"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          wallet: string;
          type: string;
          amount: number;
          tx_hash: string;
          status: string;
          loan_id: string | null;
          pool_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          wallet: string;
          type: string;
          title: string;
          message: string;
          read: boolean;
          loan_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
          read?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          wallet: string;
          action: string;
          entity_type: string;
          entity_id: string;
          details: Json;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
      proofs: {
        Row: {
          id: string;
          wallet: string;
          action: string;
          contract_address: string;
          tx_hash: string;
          state_before: string;
          state_after: string;
          proof_hash: string;
          loan_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["proofs"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["proofs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
