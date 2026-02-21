import { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_SERVICE = 'SupabaseService';

export interface SupabasePort {
	getClient(): SupabaseClient;
}
