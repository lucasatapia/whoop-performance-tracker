// app/(tabs)/last-vs-this.tsx — Compare Tab (top‑set only, PST‑aware header)

import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  Pressable,
  TextInput,
  ToastAndroid,
  Platform,
  Alert,
  StyleSheet,
  View,
} from "react-native";
import { storage } from "@/lib/storage";            // ✅ cross‑platform token storage
import { getWorkouts } from "@/lib/api";
import { EXERCISES } from "@/constants/exercises";
import Card from "@/ui/Card";
import { theme } from "@/theme";

/*****************************************
 * Types & helpers
 *****************************************/
type SetRecord = {
  exercise: string;
  reps: number | null;
  weight_kg: number | null;
  is_top_set: boolean;
};

type Workout = {
  id: string;
  date: string; // YYYY-MM-DD
  sets: SetRecord[];
};

function toast(msg: string) {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert(msg);
}

function getTopSet(sets: SetRecord[]): SetRecord | undefined {
  return sets.reduce<SetRecord | undefined>((best, cur) => {
    const score = (s: SetRecord | undefined) =>
      s ? (s.weight_kg ?? 0) * (1 + (s.reps ?? 0) / 30) : -Infinity;
    return score(cur) > score(best) ? cur : best;
  }, undefined);
}

/** Return YYYY-MM-DD for the current calendar day in PST/PDT */
function todayPstStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("/", "-");
}

/*****************************************
 * Component
 *****************************************/
export default function LastVsThis() {
  const [filter, setFilter]     = useState("");
  const [exercise, setExercise] = useState<string>(EXERCISES[0]);

  const shown = EXERCISES.filter((ex) =>
    ex.toLowerCase().includes(filter.trim().toLowerCase())
  );

  const [lastTop,  setLastTop]  = useState<SetRecord | undefined>();
  const [todayTop, setTodayTop] = useState<SetRecord | undefined>();
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [todayDate,setTodayDate]= useState<string | null>(null);

  /* fetch workouts whenever exercise changes */
  useEffect(() => {
    let canceled = false;
    (async () => {
      const token = await storage.getItem("token");
      if (!token) return;

      const workouts: Workout[] = await getWorkouts(token);
      const byExercise = workouts.filter((w) =>
        w.sets.some((s) => s.exercise === exercise)
      );
      const pstToday = todayPstStr();

      const todayW = byExercise.find((w) => w.date === pstToday) ?? null;
      const lastW  = byExercise.find((w) => w.date < pstToday)  ?? null;

      if (canceled) return;

      setTodayDate(todayW ? todayW.date : null);
      setLastDate(lastW  ? lastW.date  : null);

      setTodayTop(
        todayW ? getTopSet(todayW.sets.filter((s) => s.exercise === exercise)) : undefined
      );
      setLastTop(
        lastW  ? getTopSet(lastW.sets.filter((s) => s.exercise === exercise))  : undefined
      );
    })();
    return () => { canceled = true; };
  }, [exercise]);

  /* toast PR notification */
  useEffect(() => {
    if (
      lastTop &&
      todayTop &&
      (todayTop.weight_kg ?? 0) > (lastTop.weight_kg ?? 0)
    ) {
      toast("New top‑set PR weight — nice!");
    }
  }, [lastTop, todayTop]);

  /* rows for comparison table */
  const rows = useMemo(() => {
    const vol = (s?: SetRecord | null) =>
      s?.weight_kg != null && s.reps != null ? s.weight_kg * s.reps : null;
    const build = (
      metric: "weight" | "reps" | "volume",
      prev: number | null | undefined,
      cur: number | null | undefined
    ) => {
      const delta = prev != null && cur != null ? cur - prev : null;
      return { metric, prev, cur, delta };
    };
    return [
      build("weight", lastTop?.weight_kg ?? null, todayTop?.weight_kg ?? null),
      build("reps",   lastTop?.reps      ?? null, todayTop?.reps      ?? null),
      build("volume", vol(lastTop),             vol(todayTop)),
    ];
  }, [lastTop, todayTop]);

  /* dynamic labels */
  const lastLabel  = lastDate  ? `Last (${lastDate})`  : "Last";
  const todayLabel =
    todayDate && todayDate === todayPstStr()
      ? `Today (${todayDate})`
      : todayDate ?? "Today";

  /*****************************************
   * UI
   *****************************************/
  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing(4), gap: theme.spacing(4), backgroundColor: theme.colors.bg }}>
      {/* search */}
      <TextInput
        placeholder="Search exercise…"
        placeholderTextColor={theme.colors.muted}
        value={filter}
        onChangeText={setFilter}
        style={styles.search}
      />

      {/* picker */}
      <Card style={{ padding: theme.spacing(2) }}>
        {shown.map((ex) => (
          <Pressable
            key={ex}
            onPress={() => setExercise(ex)}
            style={[styles.chip, ex === exercise && styles.chipActive]}
          >
            <Text style={{ color: theme.colors.text }}>{ex}</Text>
          </Pressable>
        ))}
        {shown.length === 0 && (
          <Text style={{ color: theme.colors.text }}>No match 🤷‍♂️</Text>
        )}
      </Card>

      {/* comparison */}
      <Card>
        <Text style={styles.headline}>{exercise}</Text>

        {/* headers */}
        <View style={[styles.row, { marginBottom: theme.spacing(1) }]}>
          <Text style={styles.metricCol} />
          <View style={styles.valCol}><Text style={styles.colHeader}>{lastLabel}</Text></View>
          <Text style={[styles.deltaCol, styles.colHeader]}>Δ</Text>
          <View style={styles.valCol}><Text style={styles.colHeader}>{todayLabel}</Text></View>
        </View>

        {rows.map(({ metric, prev, cur, delta }) =>
          prev == null && cur == null ? null : (
            <View key={metric} style={styles.row}>
              <Text style={[styles.metricCol, styles.text]}>{metric}</Text>
              <Text style={[styles.valCol,   styles.text]}>{prev  ?? "-"}</Text>
              <Text style={[styles.deltaCol, styles.text, { color: delta != null && delta > 0 ? theme.colors.accent : theme.colors.text }]}>
                {delta == null ? "-" : delta > 0 ? `+${delta}` : delta}
              </Text>
              <Text style={[styles.valCol,   styles.text]}>{cur   ?? "-"}</Text>
            </View>
          )
        )}

        <Text style={styles.footnote}>
          Δ compares today’s top‑set vs. previous workout’s top‑set (dates in PST/PDT).
        </Text>
      </Card>
    </ScrollView>
  );
}

/*****************************************
 * Styles (unchanged)
 *****************************************/
const styles = StyleSheet.create({
  search: {
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.muted,
    padding: theme.spacing(2),
    borderRadius: 6,
  },
  chip: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(2),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.muted,
    borderRadius: 6,
  },
  chipActive: { borderColor: theme.colors.accent },
  headline: {
    fontSize: 20,
    fontFamily: theme.fonts.headline,
    color: theme.colors.text,
    marginBottom: theme.spacing(2),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  metricCol: { flex: 1 },
  valCol: { flex: 1, alignItems: "center" },
  deltaCol: { width: 60, textAlign: "center" },
  colHeader: { color: theme.colors.accent, fontWeight: "bold", fontSize: 14 },
  text: { color: theme.colors.text },
  footnote: {
    marginTop: theme.spacing(2),
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
});
