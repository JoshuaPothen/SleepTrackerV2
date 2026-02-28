'use client';

import { Card, Text, Metric, DonutChart, Legend } from '@tremor/react';

interface StageCounts {
  awake: number;
  light: number;
  deep: number;
}

interface Props {
  qualityScore: number | null;
  avgHr: number | null;
  avgBr: number | null;
  stageCounts: StageCounts;
  date?: string;
}

const stageData = (counts: StageCounts) => [
  { name: 'Deep Sleep', value: counts.deep },
  { name: 'Light Sleep', value: counts.light },
  { name: 'Awake', value: counts.awake },
];

export default function SleepSummaryCard({ qualityScore, avgHr, avgBr, stageCounts, date }: Props) {
  const hasData = stageCounts.awake + stageCounts.light + stageCounts.deep > 0;

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <Text>{date ? `Summary — ${date}` : "Last Night's Summary"}</Text>
          <Metric className="text-indigo-600">{qualityScore ?? '—'} <span className="text-sm font-normal text-gray-500">/ 10</span></Metric>
          <Text className="text-xs text-gray-400">Sleep quality score</Text>
        </div>
        <div className="text-right space-y-1">
          <div className="text-sm"><span className="text-gray-500">Avg HR: </span><strong>{avgHr ?? '—'} BPM</strong></div>
          <div className="text-sm"><span className="text-gray-500">Avg BR: </span><strong>{avgBr ?? '—'} br/min</strong></div>
        </div>
      </div>

      {hasData ? (
        <>
          <DonutChart
            data={stageData(stageCounts)}
            category="value"
            index="name"
            colors={['indigo', 'blue', 'amber']}
            className="h-36"
            showLabel={false}
          />
          <Legend
            categories={['Deep Sleep', 'Light Sleep', 'Awake']}
            colors={['indigo', 'blue', 'amber']}
            className="mt-3"
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-36 text-gray-400 text-sm">
          No sleep data for this period
        </div>
      )}
    </Card>
  );
}
