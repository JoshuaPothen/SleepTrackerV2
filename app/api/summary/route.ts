import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { computeQualityScore } from '@/lib/sleep-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') ?? '7'), 30);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await getSupabase()
    .from('sensor_readings')
    .select('recorded_at, breathing_rate, heart_rate, presence, movement_state, sleep_stage')
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Supabase query error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const readings = data ?? [];

  // Group readings by calendar day
  const byDay = new Map<string, typeof readings>();
  for (const r of readings) {
    const day = r.recorded_at.slice(0, 10); // 'YYYY-MM-DD'
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(r);
  }

  const summary = Array.from(byDay.entries()).map(([date, dayReadings]) => {
    const present = dayReadings.filter((r) => r.presence);
    const avgHr = average(present.map((r) => r.heart_rate).filter((v): v is number => v !== null));
    const avgBr = average(present.map((r) => r.breathing_rate).filter((v): v is number => v !== null));
    const quality = computeQualityScore(present.map((r) => ({
      breathing_rate: r.breathing_rate,
      heart_rate: r.heart_rate,
      presence: r.presence,
      movement_state: r.movement_state,
    })));

    const stageCounts = { awake: 0, light: 0, deep: 0 };
    for (const r of dayReadings) {
      if (r.sleep_stage === 'awake') stageCounts.awake++;
      else if (r.sleep_stage === 'light') stageCounts.light++;
      else if (r.sleep_stage === 'deep') stageCounts.deep++;
    }

    return { date, avg_hr: avgHr, avg_br: avgBr, quality_score: quality, stage_counts: stageCounts, reading_count: dayReadings.length };
  });

  return NextResponse.json({ summary, days });
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}
