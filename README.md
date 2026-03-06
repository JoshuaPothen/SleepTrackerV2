# SleepTrackerV2

A real-time sleep monitoring system combining a 60GHz mmWave radar sensor (ESP32C6 microcontroller) with a Next.js web dashboard. The sensor continuously reads breathing rate, heart rate, presence, and movement data — POSTing to a Vercel-hosted API every 30 seconds. The server infers sleep stages (deep, light, awake) and stores readings in Supabase, where the dashboard picks them up live via Postgres real-time subscriptions.

---

## Table of Contents

- [Hardware Required](#hardware-required)
- [Software & Services](#software--services)
- [Architecture Overview](#architecture-overview)
- [Installation Guide](#installation-guide)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up Supabase](#2-set-up-supabase)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Run the Dev Server](#5-run-the-dev-server)
  - [6. Deploy to Vercel](#6-deploy-to-vercel)
  - [7. Set Up Firmware](#7-set-up-firmware)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Sleep Stage Logic](#sleep-stage-logic)
- [Dashboard Pages](#dashboard-pages)
- [Configuration & Tuning](#configuration--tuning)
- [Security Notes](#security-notes)
- [Handoff Notes](#handoff-notes)

---

## Hardware Required

| Component | Details | Link |
|-----------|---------|------|
| **Seeed Studio XIAO MR60BHA2** | XIAO ESP32C6 + 60GHz mmWave breathing/heart radar kit | [Seeed Studio](https://www.seeedstudio.com/XIAO-MR60BHA2-60GHz-mmWave-Kit-p-5826.html) |
| USB-C cable | For flashing firmware and power | — |
| Power supply (optional) | 5V USB for standalone deployment | — |

The MR60BHA2 kit is an all-in-one module. The radar board plugs directly into the XIAO ESP32C6 — no extra wiring needed beyond the kit.

---

## Software & Services

### Cloud / Hosting

| Service | Purpose | Link |
|---------|---------|------|
| **Vercel** | Hosts the Next.js app (frontend + API routes) | [vercel.com](https://vercel.com) |
| **Supabase** | PostgreSQL database + real-time Postgres subscriptions | [supabase.com](https://supabase.com) |

### Frontend Stack

| Package | Version | Purpose | Link |
|---------|---------|---------|------|
| **Next.js** | 16.x | React framework (App Router, API routes, SSR) | [nextjs.org](https://nextjs.org) |
| **React** | 19.x | UI library | [react.dev](https://react.dev) |
| **Tailwind CSS** | 4.x | Utility-first CSS framework | [tailwindcss.com](https://tailwindcss.com) |
| **Recharts** | 3.x | Charting library (line, area, bar, donut charts) | [recharts.org](https://recharts.org) |
| **@tremor/react** | 3.x | UI components (cards, badges) | [tremor.so](https://tremor.so) |
| **@supabase/supabase-js** | 2.x | Supabase client (server + browser) | [supabase.com/docs](https://supabase.com/docs/reference/javascript) |

### Firmware / Embedded

| Tool | Purpose | Link |
|------|---------|------|
| **Arduino IDE 2.x** | Flashing firmware to ESP32C6 | [arduino.cc](https://www.arduino.cc/en/software) |
| **Seeed Arduino mmWave library** | Reads data from MR60BHA2 radar module | [GitHub](https://github.com/limengdu/Seeed-mmWave-library) |
| **ArduinoJson** | JSON serialization for API payloads | [arduinojson.org](https://arduinojson.org) |

### Dev Tools

| Tool | Purpose |
|------|---------|
| **Node.js 20+** | Runtime for Next.js dev server |
| **npm** | Package manager (`--legacy-peer-deps` flag needed) |
| **Git** | Version control |

---

## Architecture Overview

```
┌─────────────────────────────────┐
│         ESP32C6 Hardware        │
│  MR60BHA2 mmWave Radar Module   │
│  - Reads BR, HR, presence,      │
│    movement via UART            │
│  - POSTs JSON every 30s via     │
│    HTTPS (TLS, X-API-Key auth)  │
└───────────────┬─────────────────┘
                │  HTTPS POST /api/ingest
                ▼
┌─────────────────────────────────┐
│         Vercel (Next.js)        │
│                                 │
│  POST /api/ingest               │
│  - Validates API key + payload  │
│  - Infers sleep stage           │
│  - Writes to Supabase           │
│                                 │
│  GET /api/readings              │
│  GET /api/summary               │
│  - Queries Supabase             │
│  - Returns JSON to dashboard    │
│                                 │
│  Frontend (React)               │
│  - Real-time via Supabase       │
│    postgres_changes channel     │
└──────────┬──────────────────────┘
           │  Supabase JS client
           ▼
┌─────────────────────────────────┐
│      Supabase (PostgreSQL)      │
│                                 │
│  sensor_readings table          │
│  - id, recorded_at, BR, HR,     │
│    distance, presence,          │
│    movement_state, sleep_stage  │
│                                 │
│  Real-time subscription         │
│  - Dashboard receives INSERT    │
│    events immediately           │
└─────────────────────────────────┘
```

---

## Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/SleepTrackerV2.git
cd SleepTrackerV2
```

---

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com) and create a new project.

2. In the Supabase dashboard, open the **SQL Editor** and run the full schema:

   Copy and paste the contents of `supabase/schema.sql` into the SQL Editor and click **Run**.

   This creates:
   - `sensor_readings` table with all sensor fields + `sleep_stage`
   - Index on `recorded_at DESC` for fast time-range queries
   - Real-time publication so the dashboard receives live updates

3. After running the schema, go to **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon/public key** (long JWT string)

---

### 3. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Supabase — server-side (used in API routes, never sent to browser)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Supabase — client-side (bundled into browser JS for real-time)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Shared secret between Vercel and ESP32C6 firmware
# Generate with: openssl rand -hex 16
INGEST_API_KEY=your_32_char_secret_here
```

> Both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` point to the same Supabase project URL. The `NEXT_PUBLIC_` prefix is a Next.js convention that controls whether the variable gets bundled into browser-side JavaScript.

---

### 4. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is required because `@tremor/react` declares a React 18 peer dependency while this project uses React 19. The flag bypasses the peer dep conflict without breaking anything.

---

### 5. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard will show "No data" until the firmware is running or you POST test data manually.

**Available scripts:**

```bash
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build — also catches TypeScript errors
npm run lint     # ESLint
```

**Test the API locally** without any hardware:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_32_char_secret_here" \
  -d '{"breathing_rate": 12, "heart_rate": 58, "distance": 0.8, "presence": true, "movement_state": 0}'
```

Expected response: `{"ok":true,"sleep_stage":"deep"}`

You can also visit `/test` in the browser for an interactive API tester.

---

### 6. Deploy to Vercel

1. Push your code to GitHub (make sure `.env.local` and `secrets.h` are NOT committed — both are gitignored).

2. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.

3. In the **Environment Variables** section during setup (or later in Project Settings → Environment Variables), add all 5 variables:

   | Variable | Value |
   |----------|-------|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `NEXT_PUBLIC_SUPABASE_URL` | Same as `SUPABASE_URL` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as `SUPABASE_ANON_KEY` |
   | `INGEST_API_KEY` | Your 32-char secret key |

4. Click **Deploy**. Vercel auto-detects Next.js and runs `npm run build`.

5. Note your deployment URL (e.g. `https://sleep-tracker-v2.vercel.app`) — you'll need this for the firmware `secrets.h`.

---

### 7. Set Up Firmware

#### A. Install Arduino IDE

Download [Arduino IDE 2.x](https://www.arduino.cc/en/software) and install it.

#### B. Add ESP32 Board Support

1. Open Arduino IDE → **File → Preferences**
2. Add this URL to "Additional boards manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools → Board → Boards Manager**, search for **esp32**, install the Espressif Systems package.

#### C. Install Required Libraries

In Arduino IDE → **Tools → Manage Libraries**, search and install:

| Library | Author |
|---------|--------|
| **Seeed Arduino mmWave** | Seeed Studio |
| **ArduinoJson** | Benoit Blanchon |

#### D. Configure Firmware Secrets

```bash
cp firmware/sleep_tracker/secrets.h.example firmware/sleep_tracker/secrets.h
```

Edit `firmware/sleep_tracker/secrets.h`:

```cpp
#define WIFI_SSID      "YourNetworkName"
#define WIFI_PASSWORD  "YourWiFiPassword"
#define API_HOST       "sleep-tracker-v2.vercel.app"  // Your Vercel domain (no https://)
#define API_PATH       "/api/ingest"
#define INGEST_API_KEY "your_32_char_secret_here"      // Must match Vercel env var
```

> `secrets.h` is gitignored. It will never be committed to version control.

#### E. Flash and Verify

1. Connect the XIAO ESP32C6 via USB-C.
2. In Arduino IDE: **Tools → Board → esp32 → XIAO_ESP32C6**
3. **Tools → Port** → select the correct COM/tty port.
4. Click **Upload** (the → arrow button).
5. Open **Tools → Serial Monitor** at **115200 baud**.

Expected serial output when working correctly:

```
Connecting to WiFi......
WiFi connected! IP: 192.168.1.42
Sensor reading: BR=13.2 HR=62 presence=1 movement=0
POST /api/ingest -> 200 OK
Response: {"ok":true,"sleep_stage":"deep"}
```

---

## Project Structure

```
SleepTrackerV2/
├── app/                            # Next.js App Router
│   ├── api/
│   │   ├── ingest/route.ts        # POST — receives firmware sensor data
│   │   ├── readings/route.ts      # GET  — recent readings for the dashboard chart
│   │   └── summary/route.ts       # GET  — daily aggregated stats for history
│   ├── history/page.tsx           # /history — multi-day trends & data table
│   ├── test/page.tsx              # /test — dev utility (SVG states + API tester)
│   ├── layout.tsx                 # Root layout (dark theme, Geist font)
│   └── page.tsx                   # / — main real-time dashboard
│
├── components/dashboard/
│   ├── CurrentVitals.tsx          # BR, HR, and sleep stage cards
│   ├── SleepChart.tsx             # Dual-axis line chart (BR + HR over time)
│   ├── SleepStateIllustration.tsx # SVG animation (awake / light / deep / absent)
│   ├── SleepSummaryCard.tsx       # Quality score + donut chart
│   └── TrendChart.tsx             # Multi-day area chart
│
├── lib/
│   ├── supabase.ts                # Server + browser Supabase clients (lazy singleton)
│   └── sleep-utils.ts             # inferSleepStage() + computeQualityScore()
│
├── firmware/sleep_tracker/
│   ├── sleep_tracker.ino          # Arduino sketch — reads sensor, POSTs every 30s
│   └── secrets.h.example          # Template for WiFi credentials + API key
│
├── supabase/
│   └── schema.sql                 # Run in Supabase SQL Editor to create tables
│
├── proxy.ts                       # Rate limiting middleware (10 req/min on /api/ingest)
├── next.config.ts                 # Next.js config
├── tailwind.config.ts             # Tailwind CSS config
├── .env.example                   # Environment variable template
└── package.json                   # Node dependencies
```

---

## API Reference

### `POST /api/ingest`

Receives sensor readings from the ESP32C6 firmware. Requires API key authentication.

**Headers:**
```
Content-Type: application/json
X-API-Key: <INGEST_API_KEY>
```

**Request Body:**
```json
{
  "breathing_rate": 13.5,
  "heart_rate": 58,
  "distance": 0.9,
  "presence": true,
  "movement_state": 0
}
```

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `breathing_rate` | number | 0–40 | Breaths per minute |
| `heart_rate` | number | 0–200 | Beats per minute |
| `distance` | number | — | Detected range in meters |
| `presence` | boolean | — | Whether a person is detected |
| `movement_state` | integer | 0 or 1 | 0 = still, 1 = moving |

**Response (200):**
```json
{ "ok": true, "sleep_stage": "deep" }
```

**Errors:** `401` — bad API key · `400` — invalid payload · `429` — rate limited

---

### `GET /api/readings`

Returns recent sensor readings for charting.

| Query Param | Default | Max | Description |
|-------------|---------|-----|-------------|
| `limit` | 200 | 1000 | Max records to return |
| `since` | — | — | ISO 8601 datetime — return readings on or after this time |

**Example:** `GET /api/readings?limit=100&since=2026-03-05T00:00:00Z`

Results are returned in ascending time order for chart rendering.

---

### `GET /api/summary`

Returns aggregated daily statistics.

| Query Param | Default | Max | Description |
|-------------|---------|-----|-------------|
| `days` | 7 | 30 | How many past days to include |

**Response:**
```json
{
  "summary": [
    {
      "date": "2026-03-04",
      "avg_hr": 62.3,
      "avg_br": 14.1,
      "quality_score": 7.2,
      "stage_counts": { "deep": 180, "light": 220, "awake": 50 },
      "reading_count": 450
    }
  ]
}
```

---

## Sleep Stage Logic

Sleep stages are inferred server-side in `lib/sleep-utils.ts` on every ingest request.

### Classification Rules

| Stage | Condition |
|-------|-----------|
| **awake** | `presence = false` OR `movement_state = 1` (moving) |
| **deep** | `presence = true` AND still AND `breathing_rate ≤ 14` AND `heart_rate ≤ 70` |
| **light** | `presence = true` AND still AND (BR > 14 OR HR > 70) |

### Quality Score

Computed per day, ranges 0–10:

```
score = (deepCount / total) × 10
      + (lightCount / total) × 5
      − (awakeCount / total) × 3
```

Clamped to `[0, 10]`. A score of 10 = all deep sleep; the formula penalizes awake time.

### Tuning Thresholds

In `lib/sleep-utils.ts`:

```typescript
const BREATHING_DEEP_MAX = 14; // breaths/min
const HR_DEEP_MAX = 70;        // BPM
```

If deep sleep is never detected, raise these. If almost everything reads as deep, lower them. The right values vary by person and sensor placement.

---

## Dashboard Pages

### `/` — Live Dashboard

- **Live clock** — updates every second
- **SVG illustration** — animated person in bed showing current sleep state (awake / light / deep / no presence), with breathing animation driven by current breathing rate
- **Current Vitals** — latest breathing rate, heart rate, and sleep stage
- **Vitals Chart** — last 4 hours of BR and HR on a dual-axis Recharts line chart
- **Sleep Summary** — quality score, stage donut chart, avg HR/BR for the current session

Updates in real-time via a Supabase `postgres_changes` subscription.

### `/history` — Trends

- Toggle **7d / 14d / 30d** window
- **Trend chart** — HR, BR, and quality score as area charts over multiple days
- **Stage bar chart** — stacked deep/light/awake reading counts per night
- **Summary table** — one row per day with all stats

### `/test` — Dev Utility

- Preview all 4 SVG illustration states side by side
- Interactive buttons to hit each API endpoint with real requests
- Shows HTTP status, request/response payloads, and pass/fail result

---

## Configuration & Tuning

### Firmware POST Interval

Default is 30 seconds. Change `POST_INTERVAL_MS` in `sleep_tracker.ino`:

```cpp
const unsigned long POST_INTERVAL_MS = 30000; // milliseconds
```

Shorter intervals mean more granular data but higher Supabase write volume.

### Rate Limiting

`proxy.ts` allows **10 POST requests per minute per IP**. At 30s intervals the firmware uses ~2/min — well under the limit. Adjust `MAX_REQUESTS` and `WINDOW_MS` in `proxy.ts` if you change the interval.

> The rate limiter is in-memory and resets on Vercel cold starts. For a more robust setup, replace it with [Vercel KV](https://vercel.com/docs/storage/vercel-kv) or [Upstash Redis](https://upstash.com).

### TLS Certificate

The firmware embeds the **GTS Root R1** CA certificate to verify Vercel's TLS chain. This certificate expires in January 2028. If you see TLS handshake failures, check if Vercel has switched to a different certificate authority and update the `VERCEL_ROOT_CA` constant in `sleep_tracker.ino`.

### Database Retention

There is no automatic data purge. At 30-second intervals, each reading is ~200 bytes. Rough estimates for the Supabase free tier (500MB):

| Duration | Approx. storage |
|----------|----------------|
| 1 month | ~17MB |
| 1 year | ~200MB |

Add a scheduled Postgres function or Supabase Edge Function to prune old rows if storage becomes a concern.

---

## Security Notes

| Concern | Mitigation |
|---------|------------|
| API authentication | `X-API-Key` header required on every `/api/ingest` POST |
| Firmware secrets | `secrets.h` is gitignored and never committed |
| Rate limiting | 10 req/min per IP prevents ingest flooding |
| TLS / HTTPS | Firmware verifies Vercel's certificate with a pinned CA cert |
| Supabase access | Anon key used (no RLS); fine for personal/single-user deployment |
| Env vars | `.env.local` is gitignored; production vars set in Vercel dashboard only |

**Generate a secure API key:**
```bash
openssl rand -hex 16
```

---

## Handoff Notes

### What's Working

- Full end-to-end pipeline: firmware → Vercel API → Supabase → live dashboard
- Real-time dashboard updates via Supabase postgres_changes
- Sleep stage inference (awake / light / deep) with quality score
- Historical trends (7d / 14d / 30d) with charts and data table
- Rate limiting on the ingest endpoint
- Responsive layout for mobile and desktop

### Known Limitations & Future Work

| Item | Notes |
|------|-------|
| **In-memory rate limiting** | Resets on cold starts. For production, use Vercel KV or Upstash Redis. |
| **No Row-Level Security** | Supabase RLS is commented out. Fine for personal use; add policies for multi-user. |
| **No dashboard auth** | The dashboard is publicly readable. Add Supabase Auth or NextAuth if needed. |
| **TLS cert expires 2028** | `VERCEL_ROOT_CA` in firmware needs updating when GTS Root R1 expires. |
| **Static sleep thresholds** | `BREATHING_DEEP_MAX = 14`, `HR_DEEP_MAX = 70` — tune per person. |
| **`sleep_sessions` table unused** | Schema has a session-level aggregation table that isn't populated yet. |
| **No alerting** | No push/email notifications for abnormal readings. |

### Dependency Notes

| Package | Note |
|---------|------|
| `@tremor/react` | Pinned at v3 (React 18 peer dep). Check for React 19-compatible releases before upgrading. |
| `next` | On 16.x. Major versions often include App Router breaking changes. |
| `@supabase/supabase-js` | Real-time API is stable. Watch for v3 client changes. |

### Key Files for Onboarding

| File | Why It Matters |
|------|---------------|
| `supabase/schema.sql` | Run this first — nothing works without the DB tables |
| `.env.example` | Template for all required environment variables |
| `firmware/sleep_tracker/secrets.h.example` | Template for firmware WiFi + API credentials |
| `lib/sleep-utils.ts` | Core logic: sleep stage classification and quality score formula |
| `app/api/ingest/route.ts` | Primary data entry point — all sensor data flows through here |
| `proxy.ts` | Rate limiting — understand this before changing hosting platforms |
