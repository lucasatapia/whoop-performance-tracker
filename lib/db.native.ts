import * as SQLite from 'expo-sqlite';

/* ── record shapes ──────────────────────────────── */
export type Workout   = { id: number; exercise: string; date: string };
export type SetRecord = {
  id: number; workout_id: number;
  weight?: number | null; reps?: number | null;
  distance?: number | null; seconds?: number | null;
};
export type PR = { value: number; date: string };

/* ── open DB once, force FKs ON for that connection ─ */
const DB_NAME = 'whoop.db';

if (!(globalThis as any).__whoopDbPromise) {
  (globalThis as any).__whoopDbPromise = SQLite
    .openDatabaseAsync(DB_NAME)
    .then(db =>
      db.execAsync?.('PRAGMA foreign_keys = ON;').then(() => db)
    );
}
const dbReady: Promise<SQLite.SQLiteDatabase> =
  (globalThis as any).__whoopDbPromise;

const withDb = <T>(fn: (db: SQLite.SQLiteDatabase) => T | Promise<T>) =>
  dbReady.then(fn);

/* ── bootstrap (idempotent) ──────────────────────── */
void withDb(db => db.execAsync?.(`
  CREATE TABLE IF NOT EXISTS workouts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise  TEXT NOT NULL,
    date      TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL
      REFERENCES workouts(id) ON DELETE CASCADE,
    weight     REAL,
    reps       INTEGER,
    distance   REAL,
    seconds    REAL
  );
  CREATE INDEX IF NOT EXISTS idx_sets_workout ON sets(workout_id);
`));

/* ── DEV-ONLY one-liner wipe ─────────────────────── */
export async function resetDatabase(): Promise<void> {
  if (!__DEV__) return;                    // no nuking prod data
  await withDb(async db => {
    await db.execAsync('BEGIN');
    try {
      await db.execAsync('DELETE FROM sets;');
      await db.execAsync('DELETE FROM workouts;');
      await db.execAsync(`
        DELETE FROM sqlite_sequence
        WHERE name IN ('sets','workouts');
      `);
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  });
}

/* ── CRUD helpers ───────────────────────────────── */
export async function addWorkout(
  exercise: string,
  date: string,
  sets: Array<Partial<Omit<SetRecord, 'id' | 'workout_id'>>>
) {
  await withDb(async db => {
    await db.execAsync('BEGIN');
    try {
      const { lastInsertRowId } = await db.runAsync(
        'INSERT INTO workouts (exercise, date) VALUES (?, ?)',
        [exercise, date]
      );
      for (const s of sets) {
        await db.runAsync(
          `INSERT INTO sets (workout_id, weight, reps, distance, seconds)
           VALUES (?, ?, ?, ?, ?)`,
          [
            lastInsertRowId,
            s.weight   ?? null,
            s.reps     ?? null,
            s.distance ?? null,
            s.seconds  ?? null,
          ]
        );
      }
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  });
}

/* ——— look-ups & deletes ——— */
export const getWorkoutById = (id: number): Promise<Workout | null> =>
  withDb(db =>
    db.getFirstAsync<Workout>(
      'SELECT * FROM workouts WHERE id = ? LIMIT 1',
      [id]
    ).then(r => r ?? null)
  );

export const deleteWorkout = (id: number): Promise<void> =>
  withDb(db =>
    db.runAsync('DELETE FROM workouts WHERE id = ?', [id]).then(() => undefined)
  );

export const getWorkouts = (exercise: string): Promise<Workout[]> =>
  withDb(db =>
    db.getAllAsync<Workout>(
      `SELECT * FROM workouts
       WHERE exercise = ? COLLATE NOCASE
       ORDER BY date DESC`,
      [exercise]
    )
  );

export const getSets = (workoutId: number): Promise<SetRecord[]> =>
  withDb(db =>
    db.getAllAsync<SetRecord>(
      'SELECT * FROM sets WHERE workout_id = ? ORDER BY id',
      [workoutId]
    )
  );

/* ——— convenience helpers ——— */
const todayStr = () => new Date().toISOString().slice(0, 10);

export const getLastWorkout = (exercise: string): Promise<Workout | null> =>
  getWorkouts(exercise).then(ws =>
    ws.find(w => w.date < todayStr()) ?? null
  );

export const getTodayWorkout = (exercise: string): Promise<Workout | null> =>
  getWorkouts(exercise).then(ws =>
    ws.find(w => w.date === todayStr()) ?? null
  );

/* ── PR helpers ─────────────────────────────────── */
export function getPersonalRecord(
  exercise: string,
  metric: 'weight' | 'reps' | 'distance' | 'seconds',
  what: 'max' | 'min'
): Promise<PR | null> {
  const order = what === 'max' ? 'DESC' : 'ASC';
  return withDb(db =>
    db.getFirstAsync<PR>(
      `
        SELECT s.${metric} AS value, w.date
        FROM   sets s
        JOIN   workouts w ON w.id = s.workout_id
        WHERE  w.exercise = ? COLLATE NOCASE
          AND  s.${metric} IS NOT NULL
        ORDER  BY s.${metric} ${order}
        LIMIT  1
      `,
      [exercise]
    ).then(r => r ?? null)
  );
}

export function getMaxWeightForReps(
  exercise: string,
  targetReps: number
): Promise<PR | null> {
  return withDb(db =>
    db.getFirstAsync<PR>(
      `
        SELECT s.weight AS value, w.date
        FROM   sets s
        JOIN   workouts w ON w.id = s.workout_id
        WHERE  w.exercise = ? COLLATE NOCASE
          AND  s.reps     = ?
          AND  s.weight   IS NOT NULL
        ORDER  BY s.weight DESC
        LIMIT  1
      `,
      [exercise, targetReps]
    ).then(r => r ?? null)
  );
}

export function getMaxRepsForWeight(
  exercise: string,
  targetWeight: number
): Promise<PR | null> {
  return withDb(db =>
    db.getFirstAsync<PR>(
      `
        SELECT s.reps AS value, w.date
        FROM   sets s
        JOIN   workouts w ON w.id = s.workout_id
        WHERE  w.exercise = ? COLLATE NOCASE
          AND  s.weight   = ?
          AND  s.reps     IS NOT NULL
        ORDER  BY s.reps DESC
        LIMIT  1
      `,
      [exercise, targetWeight]
    ).then(r => r ?? null)
  );
}

/*
 * Aggregate per-day stats: volume, top weight, and reps at that weight.
 */
export function getExerciseStatsHistory(
  exercise: string,
  startISO: string,
  endISO: string
): Promise<Array<{ date: string; volume: number; topWeight: number; reps: number }>> {
  return withDb(async db => {
    const rows = await db.getAllAsync<{ date: string; volume: number; topWeight: number }>(
      `
        SELECT
          w.date                 AS date,
          SUM(s.weight * s.reps) AS volume,
          MAX(s.weight)          AS topWeight
        FROM workouts w
        JOIN sets s ON s.workout_id = w.id
        WHERE w.exercise = ?
          AND w.date    BETWEEN ? AND ?
        GROUP BY w.date
        ORDER BY w.date;
      `,
      [exercise, startISO, endISO]
    );

    const out: Array<{ date: string; volume: number; topWeight: number; reps: number }> = [];
    for (const { date, volume, topWeight } of rows) {
      const repsRow = await db.getFirstAsync<{ reps: number }>(
        `
          SELECT s.reps
          FROM   sets s
          JOIN   workouts w ON w.id = s.workout_id
          WHERE  w.exercise = ?
            AND  w.date     = ?
            AND  s.weight   = ?
          ORDER  BY s.weight DESC
          LIMIT  1;
        `,
        [exercise, date, topWeight]
      );
      out.push({ date, volume, topWeight, reps: repsRow?.reps ?? 0 });
    }
    return out;
  });
}


