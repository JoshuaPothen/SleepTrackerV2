'use client';

import { useEffect, useState } from 'react';
import CurrentVitals from '@/components/dashboard/CurrentVitals';
import SleepChart from '@/components/dashboard/SleepChart';
import SleepSummaryCard from '@/components/dashboard/SleepSummaryCard';
import SleepStateIllustration from '@/components/dashboard/SleepStateIllustration';
import { createBrowserClient, type SensorReading } from '@/lib/supabase';
import Link from 'next/link';

type SleepStage = 'awake' | 'light' | 'deep' | 'absent';

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ color: 'var(--muted)', fontSize: 13 }}>{time}</span>;
}

export default function DashboardPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const stage: SleepStage = latest?.sleep_stage ?? 'absent';

  useEffect(() => {
    const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    fetch(`/api/readings?limit=500&since=${encodeURIComponent(since)}`)
      .then((r) => r.json())
      .then(({ readings: data }) => { setReadings(data ?? []); setLoading(false); });
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel('sensor-readings-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, (payload) => {
        setReadings((prev) => [...prev.slice(-499), payload.new as SensorReading]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const prev = readings.filter((r) => new Date(r.recorded_at) < todayStart);
  const stageCounts = { awake: 0, light: 0, deep: 0 };
  let hrSum = 0, brSum = 0, count = 0;
  for (const r of prev) {
    if (r.sleep_stage === 'awake') stageCounts.awake++;
    else if (r.sleep_stage === 'light') stageCounts.light++;
    else if (r.sleep_stage === 'deep') stageCounts.deep++;
    if (r.heart_rate) { hrSum += r.heart_rate; count++; }
    if (r.breathing_rate) brSum += r.breathing_rate;
  }
  const avgHr = count > 0 ? parseFloat((hrSum / count).toFixed(1)) : null;
  const avgBr = count > 0 ? parseFloat((brSum / count).toFixed(1)) : null;
  const total = prev.length;
  const qualityScore = total > 0
    ? parseFloat(Math.max(0, Math.min(10,
        (stageCounts.deep / total) * 10 + (stageCounts.light / total) * 5 - (stageCounts.awake / total) * 3
      )).toFixed(1))
    : null;

  return (
    <main className="min-h-screen p-4 sm:p-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--indigo)' }} />
            <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Sleep Tracker</h1>
          </div>
          <div className="flex items-center gap-5">
            <LiveClock />
            <nav className="flex gap-4">
              <span className="text-sm font-medium pb-0.5 border-b" style={{ color: 'var(--indigo)', borderColor: 'var(--indigo)' }}>Dashboard</span>
              <Link href="/history" className="text-sm pb-0.5 transition-colors" style={{ color: 'var(--muted)' }}>History</Link>
            </nav>
          </div>
        </div>

        {/* Illustration */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {loading
            ? <div className="flex items-center justify-center h-52 text-sm" style={{ color: 'var(--muted)' }}>Loading…</div>
            : <SleepStateIllustration stage={stage} breathingRate={latest?.breathing_rate} />
          }
        </div>

        {/* Vitals */}
        <CurrentVitals latest={latest} />

        {/* Chart */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Vitals — Last 4 Hours</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>BR left · HR right</p>
          </div>
          <SleepChart readings={readings} />
        </div>

        {/* Summary */}
        <SleepSummaryCard qualityScore={qualityScore} avgHr={avgHr} avgBr={avgBr} stageCounts={stageCounts} />

        {/* Action bar stub */}
        <div id="action-bar" className="flex gap-3 flex-wrap" />
      </div>
    </main>
  );
}
