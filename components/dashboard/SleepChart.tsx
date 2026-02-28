'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SensorReading } from '@/lib/supabase';

interface Props { readings: SensorReading[] }

export default function SleepChart({ readings }: Props) {
  const data = readings.map((r) => ({
    time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    BR: r.breathing_rate ?? undefined,
    HR: r.heart_rate ?? undefined,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--muted)' }}>
        Waiting for data from sensor…
      </div>
    );
  }

  return (
    <div className="h-40 sm:h-56">
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
          yAxisId="br"
          domain={[0, 25]}
          tick={{ fill: '#7d8590', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="hr"
          orientation="right"
          domain={[40, 120]}
          tick={{ fill: '#7d8590', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: '#1c2333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e6edf3', fontSize: 12 }}
          labelStyle={{ color: '#7d8590' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#7d8590', paddingTop: 8 }}
          formatter={(v) => <span style={{ color: v === 'BR' ? '#60a5fa' : '#f87171' }}>{v === 'BR' ? 'Breathing Rate' : 'Heart Rate'}</span>}
        />
        <Line yAxisId="br" type="monotone" dataKey="BR" stroke="#60a5fa" strokeWidth={2} dot={false} connectNulls />
        <Line yAxisId="hr" type="monotone" dataKey="HR" stroke="#f87171" strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
