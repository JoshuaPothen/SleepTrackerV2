'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface StageCounts { awake: number; light: number; deep: number }
interface Props {
  qualityScore: number | null;
  avgHr: number | null;
  avgBr: number | null;
  stageCounts: StageCounts;
  date?: string;
}

const STAGE_COLORS = ['#818cf8', '#60a5fa', '#fbbf24'];
const STAGE_LABELS = ['Deep Sleep', 'Light Sleep', 'Awake'];

export default function SleepSummaryCard({ qualityScore, avgHr, avgBr, stageCounts, date }: Props) {
  const pieData = [
    { name: 'Deep Sleep', value: stageCounts.deep },
    { name: 'Light Sleep', value: stageCounts.light },
    { name: 'Awake',       value: stageCounts.awake },
  ].filter((d) => d.value > 0);

  const hasData = pieData.length > 0;

  const scoreColor = qualityScore === null ? 'var(--muted)'
    : qualityScore >= 7 ? 'var(--green)'
    : qualityScore >= 4 ? 'var(--amber)'
    : 'var(--rose)';

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>
        {date ?? "Last Night's Summary"}
      </p>

      <div className="flex items-start gap-6">
        {/* Score + stats */}
        <div className="flex flex-col gap-3 min-w-[100px]">
          <div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Quality</p>
            <p className="text-4xl font-bold" style={{ color: scoreColor }}>
              {qualityScore ?? '—'}
              <span className="text-base font-normal" style={{ color: 'var(--muted)' }}> / 10</span>
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Stat label="Avg HR" value={avgHr ? `${avgHr} BPM` : '—'} color="var(--rose)" />
            <Stat label="Avg BR" value={avgBr ? `${avgBr} br/min` : '—'} color="var(--blue)" />
          </div>
        </div>

        {/* Donut + legend */}
        <div className="flex-1 flex flex-col items-center">
          {hasData ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={52} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1c2333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e6edf3', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-3 flex-wrap justify-center mt-1">
                {STAGE_LABELS.map((l, i) => (
                  <span key={l} className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[i] }} />
                    {l}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-28 text-sm" style={{ color: 'var(--muted)' }}>
              No data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}
