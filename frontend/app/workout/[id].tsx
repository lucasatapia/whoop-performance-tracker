// app/workout/[id].tsx — Workout detail (cloud, storage‑safe)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { storage } from "@/lib/storage";          // ✅ wrapper (SecureStore native, localStorage web)
import { getWorkouts, deleteWorkout } from "@/lib/api";
import Card from "@/ui/Card";
import { theme } from "@/theme";
import { MaterialIcons } from "@expo/vector-icons";

type SetRecord = { reps: number | null; weight_kg: number | null };
type Workout = {
  id: string;
  date: string;            // YYYY‑MM‑DD
  exercise: string;
  sets: SetRecord[];
};

export default function WorkoutDetail() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const router    = useRouter();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<Workout | null>(null);

  /* ───────── fetch details ───────── */
  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!id) return;
      const token = await storage.getItem("token");
      if (!token) return;

      const all = await getWorkouts(token);
      const w   = all.find((w) => w.id === id) ?? null;

      if (!canceled) {
        setWorkout(w);
        setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, [id]);

  /* ───────── handlers ───────── */
  const onDelete = async () => {
    if (!workout) return;
    Alert.alert("Delete workout?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const token = await storage.getItem("token");
          if (!token) return;
          await deleteWorkout(token, workout.id);
          router.back();
        },
      },
    ]);
  };

  if (loading)      return <View style={styles.center}><Text style={styles.text}>Loading…</Text></View>;
  if (!workout)     return <View style={styles.center}><Text style={styles.text}>Workout not found</Text></View>;

  /* ───────── UI ───────── */
  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing(4), backgroundColor: theme.colors.bg }}>
      {/* header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing(4) }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: theme.spacing(2) }}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headline}>{workout.exercise}</Text>
      </View>

      <Card>
        <Text style={styles.subHeader}>Date</Text>
        <Text style={styles.text}>{workout.date}</Text>

        <Text style={[styles.subHeader, { marginTop: theme.spacing(3) }]}>Sets</Text>
        {workout.sets.map((s, i) => (
          <Text key={i} style={styles.text}>
            {i + 1}. {s.weight_kg ?? "-"}×{s.reps ?? "-"}
          </Text>
        ))}
      </Card>

      {/* delete */}
      <Pressable onPress={onDelete} style={styles.deleteBtn}>
        <Text style={{ color: theme.colors.card, fontWeight: "bold" }}>Delete Workout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center:     { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg },
  headline:   { fontFamily: theme.fonts.headline, fontSize: 24, color: theme.colors.text },
  subHeader:  { fontSize: 16, color: theme.colors.accent },
  text:       { color: theme.colors.text, fontSize: 14, marginBottom: theme.spacing(1) },
  deleteBtn:  { marginTop: theme.spacing(4), backgroundColor: "#d9534f", paddingVertical: theme.spacing(3), borderRadius: 8, alignItems: "center" },
});
