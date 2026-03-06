'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SensorReading } from '@/lib/supabase';

interface Props { readings: SensorReading[] }

export default function BreathingWaveformChart({ readings }: Props) {
  const data = readings
    .filter((r) => r.breath_phase !== null)
    .map((r) => ({
      time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phase: r.breath_phase,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: 'var(--muted)' }}>
        Waiting for phase data…
      </div>
    );
  }

  return (
    <div className="h-40 sm:h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#7d8590', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#7d8590', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: '#1c2333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e6edf3', fontSize: 12 }}
            labelStyle={{ color: '#7d8590' }}
            formatter={(v: number | undefined) => [v != null ? v.toFixed(4) : '—', 'Breath Phase']}
          />
          <Line type="monotone" dataKey="phase" stroke="#34d399" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
