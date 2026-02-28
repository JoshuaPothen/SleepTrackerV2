'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DaySummary {
  date: string;
  avg_hr: number | null;
  avg_br: number | null;
  quality_score: number | null;
}

interface Props { data: DaySummary[] }

export default function TrendChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    'Heart Rate': d.avg_hr ?? 0,
    'Breathing Rate': d.avg_br ?? 0,
    'Quality': d.quality_score ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gHR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gBR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gQ" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: '#7d8590', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#7d8590', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#1c2333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e6edf3', fontSize: 12 }}
          labelStyle={{ color: '#7d8590' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#7d8590', paddingTop: 8 }} />
        <Area type="monotone" dataKey="Heart Rate"     stroke="#f87171" fill="url(#gHR)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="Breathing Rate" stroke="#60a5fa" fill="url(#gBR)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="Quality"        stroke="#818cf8" fill="url(#gQ)"  strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
