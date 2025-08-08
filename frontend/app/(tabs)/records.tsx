// app/(tabs)/records.tsx — Personal‑Records Tab

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { storage } from "@/lib/storage";            // ✅ wrapper (SecureStore native, localStorage web)
import { getWorkouts } from "@/lib/api";
import { EXERCISES } from "@/constants/exercises";
import { Card } from "@/ui/Card";
import { theme } from "@/theme";

type Mode = "byReps" | "byWeight";
type PRMap = Record<string, { value: number; date: string } | null>;

type SetRecord = {
  exercise: string;
  reps: number | null;
  weight_kg: number | null;
  is_top_set: boolean;
};

type Workout = { date: string; sets: SetRecord[] };

export default function Records() {
  const [mode, setMode]     = useState<Mode>("byReps");
  const [target, setTarget] = useState("5");
  const [prs, setPrs]       = useState<PRMap>({});

  /* fetch all workouts once on mount & when mode/target changes */
  useEffect(() => {
    let canceled = false;
    (async () => {
      const token = await storage.getItem("token");
      if (!token) return;

      const workouts: Workout[] = await getWorkouts(token);

      const n = Number(target);
      if (!Number.isFinite(n) || n <= 0) return;

      const next: PRMap = {};
      EXERCISES.forEach((ex) => (next[ex] = null));

      workouts.forEach((w) => {
        w.sets.forEach((s) => {
          const ex = s.exercise;                 // simplify variable name
          if (mode === "byReps") {
            if ((s.reps ?? 0) !== n) return;
            const cur = next[ex];
            if (!cur || (s.weight_kg ?? 0) > cur.value) {
              next[ex] = { value: s.weight_kg ?? 0, date: w.date };
            }
          } else {
            if ((s.weight_kg ?? 0) !== n) return;
            const cur = next[ex];
            if (!cur || (s.reps ?? 0) > cur.value) {
              next[ex] = { value: s.reps ?? 0, date: w.date };
            }
          }
        });
      });

      if (!canceled) setPrs(next);
    })();
    return () => { canceled = true; };
  }, [mode, target]);

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing(4), gap: theme.spacing(4), backgroundColor: theme.colors.bg }}>
      {/* toggle */}
      <Card style={{ flexDirection: "row", gap: theme.spacing(2) }}>
        {[
          ["byReps",   "Heaviest for N reps"],
          ["byWeight", "Most reps with W"],
        ].map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setMode(key as Mode)}
            style={{
              flex: 1,
              padding: theme.spacing(2),
              alignItems: "center",
              borderWidth: 1,
              borderColor: mode === key ? theme.colors.accent : theme.colors.muted,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: theme.colors.text }}>{label}</Text>
          </Pressable>
        ))}
      </Card>

      {/* numeric input */}
      <Card>
        <Text style={{ color: theme.colors.text, marginBottom: theme.spacing(2) }}>
          {mode === "byReps" ? "Reps" : "Weight"}
        </Text>
        <TextInput
          keyboardType="numeric"
          value={target}
          onChangeText={setTarget}
          placeholder={mode === "byReps" ? "e.g. 5" : "e.g. 100"}
          placeholderTextColor={theme.colors.muted}
          style={{
            color: theme.colors.text,
            borderBottomWidth: 1,
            borderColor: theme.colors.muted,
          }}
        />
      </Card>

      {/* results */}
      {EXERCISES.map((ex) => {
        const pr = prs[ex];
        return (
          <Card key={ex}>
            <Text style={{ fontFamily: theme.fonts.headline, color: theme.colors.text, marginBottom: theme.spacing(2) }}>
              {ex}
            </Text>

            {pr ? (
              mode === "byReps" ? (
                <Text style={{ color: theme.colors.text }}>
                  Heaviest: <Text style={{ fontWeight: "bold" }}>{pr.value}</Text> on {pr.date}
                </Text>
              ) : (
                <Text style={{ color: theme.colors.text }}>
                  Max reps: <Text style={{ fontWeight: "bold" }}>{pr.value}</Text> on {pr.date}
                </Text>
              )
            ) : (
              <Text style={{ color: theme.colors.text }}>No record yet 🙃</Text>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}
