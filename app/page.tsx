'use client';

import { useEffect, useState } from 'react';
import { Card, Title, Text } from '@tremor/react';
import CurrentVitals from '@/components/dashboard/CurrentVitals';
import SleepChart from '@/components/dashboard/SleepChart';
import SleepSummaryCard from '@/components/dashboard/SleepSummaryCard';
import SleepStateIllustration from '@/components/dashboard/SleepStateIllustration';
import { createBrowserClient, type SensorReading } from '@/lib/supabase';
import Link from 'next/link';

type SleepStage = 'awake' | 'light' | 'deep' | 'absent';

export default function DashboardPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const stage: SleepStage = latest?.sleep_stage ?? 'absent';

  // Initial load: fetch last 4 hours of readings
  useEffect(() => {
    const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    fetch(`/api/readings?limit=500&since=${encodeURIComponent(since)}`)
      .then((r) => r.json())
      .then(({ readings: data }) => {
        setReadings(data ?? []);
        setLoading(false);
      });
  }, []);

  // Real-time: subscribe to new inserts via Supabase
  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel('sensor-readings-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          setReadings((prev) => [...prev.slice(-499), payload.new as SensorReading]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Compute last-session summary from available readings before today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const prevReadings = readings.filter((r) => new Date(r.recorded_at) < todayStart);
  const stageCounts = { awake: 0, light: 0, deep: 0 };
  let hrSum = 0, brSum = 0, vitalCount = 0;
  for (const r of prevReadings) {
    if (r.sleep_stage === 'awake') stageCounts.awake++;
    else if (r.sleep_stage === 'light') stageCounts.light++;
    else if (r.sleep_stage === 'deep') stageCounts.deep++;
    if (r.heart_rate) { hrSum += r.heart_rate; vitalCount++; }
    if (r.breathing_rate) brSum += r.breathing_rate;
  }
  const avgHr = vitalCount > 0 ? parseFloat((hrSum / vitalCount).toFixed(1)) : null;
  const avgBr = vitalCount > 0 ? parseFloat((brSum / vitalCount).toFixed(1)) : null;
  const total = prevReadings.length;
  const qualityScore = total > 0
    ? parseFloat(Math.max(0, Math.min(10,
        (stageCounts.deep / total) * 10 +
        (stageCounts.light / total) * 5 -
        (stageCounts.awake / total) * 3
      )).toFixed(1))
    : null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sleep Tracker</h1>
            <p className="text-sm text-gray-500">Live monitoring via XIAO MR60BHA2</p>
          </div>
          <nav className="flex gap-4">
            <span className="text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-0.5">
              Dashboard
            </span>
            <Link href="/history" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors pb-0.5">
              History
            </Link>
          </nav>
        </div>

        {/* Sleep state illustration — hero */}
        <Card>
          <Title className="mb-2">Current State</Title>
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Loading…
            </div>
          ) : (
            <SleepStateIllustration stage={stage} breathingRate={latest?.breathing_rate} />
          )}
        </Card>

        {/* Live vitals */}
        <CurrentVitals latest={latest} />

        {/* Live chart */}
        <Card>
          <Title>Vitals — Last 4 Hours</Title>
          <Text className="mb-4">Breathing rate (left) and heart rate (right)</Text>
          <SleepChart readings={readings} />
        </Card>

        {/* Last-night summary */}
        <SleepSummaryCard
          qualityScore={qualityScore}
          avgHr={avgHr}
          avgBr={avgBr}
          stageCounts={stageCounts}
        />

        {/* ActionBar: stub for future interactive controls */}
        <div id="action-bar" className="flex gap-3 flex-wrap">
          {/* Future buttons (e.g. "Start Session", "Export Data") go here */}
        </div>
      </div>
    </main>
  );
}
