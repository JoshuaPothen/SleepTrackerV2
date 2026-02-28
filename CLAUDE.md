# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
SleepTrackerV2 is a real-time sleep monitoring system using the Seeed Studio XIAO MR60BHA2 kit (ESP32C6 + 60GHz mmWave radar). The sensor reads breathing rate, heart rate, presence, and movement; an Arduino firmware POSTs this data to a Vercel-hosted Next.js dashboard over HTTPS.

## Tech Stack
- **Frontend/Backend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI components:** Tremor (`@tremor/react`) + Recharts
- **Database:** Supabase (PostgreSQL + TimescaleDB extension)
- **Real-time:** Supabase postgres_changes subscriptions
- **Hosting:** Vercel
- **Firmware:** Arduino C++ for XIAO ESP32C6 (Seeed mmWave library)

## Key Commands
```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

## Project Structure
```
app/                    # Next.js App Router pages + API routes
  api/ingest/           # POST endpoint for XIAO firmware
  api/readings/         # GET recent sensor readings
  api/summary/          # GET aggregated daily stats
  history/              # /history page (trends)
  page.tsx              # / dashboard page
components/dashboard/   # All dashboard React components
lib/
  supabase.ts           # Supabase client + types
  sleep-utils.ts        # Sleep stage inference + quality score
firmware/sleep_tracker/ # Arduino sketch for XIAO ESP32C6
supabase/schema.sql     # Database schema (run in Supabase SQL editor)
middleware.ts           # Rate limiting on /api/ingest
```

## Environment Variables
Copy `.env.example` → `.env.local` and fill in:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — server-side Supabase
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-side Supabase
- `INGEST_API_KEY` — shared secret between Vercel and ESP32C6 firmware

## Firmware Setup
1. Copy `firmware/sleep_tracker/secrets.h.example` → `secrets.h` (gitignored)
2. Install "Seeed mmWave" library in Arduino IDE
3. Select board: XIAO_ESP32C6
4. Flash and open Serial Monitor at 115200 baud

## Security Notes
- ESP32C6 uses `WiFiClientSecure` with ISRG Root X1 CA cert for TLS
- All ingest requests require `X-API-Key` header — returns 401 otherwise
- `firmware/sleep_tracker/secrets.h` is gitignored — never commit it
- Rate limiting: max 10 POST /api/ingest requests/minute per IP (middleware.ts)

## Sleep Stage Inference
Stages are inferred server-side in `lib/sleep-utils.ts`:
- `deep` — presence=true, still, BR ≤ 14, HR ≤ 70
- `light` — presence=true, still, but not in deep range
- `awake` — no presence, or movement detected
Thresholds (`BREATHING_DEEP_MAX`, `HR_DEEP_MAX`) are constants to tune.
