import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazily-initialized singleton — avoids build-time errors when env vars are absent
let _client: SupabaseClient | null = null;

/** Server-side Supabase client (call inside API route handlers, not at module scope) */
export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

/** Browser client for client components (real-time subscriptions) */
export function createBrowserClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type SensorReading = {
  id: number;
  recorded_at: string;
  breathing_rate: number | null;
  heart_rate: number | null;
  distance: number | null;
  presence: boolean | null;
  movement_state: number | null;
  sleep_stage: 'awake' | 'light' | 'deep' | null;
};

export type SleepSession = {
  id: number;
  started_at: string;
  ended_at: string | null;
  avg_hr: number | null;
  avg_br: number | null;
  quality_score: number | null;
};
