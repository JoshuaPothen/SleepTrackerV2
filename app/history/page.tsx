'use client';

import { useEffect, useState } from 'react';
import { Card, Title, Text, BarChart, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react';
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

function qualityColor(score: number | null): 'emerald' | 'yellow' | 'rose' | 'gray' {
  if (score === null) return 'gray';
  if (score >= 7) return 'emerald';
  if (score >= 4) return 'yellow';
  return 'rose';
}

export default function HistoryPage() {
  const [summary, setSummary] = useState<DaySummary[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/summary?days=${days}`)
      .then((r) => r.json())
      .then(({ summary: data }) => {
        setSummary(data ?? []);
        setLoading(false);
      });
  }, [days]);

  const stageBarData = summary.map((d) => ({
    date: d.date,
    'Deep Sleep': d.stage_counts.deep,
    'Light Sleep': d.stage_counts.light,
    Awake: d.stage_counts.awake,
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sleep History</h1>
            <p className="text-sm text-gray-500">Trends and nightly breakdowns</p>
          </div>
          <nav className="flex gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors pb-0.5">
              Dashboard
            </Link>
            <span className="text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-0.5">
              History
            </span>
          </nav>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-400'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
        ) : (
          <>
            {/* Trend area chart */}
            <TrendChart data={summary} />

            {/* Stage breakdown bar chart */}
            <Card>
              <Title>Sleep Stage Breakdown</Title>
              <Text className="mb-4">Readings per stage per night</Text>
              <BarChart
                data={stageBarData}
                index="date"
                categories={['Deep Sleep', 'Light Sleep', 'Awake']}
                colors={['indigo', 'blue', 'amber']}
                className="h-56"
                stack
              />
            </Card>

            {/* Nightly summary table */}
            <Card>
              <Title>Nightly Summary</Title>
              <Table className="mt-4">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Quality</TableHeaderCell>
                    <TableHeaderCell>Avg HR</TableHeaderCell>
                    <TableHeaderCell>Avg BR</TableHeaderCell>
                    <TableHeaderCell>Deep</TableHeaderCell>
                    <TableHeaderCell>Light</TableHeaderCell>
                    <TableHeaderCell>Awake</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        No data available for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.map((d) => (
                      <TableRow key={d.date}>
                        <TableCell className="font-medium">{d.date}</TableCell>
                        <TableCell>
                          <Badge color={qualityColor(d.quality_score)}>
                            {d.quality_score ?? '—'} / 10
                          </Badge>
                        </TableCell>
                        <TableCell>{d.avg_hr ?? '—'} BPM</TableCell>
                        <TableCell>{d.avg_br ?? '—'} br/min</TableCell>
                        <TableCell>{d.stage_counts.deep}</TableCell>
                        <TableCell>{d.stage_counts.light}</TableCell>
                        <TableCell>{d.stage_counts.awake}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {/* ActionBar stub */}
        <div id="action-bar" className="flex gap-3 flex-wrap">
          {/* Future controls */}
        </div>
      </div>
    </main>
  );
}
