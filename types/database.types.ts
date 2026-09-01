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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_status: string
          company_context: Json | null
          company_name: string
          company_size: string | null
          country: string | null
          created_at: string
          domain: string | null
          id: string
          industry: string | null
          linkedin_url: string | null
          region: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          account_status?: string
          company_context?: Json | null
          company_name: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          region?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          account_status?: string
          company_context?: Json | null
          company_name?: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          region?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_type: string
          campaign_id: string | null
          created_at: string
          email_id: string | null
          id: string
          lead_id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          activity_type: string
          campaign_id?: string | null
          created_at?: string
          email_id?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          user_id: string
        }
        Update: {
          activity_type?: string
          campaign_id?: string | null
          created_at?: string
          email_id?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_objective: string
          created_at: string
          description: string | null
          icp_description: string
          id: string
          name: string
          offer_description: string
          status: string
          target_region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_objective: string
          created_at?: string
          description?: string | null
          icp_description: string
          id?: string
          name: string
          offer_description: string
          status?: string
          target_region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_objective?: string
          created_at?: string
          description?: string | null
          icp_description?: string
          id?: string
          name?: string
          offer_description?: string
          status?: string
          target_region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          approval_status: string
          approved_at: string | null
          body_approved: string | null
          body_generated: string
          created_at: string
          generated_at: string
          id: string
          lead_id: string
          message_id: string | null
          preview_text: string | null
          ps_text: string | null
          qa_score: number | null
          scheduled_at: string | null
          sending_status: string
          sent_at: string | null
          sequence_id: string
          step_number: number
          strategic_purpose: string
          subject_line: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          body_approved?: string | null
          body_generated: string
          created_at?: string
          generated_at?: string
          id?: string
          lead_id: string
          message_id?: string | null
          preview_text?: string | null
          ps_text?: string | null
          qa_score?: number | null
          scheduled_at?: string | null
          sending_status?: string
          sent_at?: string | null
          sequence_id: string
          step_number: number
          strategic_purpose: string
          subject_line: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          body_approved?: string | null
          body_generated?: string
          created_at?: string
          generated_at?: string
          id?: string
          lead_id?: string
          message_id?: string | null
          preview_text?: string | null
          ps_text?: string | null
          qa_score?: number | null
          scheduled_at?: string | null
          sending_status?: string
          sent_at?: string | null
          sequence_id?: string
          step_number?: number
          strategic_purpose?: string
          subject_line?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          account_id: string | null
          approval_status: string
          campaign_id: string
          country: string | null
          created_at: string
          current_step: number
          email: string
          email_status: string
          first_name: string
          id: string
          industry: string | null
          job_title: string | null
          last_name: string
          lead_objective: string | null
          linkedin_url: string | null
          next_action: string | null
          next_action_date: string | null
          outreach_status: string
          reply_status: string
          stop_sequence: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          approval_status?: string
          campaign_id: string
          country?: string | null
          created_at?: string
          current_step?: number
          email: string
          email_status?: string
          first_name: string
          id?: string
          industry?: string | null
          job_title?: string | null
          last_name: string
          lead_objective?: string | null
          linkedin_url?: string | null
          next_action?: string | null
          next_action_date?: string | null
          outreach_status?: string
          reply_status?: string
          stop_sequence?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          approval_status?: string
          campaign_id?: string
          country?: string | null
          created_at?: string
          current_step?: number
          email?: string
          email_status?: string
          first_name?: string
          id?: string
          industry?: string | null
          job_title?: string | null
          last_name?: string
          lead_objective?: string | null
          linkedin_url?: string | null
          next_action?: string | null
          next_action_date?: string | null
          outreach_status?: string
          reply_status?: string
          stop_sequence?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_library: {
        Row: {
          company_size_context: string | null
          created_at: string
          customer_name: string
          id: string
          industry: string
          mechanism_solution: string
          problem_addressed: string
          quantifiable_result: string
          source_reference: string | null
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          company_size_context?: string | null
          created_at?: string
          customer_name: string
          id?: string
          industry: string
          mechanism_solution: string
          problem_addressed: string
          quantifiable_result: string
          source_reference?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          company_size_context?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          industry?: string
          mechanism_solution?: string
          problem_addressed?: string
          quantifiable_result?: string
          source_reference?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_evaluations: {
        Row: {
          attempt_number: number
          created_at: string
          dimension_scores: Json
          email_id: string
          evaluator_model: string
          feedback_notes: string | null
          id: string
          mandatory_failures: Json
          passed: boolean
          total_score: number
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          dimension_scores: Json
          email_id: string
          evaluator_model?: string
          feedback_notes?: string | null
          id?: string
          mandatory_failures?: Json
          passed: boolean
          total_score: number
        }
        Update: {
          attempt_number?: number
          created_at?: string
          dimension_scores?: Json
          email_id?: string
          evaluator_model?: string
          feedback_notes?: string | null
          id?: string
          mandatory_failures?: Json
          passed?: boolean
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "qa_evaluations_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      replies: {
        Row: {
          classification: string
          created_at: string
          email_id: string | null
          id: string
          lead_id: string
          metadata: Json
          provider_message_id: string
          received_at: string
          reply_snippet: string | null
          sequence_impact: string
          thread_id: string
        }
        Insert: {
          classification?: string
          created_at?: string
          email_id?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          provider_message_id: string
          received_at?: string
          reply_snippet?: string | null
          sequence_impact?: string
          thread_id: string
        }
        Update: {
          classification?: string
          created_at?: string
          email_id?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          provider_message_id?: string
          received_at?: string
          reply_snippet?: string | null
          sequence_impact?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      research: {
        Row: {
          account_id: string | null
          business_consequence: string | null
          business_trigger: string | null
          created_at: string
          future_state: string | null
          id: string
          lead_id: string
          observed_facts: Json
          personalization_angle: string | null
          problem_hypothesis: string | null
          reasonable_inferences: Json
          research_status: string
          trigger_notes: string | null
          trigger_source_date: string | null
          trigger_source_title: string | null
          trigger_source_type: string | null
          trigger_source_url: string | null
          unknowns: Json
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          business_consequence?: string | null
          business_trigger?: string | null
          created_at?: string
          future_state?: string | null
          id?: string
          lead_id: string
          observed_facts?: Json
          personalization_angle?: string | null
          problem_hypothesis?: string | null
          reasonable_inferences?: Json
          research_status?: string
          trigger_notes?: string | null
          trigger_source_date?: string | null
          trigger_source_title?: string | null
          trigger_source_type?: string | null
          trigger_source_url?: string | null
          unknowns?: Json
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          business_consequence?: string | null
          business_trigger?: string | null
          created_at?: string
          future_state?: string | null
          id?: string
          lead_id?: string
          observed_facts?: Json
          personalization_angle?: string | null
          problem_hypothesis?: string | null
          reasonable_inferences?: Json
          research_status?: string
          trigger_notes?: string | null
          trigger_source_date?: string | null
          trigger_source_title?: string | null
          trigger_source_type?: string | null
          trigger_source_url?: string | null
          unknowns?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sequences: {
        Row: {
          campaign_id: string
          created_at: string
          current_step: number
          id: string
          lead_id: string
          next_action: string | null
          next_action_date: string | null
          started_at: string | null
          status: string
          stop_reason: string | null
          stopped_at: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          current_step?: number
          id?: string
          lead_id: string
          next_action?: string | null
          next_action_date?: string | null
          started_at?: string | null
          status?: string
          stop_reason?: string | null
          stopped_at?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          current_step?: number
          id?: string
          lead_id?: string
          next_action?: string | null
          next_action_date?: string | null
          started_at?: string | null
          status?: string
          stop_reason?: string | null
          stopped_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
