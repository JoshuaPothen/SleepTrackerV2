'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TrendChart from '@/components/dashboard/TrendChart';
import Link from 'next/link';

interface DaySummary {
  date: string;
  avg_hr: number | null;
  avg_br: number | null;
  quality_score: number | null;
  stage_counts: { awake: number; light: number; deep: number };
  reading_count: number;
}

function scoreColor(s: number | null) {
  if (s === null) return 'var(--muted)';
  if (s >= 7) return 'var(--green)';
  if (s >= 4) return 'var(--amber)';
  return 'var(--rose)';
}

export default function HistoryPage() {
  const [summary, setSummary] = useState<DaySummary[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/summary?days=${days}`)
      .then((r) => r.json())
      .then(({ summary: data }) => { setSummary(data ?? []); setLoading(false); });
  }, [days]);

  const barData = summary.map((d) => ({
    date: d.date.slice(5),
    Deep: d.stage_counts.deep,
    Light: d.stage_counts.light,
    Awake: d.stage_counts.awake,
  }));

  return (
    <main className="min-h-screen p-4 sm:p-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--indigo)' }} />
            <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Sleep Tracker</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/" className="text-sm pb-0.5 transition-colors" style={{ color: 'var(--muted)' }}>Dashboard</Link>
            <span className="text-sm font-medium pb-0.5 border-b" style={{ color: 'var(--indigo)', borderColor: 'var(--indigo)' }}>History</span>
          </nav>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: days === d ? 'var(--indigo)' : 'var(--surface)',
                color: days === d ? '#fff' : 'var(--muted)',
                border: `1px solid ${days === d ? 'var(--indigo)' : 'var(--border)'}`,
              }}
            >
              {d}d
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--muted)' }}>Loading…</div>
        ) : (
          <>
            {/* Trend area chart */}
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>Trends</p>
              <TrendChart data={summary} />
            </div>

            {/* Stage bar chart */}
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>Sleep Stages per Night</p>
              <div className="h-36 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#7d8590', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7d8590', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1c2333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e6edf3', fontSize: 12 }} labelStyle={{ color: '#7d8590' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#7d8590', paddingTop: 8 }} />
                  <Bar dataKey="Deep"  stackId="a" fill="#818cf8" radius={[0,0,0,0]} />
                  <Bar dataKey="Light" stackId="a" fill="#60a5fa" radius={[0,0,0,0]} />
                  <Bar dataKey="Awake" stackId="a" fill="#fbbf24" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Date','Quality','Avg HR','Avg BR','Deep','Light','Awake'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-sm" style={{ color: 'var(--muted)' }}>No data for this period</td></tr>
                  ) : summary.map((d) => (
                    <tr key={d.date} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{d.date}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: scoreColor(d.quality_score) }}>{d.quality_score ?? '—'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--rose)' }}>{d.avg_hr ?? '—'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--blue)' }}>{d.avg_br ?? '—'}</td>
                      <td className="px-4 py-3" style={{ color: '#818cf8' }}>{d.stage_counts.deep}</td>
                      <td className="px-4 py-3" style={{ color: '#60a5fa' }}>{d.stage_counts.light}</td>
                      <td className="px-4 py-3" style={{ color: '#fbbf24' }}>{d.stage_counts.awake}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </>
        )}

        <div id="action-bar" className="flex gap-3 flex-wrap" />
      </div>
    </main>
  );
}
