import localforage from 'localforage';

// Simple store keyed by exercise → array of { date, reps, topWeight }
const store = localforage.createInstance({ name: 'whoop-db' });

export async function addWorkout(
  exercise: string,
  dateISO: string,
  sets: { weight: number | null; reps: number | null }[]
) {
  const key = `hist:${exercise}`;
  const hist = ((await store.getItem<any[]>(key)) ?? []);
  hist.push({ date: dateISO, ...sets[0] });
  await store.setItem(key, hist);
}

export async function getExerciseStatsHistory(
  exercise: string,
  isoStart: string,
  isoEnd: string
) {
  const key = `hist:${exercise}`;
  const hist: any[] = (await store.getItem<any[]>(key)) ?? [];
  return hist.filter(h => h.date >= isoStart && h.date <= isoEnd);
}
