'use client';

import type { SensorReading } from '@/lib/supabase';

interface Props { latest: SensorReading | null }

const cards = [
  {
    key: 'br',
    label: 'Breathing Rate',
    unit: 'br / min',
    accent: 'var(--blue)',
    getValue: (r: SensorReading) => r.breathing_rate?.toFixed(1) ?? '—',
  },
  {
    key: 'hr',
    label: 'Heart Rate',
    unit: 'BPM',
    accent: 'var(--rose)',
    getValue: (r: SensorReading) => r.heart_rate?.toFixed(0) ?? '—',
  },
  {
    key: 'stage',
    label: 'Sleep Stage',
    unit: '',
    accent: 'var(--indigo)',
    getValue: (r: SensorReading) => {
      const map: Record<string, string> = { awake: 'Awake', light: 'Light', deep: 'Deep' };
      return map[r.sleep_stage ?? ''] ?? 'No Signal';
    },
  },
];

export default function CurrentVitals({ latest }: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
      {cards.map(({ key, label, unit, accent, getValue }) => (
        <div
          key={key}
          className="rounded-xl p-3 sm:p-4 flex flex-col gap-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* top accent bar */}
          <div className="h-0.5 w-8 rounded-full mb-2" style={{ background: accent }} />
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: accent }}>
            {latest ? getValue(latest) : '—'}
          </p>
          {unit && <p className="text-xs" style={{ color: 'var(--muted)' }}>{unit}</p>}
          {key === 'stage' && latest && (
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {new Date(latest.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
