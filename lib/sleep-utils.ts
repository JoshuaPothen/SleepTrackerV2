export type SleepStage = 'awake' | 'light' | 'deep';

export interface SensorPayload {
  breathing_rate: number | null;
  heart_rate: number | null;
  presence: boolean | null;
  movement_state: number | null;
}

/**
 * Infer sleep stage from raw sensor values.
 *
 * Thresholds are approximations based on typical adult physiology.
 * Tune BREATHING_DEEP_MAX and HR_DEEP_MAX to match real-world readings.
 */
const BREATHING_DEEP_MAX = 14; // breaths/min
const HR_DEEP_MAX = 70;        // BPM

export function inferSleepStage(data: SensorPayload): SleepStage {
  // No presence or active movement → awake (or absent, treated as awake)
  if (!data.presence || data.movement_state === 1) {
    return 'awake';
  }

  const br = data.breathing_rate;
  const hr = data.heart_rate;

  // Deep sleep: low breathing rate AND low heart rate AND still
  if (
    br !== null && hr !== null &&
    br <= BREATHING_DEEP_MAX &&
    hr <= HR_DEEP_MAX
  ) {
    return 'deep';
  }

  // Light sleep: present and still, but vitals not in deep range
  return 'light';
}

/**
 * Compute a sleep quality score (0–10) from a set of readings.
 * Higher score = more time in deep sleep, stable HR and BR.
 */
export function computeQualityScore(readings: SensorPayload[]): number {
  if (readings.length === 0) return 0;

  const stages = readings.map(inferSleepStage);
  const deepCount = stages.filter((s) => s === 'deep').length;
  const lightCount = stages.filter((s) => s === 'light').length;
  const awakeCount = stages.filter((s) => s === 'awake').length;

  const total = readings.length;
  const deepRatio = deepCount / total;
  const lightRatio = lightCount / total;
  const awakeRatio = awakeCount / total;

  // Weighted: deep sleep is most valuable, awake time penalises score
  const score = deepRatio * 10 + lightRatio * 5 - awakeRatio * 3;
  return Math.max(0, Math.min(10, parseFloat(score.toFixed(1))));
}
