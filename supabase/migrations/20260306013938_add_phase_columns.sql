ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS breath_phase FLOAT;
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS heart_phase FLOAT;
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS total_phase FLOAT;
