'use client';

import SleepStateIllustration from '@/components/dashboard/SleepStateIllustration';

const states = [
  { stage: 'awake' as const,  breathingRate: 18, label: 'Awake'  },
  { stage: 'light' as const,  breathingRate: 15, label: 'Light'  },
  { stage: 'deep'  as const,  breathingRate: 10, label: 'Deep'   },
  { stage: 'absent' as const, breathingRate: null, label: 'Absent' },
];

export default function TestPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">SVG State + API Mock Tests</h1>

      {/* SVG States */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">SVG Sleep States</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {states.map(({ stage, breathingRate, label }) => (
            <div key={stage} className="bg-white rounded-xl p-4 shadow">
              <p className="text-center text-sm font-medium text-gray-600 mb-2">{label}</p>
              <SleepStateIllustration stage={stage} breathingRate={breathingRate} />
            </div>
          ))}
        </div>
      </section>

      {/* API Tests */}
      <section>
        <h2 className="text-lg font-semibold mb-4">API Endpoint Tests</h2>
        <ApiTests />
      </section>
    </main>
  );
}

function ApiTests() {
  return (
    <div className="space-y-3 font-mono text-sm">
      <ApiTest
        name="POST /api/ingest — valid payload"
        method="POST"
        url="/api/ingest"
        headers={{ 'Content-Type': 'application/json', 'X-API-Key': '0311e6a76324b2d38a36dc0e04d2cb7ed13dc390b7d6e04ed38b2e8e13e6dbf6' }}
        body={{ breathing_rate: 13, heart_rate: 58, distance: 0.9, presence: true, movement_state: 0 }}
        expectStatus={200}
      />
      <ApiTest
        name="POST /api/ingest — wrong API key"
        method="POST"
        url="/api/ingest"
        headers={{ 'Content-Type': 'application/json', 'X-API-Key': 'wrong-key' }}
        body={{ breathing_rate: 13, heart_rate: 58 }}
        expectStatus={401}
      />
      <ApiTest
        name="POST /api/ingest — no API key"
        method="POST"
        url="/api/ingest"
        headers={{ 'Content-Type': 'application/json' }}
        body={{ breathing_rate: 13 }}
        expectStatus={401}
      />
      <ApiTest
        name="GET /api/readings"
        method="GET"
        url="/api/readings?limit=5"
        expectStatus={200}
      />
      <ApiTest
        name="GET /api/summary"
        method="GET"
        url="/api/summary?days=7"
        expectStatus={200}
      />
    </div>
  );
}

function ApiTest({ name, method, url, headers, body, expectStatus }: {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: object;
  expectStatus: number;
}) {
  const [result, setResult] = React.useState<{ status: number; body: string; ok: boolean } | null>(null);
  const [running, setRunning] = React.useState(false);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      setResult({ status: res.status, body: text, ok: res.status === expectStatus });
    } catch (e) {
      setResult({ status: 0, body: String(e), ok: false });
    }
    setRunning(false);
  };

  const color = result === null ? 'bg-gray-50 border-gray-200'
    : result.ok ? 'bg-green-50 border-green-300'
    : 'bg-red-50 border-red-300';

  return (
    <div className={`border rounded-lg p-3 ${color}`}>
      <div className="flex items-center gap-3 mb-1">
        <span className="font-bold text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">{method}</span>
        <span className="font-medium">{name}</span>
        <span className="ml-auto text-xs text-gray-400">expect {expectStatus}</span>
        <button
          onClick={run}
          disabled={running}
          className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run'}
        </button>
      </div>
      {result && (
        <div className="mt-1">
          <span className={`text-xs font-bold ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
            {result.ok ? '✓' : '✗'} HTTP {result.status}
          </span>
          <pre className="text-xs text-gray-600 mt-1 overflow-auto max-h-20">{result.body}</pre>
        </div>
      )}
    </div>
  );
}

import React from 'react';
