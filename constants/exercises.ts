/** Curated exercise list (similar to WHOOP Strength Trainer) */
export const EXERCISES = [
  // ── Upper body
  'Bench Press',
  'Incline Bench Press',
  'Overhead Press',
  'Pull-Up',
  'Bent-Over Row',
  'Biceps Curl',
  'Triceps Dip',

  // ── Lower body
  'Squat',
  'Front Squat',
  'Deadlift',
  'Romanian Deadlift',
  'Lunge',

  // ── Core & full-body
  'Plank',
  'Burpee',
  'Kettlebell Swing',
] as const;

export type ExerciseName = typeof EXERCISES[number];
