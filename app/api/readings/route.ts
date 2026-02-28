import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 1000);
  const since = searchParams.get('since'); // ISO 8601 date string

  let query = getSupabase()
    .from('sensor_readings')
    .select('id, recorded_at, breathing_rate, heart_rate, distance, presence, movement_state, sleep_stage')
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gte('recorded_at', since);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase query error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Return in ascending order for charting
  return NextResponse.json({ readings: (data ?? []).reverse() });
}
