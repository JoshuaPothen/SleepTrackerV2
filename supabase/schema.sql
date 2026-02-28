-- SleepTrackerV2 Database Schema
-- Run this in the Supabase SQL editor.
-- Standard PostgreSQL — no TimescaleDB required.

-- Raw sensor readings (posted every ~30s from the XIAO ESP32C6)
CREATE TABLE IF NOT EXISTS sensor_readings (
  id             BIGSERIAL PRIMARY KEY,
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  breathing_rate FLOAT,        -- breaths/min (0-20), from MR60BHA2
  heart_rate     FLOAT,        -- BPM (0-100), from MR60BHA2
  distance       FLOAT,        -- meters to detected subject
  presence       BOOLEAN,      -- human detected by radar
  movement_state INTEGER,      -- 0 = still, 1 = moving
  sleep_stage    VARCHAR(20)   -- 'awake' | 'light' | 'deep' (inferred server-side)
);

-- Index for fast recent-data queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_time ON sensor_readings (recorded_at DESC);

-- Enable Supabase real-time on this table
ALTER TABLE sensor_readings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;

-- Sleep sessions table (one row per sleep session)
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id            BIGSERIAL PRIMARY KEY,
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ,
  avg_hr        FLOAT,
  avg_br        FLOAT,
  quality_score FLOAT        -- 0-10 computed score
);

-- ============================================================
-- Row-level security (RLS) — not required for personal use,
-- but good practice if you ever expose the Supabase anon key.
-- ============================================================
-- ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sleep_sessions  ENABLE ROW LEVEL SECURITY;
