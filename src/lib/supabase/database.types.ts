/**
 * Tipos generados a mano a partir de supabase/migrations/*.sql.
 * Regenerar con la CLI cuando sea posible autenticarse:
 *   npx supabase login
 *   npx supabase gen types typescript --project-id nzmgqnnupqhvmkotxmoq > src/lib/supabase/database.types.ts
 */

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type ReminderChannel = "whatsapp";
export type ReminderStatus = "pending" | "prepared" | "sent";
export type BusinessMemberRole = "owner" | "member";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          contact_name: string | null;
          phone: string | null;
          timezone: string;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_name?: string | null;
          phone?: string | null;
          timezone?: string;
          onboarding_completed_at?: string | null;
        };
        Update: {
          name?: string;
          contact_name?: string | null;
          phone?: string | null;
          timezone?: string;
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: BusinessMemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: BusinessMemberRole;
        };
        Update: {
          role?: BusinessMemberRole;
        };
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          business_id: string;
          full_name: string;
          phone: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          full_name: string;
          phone: string;
          notes?: string | null;
        };
        Update: {
          full_name?: string;
          phone?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          duration_minutes: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          duration_minutes: number;
          active?: boolean;
        };
        Update: {
          name?: string;
          duration_minutes?: number;
          active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          business_id: string;
          client_id: string;
          service_id: string | null;
          starts_at: string;
          ends_at: string;
          status: AppointmentStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          client_id: string;
          service_id?: string | null;
          starts_at: string;
          ends_at: string;
          status?: AppointmentStatus;
          notes?: string | null;
        };
        Update: {
          client_id?: string;
          service_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          status?: AppointmentStatus;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment_reminders: {
        Row: {
          id: string;
          business_id: string;
          appointment_id: string;
          channel: ReminderChannel;
          status: ReminderStatus;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          appointment_id: string;
          channel?: ReminderChannel;
          status?: ReminderStatus;
          sent_at?: string | null;
        };
        Update: {
          status?: ReminderStatus;
          sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      business_settings: {
        Row: {
          business_id: string;
          default_reminder_template: string;
          week_starts_on: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          default_reminder_template?: string;
          week_starts_on?: number;
        };
        Update: {
          default_reminder_template?: string;
          week_starts_on?: number;
        };
        Relationships: [
          {
            foreignKeyName: "business_settings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_business_member: {
        Args: { target_business_id: string };
        Returns: boolean;
      };
      provision_business_for_current_user: {
        Args: { business_name: string; contact_name: string | null };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
