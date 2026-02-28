import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { inferSleepStage } from '@/lib/sleep-utils';

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse body
  let body: {
    breathing_rate?: number;
    heart_rate?: number;
    distance?: number;
    presence?: boolean;
    movement_state?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { breathing_rate, heart_rate, distance, presence, movement_state } = body;

  // Basic sanity checks
  if (breathing_rate !== undefined && (breathing_rate < 0 || breathing_rate > 40)) {
    return NextResponse.json({ error: 'breathing_rate out of range' }, { status: 400 });
  }
  if (heart_rate !== undefined && (heart_rate < 0 || heart_rate > 200)) {
    return NextResponse.json({ error: 'heart_rate out of range' }, { status: 400 });
  }

  // 3. Infer sleep stage
  const sleep_stage = inferSleepStage({
    breathing_rate: breathing_rate ?? null,
    heart_rate: heart_rate ?? null,
    presence: presence ?? null,
    movement_state: movement_state ?? null,
  });

  // 4. Insert into Supabase
  const { error } = await getSupabase().from('sensor_readings').insert([{
    breathing_rate: breathing_rate ?? null,
    heart_rate: heart_rate ?? null,
    distance: distance ?? null,
    presence: presence ?? null,
    movement_state: movement_state ?? null,
    sleep_stage,
  }]);

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sleep_stage });
}
