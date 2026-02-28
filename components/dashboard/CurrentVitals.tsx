'use client';

import { Card, Metric, Text, BadgeDelta } from '@tremor/react';
import type { SensorReading } from '@/lib/supabase';

interface Props {
  latest: SensorReading | null;
}

const stageColor: Record<string, string> = {
  awake: 'text-amber-600',
  light: 'text-blue-500',
  deep: 'text-indigo-600',
};

export default function CurrentVitals({ latest }: Props) {
  const br = latest?.breathing_rate?.toFixed(1) ?? '—';
  const hr = latest?.heart_rate?.toFixed(0) ?? '—';
  const stage = latest?.sleep_stage ?? 'absent';
  const stageLabel = stage === 'awake' ? 'Awake'
    : stage === 'light' ? 'Light Sleep'
    : stage === 'deep' ? 'Deep Sleep'
    : 'No Signal';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card decoration="top" decorationColor="blue">
        <Text>Breathing Rate</Text>
        <Metric>{br} <span className="text-sm font-normal text-gray-500">br/min</span></Metric>
      </Card>
      <Card decoration="top" decorationColor="rose">
        <Text>Heart Rate</Text>
        <Metric>{hr} <span className="text-sm font-normal text-gray-500">BPM</span></Metric>
      </Card>
      <Card decoration="top" decorationColor="indigo">
        <Text>Sleep Stage</Text>
        <Metric className={stageColor[stage] ?? 'text-gray-400'}>{stageLabel}</Metric>
        {latest && (
          <Text className="mt-1 text-xs text-gray-400">
            Last reading: {new Date(latest.recorded_at).toLocaleTimeString()}
          </Text>
        )}
      </Card>
    </div>
  );
}
