import { createClient } from '@supabase/supabase-js';

// --- DATABASE TYPES ---
type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: 'admin' | 'student';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      enrollments: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string; // Firebase UID
          personal_info: {
            firstName: string;
            lastName: string;
            middleName: string;
            birthdate: string;
            gender: string;
            address: string;
            email: string;
            phone: string;
            lrn: string | null;
          };
          educational_background: {
            lastGradeLevel: string;
            lastSchoolAttended: string;
            yearLastAttended: string;
            reason: string;
          };
          learning_preferences: {
            preferredSchedule: string;
            preferredLanguage: string;
            accommodation: string | null;
          };
          subjects: Array<{
            id: number;
            name: string;
            status: 'enrolled' | 'completed' | 'dropped';
            enrollmentDate: string;
            completionDate: string | null;
          }>;
          status: 'pending' | 'approved' | 'rejected' | 'enrolled' | 'completed' | 'dropped';
          status_history: Array<{
            status: 'pending' | 'approved' | 'rejected' | 'enrolled' | 'completed' | 'dropped';
            date: string;
            notes: string | null;
            updated_by: string; // Firebase UID
          }>;
          submitted_at: string;
          approved_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          enrollment_date: string | null;
          completion_date: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['enrollments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['enrollments']['Insert']>;
      };
      // Add other tables as needed
    };
  };
};

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  // Use anon key. Do not override accessToken with Firebase token
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get table with type safety
export const getTable = <T extends keyof Database['public']['Tables']>(table: T) => {
  return supabase.from(table);
};

// Error handling wrapper
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'An error occurred with Supabase');
};