'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SensorReading } from '@/lib/supabase';

interface Props {
  readings: SensorReading[];
}

export default function SleepChart({ readings }: Props) {
  const data = readings.map((r) => ({
    time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    'Breathing Rate': r.breathing_rate ?? undefined,
    'Heart Rate': r.heart_rate ?? undefined,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No readings yet. Waiting for data from sensor…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="br"
          domain={[0, 25]}
          tick={{ fontSize: 11 }}
          label={{ value: 'BR', angle: -90, position: 'insideLeft', fontSize: 11, offset: 8 }}
        />
        <YAxis
          yAxisId="hr"
          orientation="right"
          domain={[40, 120]}
          tick={{ fontSize: 11 }}
          label={{ value: 'HR', angle: 90, position: 'insideRight', fontSize: 11, offset: 8 }}
        />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          yAxisId="br"
          type="monotone"
          dataKey="Breathing Rate"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          yAxisId="hr"
          type="monotone"
          dataKey="Heart Rate"
          stroke="#f43f5e"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
