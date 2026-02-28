'use client';

import { AreaChart, Card, Text, Title } from '@tremor/react';

interface DaySummary {
  date: string;
  avg_hr: number | null;
  avg_br: number | null;
  quality_score: number | null;
}

interface Props {
  data: DaySummary[];
}

export default function TrendChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: d.date,
    'Avg Heart Rate': d.avg_hr ?? 0,
    'Avg Breathing Rate': d.avg_br ?? 0,
    'Quality Score': d.quality_score ?? 0,
  }));

  return (
    <Card>
      <Title>7-Day Trends</Title>
      <Text className="mb-4">Average vitals and sleep quality per night</Text>
      <AreaChart
        data={chartData}
        index="date"
        categories={['Avg Heart Rate', 'Avg Breathing Rate', 'Quality Score']}
        colors={['rose', 'blue', 'indigo']}
        className="h-60"
        showLegend
        showGridLines
        connectNulls
      />
    </Card>
  );
}
