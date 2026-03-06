'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SensorReading } from '@/lib/supabase';

interface Props { readings: SensorReading[] }

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export default function HRVChart({ readings }: Props) {
  const data = readings
    .filter((r) => r.heart_phase !== null)
    .map((r) => ({
      time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phase: r.heart_phase,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: 'var(--muted)' }}>
        Waiting for phase data…
      </div>
    );
  }

  const last20 = data.slice(-20).map((d) => d.phase as number);
  const variability = stdDev(last20).toFixed(4);

  return (
    <div>
      <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
        Variability (σ): <span style={{ color: '#a78bfa' }}>{variability}</span>
      </p>
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
              formatter={(v: number) => [v.toFixed(4), 'Cardiac Phase']}
            />
            <Line type="monotone" dataKey="phase" stroke="#a78bfa" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
