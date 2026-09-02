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
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          contact_name: string | null;
          phone: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_name?: string | null;
          phone?: string | null;
          timezone?: string;
        };
        Update: {
          name?: string;
          contact_name?: string | null;
          phone?: string | null;
          timezone?: string;
        };
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
      };
    };
  };
}
